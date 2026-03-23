// AXIS 견적엔진 V2 — VBA v73/v74/v76 완전 이식 통합판
// index.ts의 calcEstimate(간이판)을 확장하여 VBA 엔진과 1:1 대응
// 기존 calcEstimate는 하위호환 유지, 이 모듈은 신규 견적에서 사용

import {
  REGION_DB, PANEL_PRICE, PIPE_PRICE, MISC_PRICE,
  calcBBDeductRate, calcBOM, calcLabor, calcGate,
  makeDesign, getDustTier, type AssetType, type Design, type QuoteInput, type CalcOpts,
} from './index';
import { calcEquipmentCost, type EquipmentInput } from './equipmentCost';
import { calcTransportV3, type TransportInput, type TransportResult } from './transportV3';
import { applyPriceRules, type QuoteItem, type PriceRule, type PriceOverride } from './priceRule';
import { calcEnvAssessment, type EnvInput, type EnvScore } from './envAssessment';
import { runStructuralCheck, type StructuralInput, type StructuralResult } from './structuralCheck';

// ══════════════════════════════════════════
// V2 확장 입력
// ══════════════════════════════════════════
export interface QuoteInputV2 extends QuoteInput {
  address?: string;           // 현장 주소
  warehouseKey?: string;      // 출발 창고 "경기도|김포시"
  destKey?: string;           // 도착지 "서울특별시|강남구"
  noLargeTruck?: boolean;     // 대형차 진입불가
  constructionType?: '파이프' | 'H-빔';
  foundationType?: '기초파이프' | '앵커볼트' | '콘크리트';
  hbeamType?: '일반' | '대형';
  isBedrock?: boolean;
  needClean?: boolean;
  isNight?: boolean;
  pm10?: number;
}

export interface CalcOptsV2 extends CalcOpts {
  priceRules?: PriceRule[];
  priceOverrides?: PriceOverride[];
  runStructural?: boolean;
  runEnv?: boolean;
  windVo?: number;
}

// ══════════════════════════════════════════
// V2 확장 결과
// ══════════════════════════════════════════
export interface EstimateResultV2 {
  // 기본 비용
  matTotal: number;
  labTotal: number;
  eqpTotal: number;
  transTotal: number;
  gateTotal: number;

  // 바이백
  bbRefund: number;
  bbRate: number;

  // 합계
  subtotal: number;
  total: number;
  rounded: number;
  totalPerM: number;

  // 비율
  pctMat: number;
  pctLab: number;
  pctEqp: number;
  pctTrans: number;

  // M당 단가
  matM: number;
  labM: number;
  monthlyRent: number;
  dailyRent: number;

  // 상세
  bom: ReturnType<typeof calcBOM>;
  laborDetail: ReturnType<typeof calcLabor>;
  design: Design;
  equipmentDetail: ReturnType<typeof calcEquipmentCost>;
  transportDetail: TransportResult | null;

  // 단가규칙 적용 결과
  priceRuleApplied: boolean;
  adjustedMatTotal?: number;

  // 환경/구조 (선택적)
  envScore?: EnvScore;
  structuralResult?: StructuralResult;

  // 엔진 메타
  engineVersion: string;
  timestamp: string;
}

// ══════════════════════════════════════════
// 자재 무게/부피 DB (VBA 통합데이터 S/T 열 기반)
// ══════════════════════════════════════════
const ITEM_WEIGHT: Record<string, number> = {
  '주주파이프': 7.93,   // kg/개 (Φ48.6×2.4, 6M)
  '횡대파이프': 7.93,
  '지주파이프': 3.97,   // 3M
  '기초파이프': 6.0,
  '고정클램프': 0.8,
  '자동클램프': 0.9,
  '연결핀': 0.3,
  '스틸': 16.5,         // kg/장
  'RPP': 8.2,
  'EGI': 5.5,
  '분진망': 12.0,       // kg/롤
};

const ITEM_VOLUME: Record<string, number> = {
  '주주파이프': 0.012,  // m³/개
  '횡대파이프': 0.012,
  '지주파이프': 0.006,
  '기초파이프': 0.010,
  '고정클램프': 0.001,
  '자동클램프': 0.001,
  '연결핀': 0.001,
  '스틸': 0.020,
  'RPP': 0.015,
  'EGI': 0.012,
  '분진망': 0.050,
};

function getItemWeight(name: string): number {
  return ITEM_WEIGHT[name] ?? 5.0;
}

function getItemVolume(name: string): number {
  return ITEM_VOLUME[name] ?? 0.01;
}

