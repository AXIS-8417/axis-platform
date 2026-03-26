/**
 * AXIS H빔 견적 엔진
 * VBA modStructural_v76 + modCalcEngine_v73 + modBOM_v73 완전 이식
 *
 * H빔 견적은 비계식과 완전히 다른 경로:
 *  구조타입판정 → H빔규격선정 → BOM(기초×2) → 노무비(추가단가) → 장비비(오거+해체장비)
 */

// ════════════════════════════════════════
// 상수 (modStructural_v76 lines 12-24)
// ════════════════════════════════════════
const PI = 3.14159265358979;
const RHO_AIR = 1.25;       // kg/m3 공기밀도
const FBA_HBEAM = 156;       // MPa H빔 SS400 ASD 허용휨응력
const GAMMA_SOIL = 18;       // kN/m3 토사단위중량
const PHI_DEFAULT = 25;      // 도 내부마찰각(N=5)
const FS_MIN = 1.5;          // 최소 전도안전율
const EMBED_START = 1.5;     // m 탐색시작
const EMBED_STEP = 0.1;      // m 탐색간격
const EMBED_MAX = 5.0;       // m 최대

// ════════════════════════════════════════
// H빔 규격 DB (fallback 6종, modStructural_v76 lines 214-223)
// ════════════════════════════════════════
export interface HBeamSpec {
  name: string;
  Zx: number;      // mm³ 단면계수
  flangeB: number;  // mm 플랜지폭
  weight: number;   // kg/m 단위중량
}

export const HBEAM_DB: HBeamSpec[] = [
  { name: 'H-148x100x6x9',   Zx: 132501,  flangeB: 100, weight: 21.1 },
  { name: 'H-194x150x6x9',   Zx: 266453,  flangeB: 150, weight: 30.6 },
  { name: 'H-200x200x8x12',  Zx: 461049,  flangeB: 200, weight: 49.9 },
  { name: 'H-250x250x9x14',  Zx: 846305,  flangeB: 250, weight: 72.4 },
  { name: 'H-300x300x10x15', Zx: 1328850, flangeB: 300, weight: 94.0 },
  { name: 'H-350x350x12x19', Zx: 1900000, flangeB: 350, weight: 137.0 },
];

// ════════════════════════════════════════
// 엔진 파라미터 (modCalcEngine_v73 lines 71-83)
// ════════════════════════════════════════
export const HBEAM_ENGINE_PARAMS = {
  기본설치단가: 2800,        // 원/M/높이m
  기본해체단가: 1800,        // 원/M/높이m
  H빔설치추가단가: 3500,    // 원/M
  H빔해체추가단가: 2500,    // 원/M
  H빔최소품: 450000,        // 원/일
  분진망설치단가: 1500,      // 원/M/단
  분진망해체단가: 1000,      // 원/M/단
};

// ════════════════════════════════════════
// 장비 단가 (modCalcEngine_v73 lines 527-592)
// ════════════════════════════════════════
export const EQUIP_PRICES = {
  크레인5톤: 786000,         // 원/일
  오거_일반: 950000,         // 원/일
  오거_암반: 1350000,        // 원/일
  에어컴프레셔: 280000,     // 원/일 (암반 시 추가)
  해체장비: 786000,          // 원/일 (바이백 시)
  오거_일반시공능력: 40,     // 본/일
  오거_암반시공능력: 25,     // 본/일
  해체시공능력: 60,          // 본/일
};

// ════════════════════════════════════════
// 1. 구조타입 판정 (modStructural_v76 line 64)
// ════════════════════════════════════════
export type StructureType = '비계식' | 'H빔식';

export function determineStructType(
  hTotal: number,
  userRequest?: string
): { type: StructureType; postType: string; basis: string } {
  // H_total >= 7M 또는 사용자가 "빔" 요청 → H빔
  if (hTotal >= 7 || (userRequest && userRequest.includes('빔'))) {
    return {
      type: 'H빔식',
      postType: 'H빔',
      basis: hTotal >= 7 ? '높이7m+자동전환' : '사용자H빔요청',
    };
  }
  return {
    type: '비계식',
    postType: '비계식',
    basis: '기본비계식(H<7m)',
  };
}

