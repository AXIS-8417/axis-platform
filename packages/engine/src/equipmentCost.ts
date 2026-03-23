// AXIS 장비비 자동산출 엔진 — modCalcEngine_v73 CalculateEquipmentCosts 기반
// VBA 원본 대조 완료: 굴착기/스카이/크레인/오가/콤프레샤/해체장비

export interface EquipmentInput {
  constructionType: '파이프' | 'H-빔';
  panelType: '스틸' | 'RPP' | 'EGI';
  panelHeight: number;       // M
  totalLength: number;       // M
  foundPipeQty: number;      // 기초파이프 수량
  needClean: boolean;        // 정리작업 필요
  isBedrock: boolean;        // 암반 여부
  isBuyback: boolean;        // 바이백
  hbeamType?: '일반' | '대형'; // H빔 규격
}

export interface EquipmentItem {
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
  basis: string;
}

export interface EquipmentResult {
  items: EquipmentItem[];
  totalCost: number;
}

// ══════════════════════════════════════════
// 장비 기본단가 (VBA 하드코딩 + GetEngineParam 폴백)
// ══════════════════════════════════════════
const EQP_PRICES = {
  굴착기_기본: 600000,
  굴착기_해머: 100000,
  굴착기_연료: 15000,
  스카이_기본: 350000,
  스카이_연료: 50000,
  크레인5톤_기본: 450000,
  크레인5톤_연료: 50000,
  오가_일반_기본: 800000,
  오가_일반_연료: 80000,
  오가_대형_기본: 1200000,
  오가_대형_연료: 120000,
  콤프레샤_기본: 250000,
  콤프레샤_연료: 30000,
} as const;

// ══════════════════════════════════════════
// 1. 굴착기 산출
// ══════════════════════════════════════════
function calcExcavator(input: EquipmentInput): EquipmentItem | null {
  if (input.constructionType !== '파이프') return null;

  // 기초 파이프 200개당 1대
  let qty = Math.max(1, Math.ceil(input.foundPipeQty / 200));

  // 총연장 1000M 이상: +1대
  if (input.totalLength >= 1000) qty += 1;

  // 정리작업: +1대
  if (input.needClean) qty += 1;

  const base = EQP_PRICES.굴착기_기본;
  const hammer = EQP_PRICES.굴착기_해머;
  const fuel = EQP_PRICES.굴착기_연료;
  const unitPrice = Math.round((base + hammer + fuel) * 1.1 / 1000) * 1000;

  return {
    name: '굴착기(0.08㎥)',
    unit: '대',
    qty,
    unitPrice,
    total: unitPrice * qty,
    basis: `기초파이프${input.foundPipeQty}개÷200 + 보정`,
  };
}

// ══════════════════════════════════════════
// 2. 스카이 산출
// ══════════════════════════════════════════
function calcSky(input: EquipmentInput): EquipmentItem | null {
  const h = input.panelHeight;
  const panel = input.panelType;

  // 조건: 스틸 H>=4, RPP H>=7, EGI H>4
  let needed = false;
  if (panel === '스틸' && h >= 4) needed = true;
  if (panel === 'RPP' && h >= 7) needed = true;
  if (panel === 'EGI' && h > 4) needed = true;

  if (!needed) return null;

  // 높이별 일일 시공거리
  let dailyDist: number;
  if (h <= 4) dailyDist = 120;
  else if (h <= 6) dailyDist = 80;
  else if (h <= 8) dailyDist = 60;
  else dailyDist = 40;

  const qty = Math.max(1, Math.ceil(input.totalLength / dailyDist));
  const base = EQP_PRICES.스카이_기본;
  const fuel = EQP_PRICES.스카이_연료;
  const unitPrice = Math.round((base + fuel) * 1.1 / 1000) * 1000;

  return {
    name: '스카이차',
    unit: '대',
    qty,
    unitPrice,
    total: unitPrice * qty,
    basis: `H=${h}M, 일시공${dailyDist}M, 총${input.totalLength}M`,
  };
}