// ══════════════════════════════════════════
// 메인: V2 견적 계산
// ══════════════════════════════════════════
export function calcEstimateV2(input: QuoteInputV2, opts: CalcOptsV2): EstimateResultV2 {
  const reg = REGION_DB[input.region] ?? REGION_DB['경기남부'];
  const isBB = input.contract === '바이백';
  const L = input.len;
  const dustH = opts.dustH ?? 0;
  const dustN = getDustTier(dustH);
  const constructionType = input.constructionType ?? '파이프';
  const isHBeam = constructionType === 'H-빔';

  // ═══ 1. Design ═══
  const design = makeDesign(input.h, input.floor, input.panel, false, dustN);

  // ═══ 2. BOM ═══
  const bom = calcBOM(L, input.h, input.panel, design, dustN);

  // ═══ 3. 자재비 + BB 차감 ═══
  const pg = (cat: string) => {
    if (input.asset === '전체신재') return '신재' as const;
    if (input.asset === '전체고재') return '고재' as const;
    if (input.asset === '판넬만신재') return cat === 'panel' ? '신재' as const : '고재' as const;
    if (input.asset === '파이프만신재') return cat === 'pipe' ? '신재' as const : '고재' as const;
    return '고재' as const;
  };

  const items = [
    { name: input.panel, qty: bom.panelQty, price: (PANEL_PRICE[input.panel] ?? {})[pg('panel')] ?? 5000, bbGrade: pg('panel'), cat: 'panel' },
    { name: '주주파이프', qty: bom.juju, price: PIPE_PRICE['주주파이프'][pg('pipe')], bbGrade: pg('pipe'), cat: 'pipe' },
    { name: '횡대파이프', qty: bom.hwCnt, price: PIPE_PRICE['횡대파이프'][pg('pipe')], bbGrade: pg('pipe'), cat: 'pipe' },
    { name: '지주파이프', qty: bom.jiuju, price: PIPE_PRICE['지주파이프'][pg('pipe')], bbGrade: pg('pipe'), cat: 'pipe' },
    { name: '기초파이프', qty: bom.gichoQty, price: PIPE_PRICE['기초파이프']['고재'], bbGrade: '고재' as const, cat: 'pipe' },
    { name: '고정클램프', qty: bom.gojung, price: MISC_PRICE['고정클램프'], bbGrade: '신재' as const, cat: 'clamp' },
    { name: '자동클램프', qty: bom.jadong, price: MISC_PRICE['자동클램프'], bbGrade: '신재' as const, cat: 'clamp' },
    { name: '연결핀', qty: bom.pin, price: MISC_PRICE['연결핀'], bbGrade: '신재' as const, cat: 'clamp' },
    { name: '분진망', qty: bom.dustRolls, price: MISC_PRICE['분진망'], bbGrade: '신재' as const, cat: 'misc' },
    { name: bom.specialName, qty: bom.specialQty, price: bom.specialPrice, bbGrade: '신재' as const, cat: 'misc' },
  ].filter(i => i.qty > 0 && i.name);

  let matTotal = 0;
  let bbRefund = 0;
  let totalWeight = 0;
  let totalVolume = 0;

  for (const it of items) {
    const amt = it.qty * it.price;
    matTotal += amt;
    totalWeight += it.qty * getItemWeight(it.name);
    totalVolume += it.qty * getItemVolume(it.name);
    if (isBB && opts.bbMonths > 0) {
      const rate = calcBBDeductRate(it.name, it.bbGrade, opts.bbMonths);
      bbRefund += Math.round(amt * rate);
    }
  }

  // ═══ 4. 노무비 ═══
  const labor = calcLabor(L, input.h, input.panel, design.span, isBB, dustH, isHBeam);
  const labTotal = labor.total;

  // ═══ 5. 장비비 (V2: 자동산출) ═══
  const eqpInput: EquipmentInput = {
    constructionType,
    panelType: input.panel as '스틸' | 'RPP' | 'EGI',
    panelHeight: input.h,
    totalLength: L,
    foundPipeQty: bom.gichoQty,
    needClean: input.needClean ?? false,
    isBedrock: input.isBedrock ?? false,
    isBuyback: isBB,
    hbeamType: input.hbeamType,
  };
  const equipmentDetail = calcEquipmentCost(eqpInput);
  const eqpTotal = equipmentDetail.totalCost;

  // ═══ 6. 운반비 (V3: 8차량 최적배차) ═══
  let transportDetail: TransportResult | null = null;
  let transTotal = 0;

  if (input.warehouseKey && input.destKey) {
    const transInput: TransportInput = {
      warehouseKey: input.warehouseKey,
      destKey: input.destKey,
      totalWeight,
      totalVolume,
      contractMode: isBB ? '바이백' : '일반판매',
      noLargeTruck: input.noLargeTruck ?? false,
    };
    transportDetail = calcTransportV3(transInput);
    transTotal = transportDetail?.totalCost ?? 0;
  } else {
    // 폴백: 기존 간이 운반비 (지역 거리 기반)
    const trucks = Math.max(2, Math.ceil(L / 90));
    const perTruck = Math.round(130000 + reg.dist * 900);
    const trips = isBB ? 2 : 1;
    transTotal = Math.round(trucks * perTruck * trips / 1000) * 1000;
  }

  // ═══ 7. 도어 ═══
  const gateResult = calcGate(opts.gate, opts.doorGrade, opts.doorW, input.h, opts.doorMesh);
  const gateTotal = gateResult.total;

  // 도어 BB 차감
  let gateBBRefund = 0;
  if (isBB && opts.bbMonths > 0 && gateTotal > 0 && opts.gate !== '없음') {
    const gateRate = calcBBDeductRate('양개도어', opts.doorGrade, opts.bbMonths);
    gateBBRefund = Math.round(gateResult.body * gateRate);
  }

  const totalBBRefund = bbRefund + gateBBRefund;

  // ═══ 8. 단가규칙 적용 ═══
  let adjustedMatTotal: number | undefined;
  let priceRuleApplied = false;

  if (opts.priceRules && opts.priceRules.length > 0) {
    const quoteItems: QuoteItem[] = items.map(it => ({
      caseId: '', itemKey: it.name, category: '자재',
      name: it.name, spec: '', unit: '개', material: '',
      autoQty: it.qty, autoPrice: it.price, autoAmount: it.qty * it.price,
    }));
    let adjustedTotal = 0;
    for (const qi of quoteItems) {
      const result = applyPriceRules(qi, opts.priceRules, opts.priceOverrides ?? []);
      adjustedTotal += result.finalAmount;
    }
    adjustedMatTotal = adjustedTotal;
    priceRuleApplied = true;
  }

  const effectiveMatTotal = adjustedMatTotal ?? matTotal;

  // ═══ 9. 합계 ═══
  const subtotal = effectiveMatTotal + labTotal + eqpTotal + transTotal + gateTotal;
  const total = subtotal - totalBBRefund;
  const rounded = Math.round(total / 10000) * 10000;

  // ═══ 10. 환경평가 (선택) ═══
  let envScore: EnvScore | undefined;
  if (opts.runEnv && input.region) {
    const envInput: EnvInput = {
      address: input.address ?? '',
      region: input.region,
      panelHeight: input.h,
      isNight: input.isNight ?? false,
      pm10: input.pm10,
    };
    envScore = calcEnvAssessment(envInput);
  }

  // ═══ 11. 구조검토 (선택) ═══
  let structuralResult: StructuralResult | undefined;
  if (opts.runStructural) {
    const strInput: StructuralInput = {
      panelHeight: input.h,
      span: design.span,
      totalLength: L,
      constructionType,
      panelType: input.panel as '스틸' | 'RPP' | 'EGI',
      wind: opts.windVo ? { Vo: opts.windVo } : undefined,
      isConcrete: input.foundationType === '콘크리트',
    };
    structuralResult = runStructuralCheck(strInput);
  }

  return {
    matTotal: effectiveMatTotal,
    labTotal, eqpTotal, transTotal, gateTotal,
    bbRefund: totalBBRefund,
    bbRate: effectiveMatTotal > 0 ? bbRefund / effectiveMatTotal : 0,
    subtotal, total, rounded,
    totalPerM: Math.round(total / L),
    pctMat: subtotal > 0 ? Math.round(effectiveMatTotal / subtotal * 100) : 0,
    pctLab: subtotal > 0 ? Math.round(labTotal / subtotal * 100) : 0,
    pctEqp: subtotal > 0 ? Math.round(eqpTotal / subtotal * 100) : 0,
    pctTrans: subtotal > 0 ? Math.round(transTotal / subtotal * 100) : 0,
    matM: Math.round(effectiveMatTotal / L),
    labM: labor.perM,
    monthlyRent: Math.round(effectiveMatTotal * 0.017),
    dailyRent: Math.round(effectiveMatTotal * 0.017 / 30),
    bom, laborDetail: labor, design,
    equipmentDetail, transportDetail,
    priceRuleApplied, adjustedMatTotal,
    envScore, structuralResult,
    engineVersion: 'v2.0-web',
    timestamp: new Date().toISOString(),
  };
}