// ════════════════════════════════════════
// 2. 풍압력 산출 (modStructural_v76 CalcPf_v2)
// ════════════════════════════════════════
export function calcWindPressure(
  Vo: number,     // 기본풍속 m/s
  Kzr = 0.81,     // 지표면조도계수
  Kzt = 1.0,      // 지형계수
  Iw = 0.6,       // 중요도계수
  Gf = 2.2,       // 거스트계수
  Cf = 1.3        // 풍력계수
): number {
  // qz = 0.5 × ρ × (Vo × Kzr × Kzt × sqrt(Iw))²
  const Vd = Vo * Kzr * Kzt * Math.sqrt(Iw);
  const qz = 0.5 * RHO_AIR * Vd * Vd;
  // pf = qz × Gf × Cf (N/m²) → kN/m²
  return (qz * Gf * Cf) / 1000;
}

// ════════════════════════════════════════
// 3. 최소 근입깊이 산출 (modStructural_v76 line 98)
// ════════════════════════════════════════
export function calcMinEmbedDepth(
  hPanel: number,
  hDust: number,
  span: number,
  pfKN: number,
  phi: number,
  Df: number  // 기초 직경/2 (파이프: 0.3, H빔: flangeB/2000)
): { depth: number; Fs: number } {
  const Heff = hPanel + hDust;
  const phiRad = (phi * PI) / 180;
  const Kp = Math.tan(PI / 4 + phiRad / 2) ** 2;

  for (let d = EMBED_START; d <= EMBED_MAX; d += EMBED_STEP) {
    // 수평하중
    const Ph = pfKN * span * Heff;
    // 모멘트 (지표면 기준)
    const Mo = Ph * (Heff / 2 + d);
    // 수동토압 저항모멘트
    const Pp = 0.5 * GAMMA_SOIL * Kp * d * d;
    const Mr = Pp * (2 * Df) * (d / 3);

    const Fs = Mr / (Mo || 1);
    if (Fs >= FS_MIN) {
      return { depth: Math.round(d * 10) / 10, Fs: Math.round(Fs * 1000) / 1000 };
    }
  }
  return { depth: -1, Fs: 0 };
}

// ════════════════════════════════════════
// 4. H빔 최적 규격 선정 (modStructural_v76 line 154)
// ════════════════════════════════════════
export interface HBeamSelectionResult {
  spec: string;
  stressRatio: number;  // 응력비 (≤1.0 합격)
  Fs: number;           // 전도안전율
  embedDepth: number;   // 근입깊이 m
  Zx: number;
  flangeB: number;
  judge: 'PASS' | 'PASS/WARN' | 'N.G.(응력초과)' | 'N.G.(규격초과)' | 'N.G.(전도Fs미달)';
}

export function selectOptimalHBeam(
  hPanel: number,
  hDust: number,
  span: number,
  pfKN: number,
  hTotal: number,
  phi = PHI_DEFAULT
): HBeamSelectionResult {
  const Heff = hPanel + hDust;
  // 캔틸레버 모멘트 (풍하중)
  const M_post = pfKN * 1000 * span * Heff * Heff / 2; // N·m

  let lastStressRatio = 0;

  for (const beam of HBEAM_DB) {
    // 높이별 필터 (line 232-238)
    if (hTotal >= 6) {
      if (beam.name.includes('H-100') || beam.name.includes('H-125')) continue;
    }
    if (hTotal >= 7 && beam.name.includes('H-148')) continue;

    // 응력비
    const fb = (M_post * 1000) / beam.Zx; // MPa
    let stressRatio = fb / FBA_HBEAM;

    // 8M+ 안전계수 1.2 가산 (line 244)
    if (hTotal >= 8) stressRatio *= 1.2;

    lastStressRatio = stressRatio;

    // 전도안전율 검증
    const Df = beam.flangeB / 2000; // mm → m, 플랜지폭/2
    const embedResult = calcMinEmbedDepth(hPanel, hDust, span, pfKN, phi, Df);

    if (stressRatio <= 1.0 && embedResult.Fs >= FS_MIN) {
      let judge: HBeamSelectionResult['judge'] = 'PASS';
      if (stressRatio > 0.85 || hTotal >= 8) judge = 'PASS/WARN';

      return {
        spec: beam.name,
        stressRatio: Math.round(stressRatio * 10000) / 10000,
        Fs: embedResult.Fs,
        embedDepth: embedResult.depth,
        Zx: beam.Zx,
        flangeB: beam.flangeB,
        judge,
      };
    }
  }

  // 모든 규격 불합격
  return {
    spec: 'N.G._규격초과',
    stressRatio: Math.round(lastStressRatio * 10000) / 10000,
    Fs: 0,
    embedDepth: -1,
    Zx: 0,
    flangeB: 0,
    judge: 'N.G.(규격초과)',
  };
}