// ══════════════════════════════════════════
// 3. 5톤 크레인 산출
// ══════════════════════════════════════════
function calcCrane(input: EquipmentInput): EquipmentItem | null {
  // RPP H>=7 only
  if (input.panelType !== 'RPP' || input.panelHeight < 7) return null;

  const qty = Math.max(1, Math.ceil(input.totalLength / 150));
  const base = EQP_PRICES.크레인5톤_기본;
  const fuel = EQP_PRICES.크레인5톤_연료;
  const unitPrice = Math.round((base + fuel) * 1.1 / 1000) * 1000;

  return {
    name: '5톤크레인',
    unit: '대',
    qty,
    unitPrice,
    total: unitPrice * qty,
    basis: `RPP H=${input.panelHeight}M>=7`,
  };
}

// ══════════════════════════════════════════
// 4. 오가 산출
// ══════════════════════════════════════════
function calcOga(input: EquipmentInput): EquipmentItem | null {
  if (input.constructionType !== 'H-빔') return null;

  const isLarge = input.hbeamType === '대형';
  const base = isLarge ? EQP_PRICES.오가_대형_기본 : EQP_PRICES.오가_일반_기본;
  const fuel = isLarge ? EQP_PRICES.오가_대형_연료 : EQP_PRICES.오가_일반_연료;

  // 암반: 연료 ×2
  const actualFuel = input.isBedrock ? fuel * 2 : fuel;

  const dailyDist = isLarge ? 30 : 50;
  const qty = Math.max(1, Math.ceil(input.totalLength / dailyDist));
  const unitPrice = Math.round((base + actualFuel) * 1.1 / 1000) * 1000;

  return {
    name: isLarge ? '대형오가' : '오가',
    unit: '대',
    qty,
    unitPrice,
    total: unitPrice * qty,
    basis: `H-빔식 ${isLarge ? '대형' : '일반'}, ${input.isBedrock ? '암반' : '일반토'}`,
  };
}

// ══════════════════════════════════════════
// 5. 콤프레샤 산출
// ══════════════════════════════════════════
function calcCompressor(input: EquipmentInput): EquipmentItem | null {
  // 대형오가 + 암반일 때만
  if (input.constructionType !== 'H-빔') return null;
  if (input.hbeamType !== '대형' || !input.isBedrock) return null;

  const base = EQP_PRICES.콤프레샤_기본;
  const fuel = EQP_PRICES.콤프레샤_연료;
  const qty = Math.max(1, Math.ceil(input.totalLength / 30));
  const unitPrice = Math.round((base + fuel) * 1.1 / 1000) * 1000;

  return {
    name: '콤프레샤',
    unit: '대',
    qty,
    unitPrice,
    total: unitPrice * qty,
    basis: '대형오가+암반',
  };
}

// ══════════════════════════════════════════
// 6. 해체용 장비 산출
// ══════════════════════════════════════════
function calcDemoEquip(input: EquipmentInput): EquipmentItem | null {
  // H-빔 + 바이백일 때만
  if (input.constructionType !== 'H-빔' || !input.isBuyback) return null;

  const base = EQP_PRICES.굴착기_기본;
  const fuel = EQP_PRICES.굴착기_연료;
  const qty = Math.max(1, Math.ceil(input.totalLength / 80));
  const unitPrice = Math.round((base + fuel) * 1.1 / 1000) * 1000;

  return {
    name: '해체용장비(굴착기)',
    unit: '대',
    qty,
    unitPrice,
    total: unitPrice * qty,
    basis: 'H-빔+바이백 해체',
  };
}

// ══════════════════════════════════════════
// 메인: 장비비 자동산출
// ══════════════════════════════════════════
export function calcEquipmentCost(input: EquipmentInput): EquipmentResult {
  const calculators = [
    calcExcavator, calcSky, calcCrane, calcOga, calcCompressor, calcDemoEquip,
  ];

  const items: EquipmentItem[] = [];
  for (const calc of calculators) {
    const item = calc(input);
    if (item && item.qty > 0 && item.total > 0) {
      items.push(item);
    }
  }

  return {
    items,
    totalCost: items.reduce((sum, it) => sum + it.total, 0),
  };
}