// ══════════════════════════════════════════
// 8조합 매트릭스 V2
// ══════════════════════════════════════════
export function calc8MatrixV2(
  input: Omit<QuoteInputV2, 'asset' | 'contract'>,
  floor: string,
  opts: Partial<CalcOptsV2>,
) {
  const assets: AssetType[] = ['전체고재', '전체신재', '판넬만신재', '파이프만신재'];
  const baseOpts: CalcOptsV2 = {
    bbMonths: opts.bbMonths ?? 6,
    gate: opts.gate ?? '없음',
    doorGrade: (opts.doorGrade as '고재' | '신재') ?? '신재',
    doorW: opts.doorW ?? 4,
    doorMesh: opts.doorMesh ?? false,
    dustH: opts.dustH ?? 0,
    priceRules: opts.priceRules,
    priceOverrides: opts.priceOverrides,
    runStructural: opts.runStructural,
    runEnv: opts.runEnv,
  };

  const bbResults: Record<string, EstimateResultV2> = {};
  const sellResults: Record<string, EstimateResultV2> = {};

  for (const a of assets) {
    bbResults[a] = calcEstimateV2(
      { ...input, floor, asset: a, contract: '바이백' } as QuoteInputV2,
      baseOpts,
    );
    sellResults[a] = calcEstimateV2(
      { ...input, floor, asset: a, contract: '구매' } as QuoteInputV2,
      { ...baseOpts, bbMonths: 0 },
    );
  }

  return { bbResults, sellResults };
}