// ════════════════════════════════════════
// 5. H빔 BOM 산출 (modBOM_v73 line 340 + modStructural line 840)
// ════════════════════════════════════════
export interface HBeamBOM {
  hbeam: { spec: string; length: number; qty: number; unitPrice: number; total: number };
  횡대파이프: { qty: number; unitPrice: number; total: number };
  기초파이프: { qty: number; length: number; unitPrice: number; total: number };
  클램프: { qty: number; unitPrice: number; total: number };
  판넬: { qty: number; unitPrice: number; total: number };
  분진망?: { qty: number; unitPrice: number; total: number };
}

export function calcHBeamBOM(
  totalLength: number,
  panelHeight: number,
  span: number,
  hbeamResult: HBeamSelectionResult,
  panelType: 'RPP' | 'EGI' | '스틸',
  dustHeight: number,
  asset: '고재' | '신재',
): HBeamBOM {
  const spanCount = Math.ceil(totalLength / span) + 1; // 경간수 = 주주수
  const hbeamLen = panelHeight + (hbeamResult.embedDepth > 0 ? hbeamResult.embedDepth : 1.5);

  // H빔 단가 (중량 기반)
  const matchedBeam = HBEAM_DB.find(b => b.name === hbeamResult.spec);
  const weight = matchedBeam?.weight ?? 50;
  // ★ VBA DB_자재단가표 확정: H빔 1100원/kg (신재/고재 동일)
  const HBEAM_PRICE_PER_KG = 1100;
  const hbeamUnitPrice = Math.round(weight * hbeamLen * HBEAM_PRICE_PER_KG / 100) * 100;

  // 판넬
  const panelWidth = panelType === 'RPP' ? 0.67 : panelType === 'EGI' ? 0.55 : 1.98;
  const panelQty = Math.ceil(totalLength / panelWidth);
  const panelUnitPrice = panelType === 'RPP' ? (asset === '신재' ? 18500 : 15400)
    : panelType === 'EGI' ? (asset === '신재' ? 12000 : 9500)
    : (asset === '신재' ? 35000 : 28000);

  // 횡대 — H빔에서도 횡대는 필요 (판넬 고정용)
  // 확정표 기준 + H빔은 별도 (modBOM에서 horiQty 그대로 사용)
  const horiTier = panelHeight <= 3 ? 3 : panelHeight <= 5 ? Math.ceil(panelHeight) : Math.ceil(panelHeight) + 1;
  const dustTier = dustHeight <= 0 ? 0 : dustHeight <= 1.6 ? 1 : dustHeight <= 2.6 ? 2 : dustHeight <= 3.6 ? 3 : 4;
  const totalHoriTier = horiTier + dustTier;
  const horiPerSpan = Math.ceil(span / 6) * totalHoriTier;
  const horiQty = horiPerSpan * (spanCount - 1);
  const horiPrice = asset === '신재' ? 5500 : 4200;

  // 기초파이프: H빔은 주주수 × 2 (양쪽) — modBOM line 354-355
  const foundQty = spanCount * 2;
  // ★ 기초파이프 총길이 = 근입 + 노출 (높이별 동적)
  // 확정: H≤4→1.0M, H≤6→1.5M, H>6→2.0M
  const exposedLen = panelHeight <= 4 ? 1.0 : panelHeight <= 6 ? 1.5 : 2.0;
  const foundLength = hbeamResult.embedDepth > 0 ? hbeamResult.embedDepth + exposedLen : 2.0 + exposedLen;
  const foundPrice = asset === '신재' ? 12000 : 9200;

  // 클램프
  const clampQty = horiQty * 2; // 횡대당 2개
  const clampPrice = asset === '신재' ? 2200 : 1800;

  const result: HBeamBOM = {
    hbeam: {
      spec: hbeamResult.spec,
      length: Math.round(hbeamLen * 10) / 10,
      qty: spanCount,
      unitPrice: hbeamUnitPrice,
      total: hbeamUnitPrice * spanCount,
    },
    횡대파이프: { qty: horiQty, unitPrice: horiPrice, total: horiQty * horiPrice },
    기초파이프: { qty: foundQty, length: Math.round(foundLength * 10) / 10, unitPrice: foundPrice, total: foundQty * foundPrice },
    클램프: { qty: clampQty, unitPrice: clampPrice, total: clampQty * clampPrice },
    판넬: { qty: panelQty, unitPrice: panelUnitPrice, total: panelQty * panelUnitPrice },
  };

  // 분진망
  if (dustHeight > 0) {
    const dustRolls = Math.max(1, Math.ceil(totalLength / 40));
    result.분진망 = { qty: dustRolls, unitPrice: 15000, total: dustRolls * 15000 };
  }

  return result;
}

// ════════════════════════════════════════
// 6. H빔 노무비 산출 (modCalcEngine_v73 lines 88-214)
// ════════════════════════════════════════
export interface HBeamLaborCost {
  설치비: number;
  해체비: number;
  분진망설치비: number;
  분진망해체비: number;
  최소품보정: number;
  합계: number;
  details: {
    기본설치: number;
    H빔추가설치: number;
    기본해체: number;
    H빔추가해체: number;
  };
}

export function calcHBeamLabor(
  totalLength: number,
  panelHeight: number,
  dustHeight: number,
  dustTier: number,
  contractType: 'BB' | 'SELL',
  isBedrock = false,
): HBeamLaborCost {
  const p = HBEAM_ENGINE_PARAMS;

  // 설치비 M당 = 판넬높이 × 기본설치단가 + H빔설치추가단가
  const instBase = panelHeight * p.기본설치단가;
  const instHbeam = p.H빔설치추가단가;
  const instPerM = instBase + instHbeam;
  const instTotal = instPerM * totalLength;

  // 해체비 M당 = 판넬높이 × 기본해체단가 + H빔해체추가단가
  const demoBase = panelHeight * p.기본해체단가;
  const demoHbeam = p.H빔해체추가단가;
  const demoPerM = demoBase + demoHbeam;
  const demoTotal = contractType === 'BB' ? demoPerM * totalLength : 0;

  // 분진망 설치비/해체비 (확정본 BOM 규칙)
  let dustInst = 0;
  let dustDemo = 0;
  if (dustHeight > 0) {
    const dustInstUnit = dustHeight >= 2.0
      ? (dustTier * p.분진망설치단가) + p.분진망설치단가  // H≥2.0M: +1500 추가
      : dustTier * p.분진망설치단가;
    dustInst = dustInstUnit * totalLength;

    if (contractType === 'BB') {
      const dustDemoUnit = dustHeight >= 2.0
        ? (dustTier * p.분진망해체단가) + p.분진망해체단가
        : dustTier * p.분진망해체단가;
      dustDemo = dustDemoUnit * totalLength;
    }
  }

  // 최소품 보정 (line 198-206)
  const baseDays = isBedrock ? 2 : 1;
  const minCost = p.H빔최소품 * baseDays;
  const instSub = instTotal + dustInst;
  const minGuard = Math.max(0, minCost - instSub);

  const total = instTotal + demoTotal + dustInst + dustDemo + minGuard;

  return {
    설치비: instTotal,
    해체비: demoTotal,
    분진망설치비: dustInst,
    분진망해체비: dustDemo,
    최소품보정: minGuard,
    합계: total,
    details: {
      기본설치: instBase * totalLength,
      H빔추가설치: instHbeam * totalLength,
      기본해체: demoBase * totalLength,
      H빔추가해체: demoHbeam * totalLength,
    },
  };
}

// ════════════════════════════════════════
// 7. H빔 장비비 산출 (modCalcEngine_v73 lines 536-597)
// ════════════════════════════════════════
export interface HBeamEquipCost {
  크레인: { days: number; price: number; total: number };
  오거: { days: number; price: number; total: number; type: string };
  에어컴프레셔?: { days: number; price: number; total: number };
  해체장비?: { days: number; price: number; total: number };
  합계: number;
}

export function calcHBeamEquip(
  hbeamQty: number,      // H빔 본수
  totalLength: number,
  contractType: 'BB' | 'SELL',
  isBedrock = false,
): HBeamEquipCost {
  const eq = EQUIP_PRICES;

  // 크레인 (비계식과 동일, 총연장 기준)
  const craneDays = totalLength <= 100 ? 1 : totalLength <= 250 ? 2 : Math.ceil(totalLength / 150);
  const crane = { days: craneDays, price: eq.크레인5톤, total: craneDays * eq.크레인5톤 };

  // 오거 (H빔 항타)
  const ogaCapacity = isBedrock ? eq.오거_암반시공능력 : eq.오거_일반시공능력;
  const ogaDays = Math.max(1, Math.ceil(hbeamQty / ogaCapacity));
  const ogaPrice = isBedrock ? eq.오거_암반 : eq.오거_일반;
  const oger = { days: ogaDays, price: ogaPrice, total: ogaDays * ogaPrice, type: isBedrock ? '암반오거' : '일반오거' };

  let total = crane.total + oger.total;
  const result: HBeamEquipCost = { 크레인: crane, 오거: oger, 합계: 0 };

  // 암반 시 에어컴프레셔 추가
  if (isBedrock) {
    const comp = { days: ogaDays, price: eq.에어컴프레셔, total: ogaDays * eq.에어컴프레셔 };
    result.에어컴프레셔 = comp;
    total += comp.total;
  }

  // 바이백 시 해체장비 (line 586-597)
  if (contractType === 'BB' && hbeamQty > 0) {
    const demoDays = Math.max(1, Math.ceil(hbeamQty / eq.해체시공능력));
    const demo = { days: demoDays, price: eq.해체장비, total: demoDays * eq.해체장비 };
    result.해체장비 = demo;
    total += demo.total;
  }

  result.합계 = total;
  return result;
}

// ════════════════════════════════════════
// 8. H빔 통합 견적 (전체 파이프라인)
// ════════════════════════════════════════
export interface HBeamEstimateInput {
  location: string;
  totalLength: number;    // 총연장 M
  panelType: 'RPP' | 'EGI' | '스틸';
  panelHeight: number;    // 판넬높이 M
  span: number;           // 경간 M (기본 3.0)
  dustHeight: number;     // 분진망 높이 M
  asset: '고재' | '신재';
  contractType: 'BB' | 'SELL';
  bbMonths?: number;
  constructionType?: '비계식' | 'H빔식' | '자동';  // 사용자 선택
  Vo?: number;            // 기본풍속 (없으면 지역DB)
  isBedrock?: boolean;    // 암반 여부
}

export interface HBeamEstimateResult {
  structureType: StructureType;
  structureBasis: string;
  hbeamSelection: HBeamSelectionResult;
  bom: HBeamBOM;
  labor: HBeamLaborCost;
  equip: HBeamEquipCost;
  자재비합계: number;
  노무비합계: number;
  장비비합계: number;
  총공급가액: number;
  M당재료비: number;
  M당노무비: number;
  M당장비비: number;
}

export function calcHBeamEstimate(input: HBeamEstimateInput): HBeamEstimateResult {
  const {
    totalLength, panelType, panelHeight, span = 3.0,
    dustHeight = 0, asset, contractType, Vo = 26, isBedrock = false,
    constructionType = '자동',
  } = input;

  const hTotal = panelHeight + dustHeight;

  // 1. 구조타입 판정
  const struct = constructionType === 'H빔식'
    ? determineStructType(hTotal, '빔')
    : constructionType === '비계식'
      ? determineStructType(0) // 강제 비계식
      : determineStructType(hTotal);

  // 2. 풍압력
  const pfKN = calcWindPressure(Vo);

  // 3. H빔 규격 선정
  const hbeamSelection = selectOptimalHBeam(panelHeight, dustHeight, span, pfKN, hTotal);

  // 4. BOM
  const bom = calcHBeamBOM(totalLength, panelHeight, span, hbeamSelection, panelType, dustHeight, asset);

  // 5. 노무비
  const dustTier = dustHeight <= 0 ? 0 : dustHeight <= 1.6 ? 1 : dustHeight <= 2.6 ? 2 : dustHeight <= 3.6 ? 3 : 4;
  const labor = calcHBeamLabor(totalLength, panelHeight, dustHeight, dustTier, contractType, isBedrock);

  // 6. 장비비
  const equip = calcHBeamEquip(bom.hbeam.qty, totalLength, contractType, isBedrock);

  // 7. 집계
  const 자재비합계 = bom.hbeam.total + bom.횡대파이프.total + bom.기초파이프.total
    + bom.클램프.total + bom.판넬.total + (bom.분진망?.total ?? 0);
  const 노무비합계 = labor.합계;
  const 장비비합계 = equip.합계;
  const 총공급가액 = 자재비합계 + 노무비합계 + 장비비합계;

  // M당 단가 (백원 절사)
  const M당재료비 = Math.floor(자재비합계 / totalLength / 100) * 100;
  const M당노무비 = Math.floor(노무비합계 / totalLength / 100) * 100;
  const M당장비비 = Math.floor(장비비합계 / totalLength / 100) * 100;

  return {
    structureType: struct.type,
    structureBasis: struct.basis,
    hbeamSelection,
    bom,
    labor,
    equip,
    자재비합계,
    노무비합계,
    장비비합계,
    총공급가액,
    M당재료비,
    M당노무비,
    M당장비비,
  };
}
