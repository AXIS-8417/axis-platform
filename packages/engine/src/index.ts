// AXIS 견적엔진 v2.1 — 확정규칙 전면 반영 (v2.0→v2.1 BUG-01~06 수정)

// ══════════════════════════════════════════
// 지역 DB
// ══════════════════════════════════════════
export const REGION_DB: Record<string, { Vo: number; dist: number; rc: number }> = {
  서울:{Vo:26,dist:5,rc:1.15}, 경기북부:{Vo:26,dist:35,rc:1.00}, 경기남부:{Vo:26,dist:45,rc:1.00},
  경기서해안:{Vo:28,dist:65,rc:1.05}, 인천:{Vo:28,dist:35,rc:1.05}, 강원내륙:{Vo:24,dist:130,rc:1.10},
  강원해안:{Vo:34,dist:165,rc:1.20}, 충청:{Vo:28,dist:130,rc:1.08}, 충남서해:{Vo:34,dist:165,rc:1.12},
  전라:{Vo:30,dist:280,rc:1.10}, 경상:{Vo:30,dist:320,rc:1.10}, 부산:{Vo:38,dist:400,rc:1.15}, 제주:{Vo:42,dist:510,rc:1.30},
};

// ══════════════════════════════════════════
// 자재 단가 — 엑셀 통합데이터 마스터 완전 반영
// ══════════════════════════════════════════

// ── 파이프 규격별 단가 (통합데이터 N~R열, 16개 규격) ──
const PIPE_SPEC_PRICE: Record<string, { 신재: number; 고재: number; kg: number; cbm: number }> = {
  '1.5M×2.3T': { 신재: 5300, 고재: 4500, kg: 3.93, cbm: 0.0005 },
  '1.5M×1.8T': { 신재: 4000, 고재: 0,    kg: 3.14, cbm: 0.0004 },
  '1.8M×2.3T': { 신재: 6300, 고재: 5200, kg: 4.72, cbm: 0.0006 },
  '1.8M×1.8T': { 신재: 4700, 고재: 0,    kg: 3.77, cbm: 0.00048 },
  '2.0M×2.3T': { 신재: 6900, 고재: 5800, kg: 5.24, cbm: 0.00066 },
  '2.0M×1.8T': { 신재: 5200, 고재: 0,    kg: 4.19, cbm: 0.00053 },
  '2.4M×2.3T': { 신재: 8200, 고재: 6800, kg: 6.29, cbm: 0.0008 },
  '2.4M×1.8T': { 신재: 6100, 고재: 0,    kg: 5.03, cbm: 0.00064 },
  '3.0M×2.3T': { 신재: 10200, 고재: 8400, kg: 7.86, cbm: 0.001 },
  '3.0M×1.8T': { 신재: 7500, 고재: 0,    kg: 6.29, cbm: 0.0008 },
  '4.0M×2.3T': { 신재: 13400, 고재: 11000, kg: 10.48, cbm: 0.00133 },
  '4.0M×1.8T': { 신재: 9800, 고재: 0,    kg: 8.38, cbm: 0.00106 },
  '5.0M×2.3T': { 신재: 16600, 고재: 13700, kg: 13.1, cbm: 0.00166 },
  '5.0M×1.8T': { 신재: 12200, 고재: 0,    kg: 10.48, cbm: 0.00133 },
  '6.0M×2.3T': { 신재: 19300, 고재: 15800, kg: 15.72, cbm: 0.00199 },
  '6.0M×1.8T': { 신재: 14000, 고재: 0,    kg: 12.58, cbm: 0.00159 },
};

// 파이프 종류별 규격 결정 (VBA GetAutoSpec 로직)
function getPipeSpec(pipeType: string, h: number, gichoLen: number | null): string {
  const t = '2.3T'; // 기본 두께
  if (pipeType === '횡대파이프') return `6.0M×${t}`;
  if (pipeType === '기초파이프') {
    const len = gichoLen ?? 1.5;
    return `${len.toFixed(1)}M×${t}`;
  }
  if (pipeType === '주주파이프') {
    // 주주 길이 = 높이 (+ 분진망 높이는 BOM에서 별도 처리)
    const postLen = h <= 1.5 ? 1.5 : h <= 1.8 ? 1.8 : h <= 2 ? 2.0 : h <= 2.4 ? 2.4 : h <= 3 ? 3.0 : h <= 4 ? 4.0 : h <= 5 ? 5.0 : 6.0;
    return `${postLen.toFixed(1)}M×${t}`;
  }
  if (pipeType === '지주파이프') {
    // 지주 = 높이에 따라 (4M→3M, 5M→4M, 나머지=높이)
    const jiLen = h <= 2 ? 2.0 : h <= 3 ? 3.0 : h <= 4 ? 3.0 : h <= 5 ? 4.0 : h <= 6 ? 5.0 : 6.0;
    return `${jiLen.toFixed(1)}M×${t}`;
  }
  return `3.0M×${t}`; // 폴백
}

export function getPipePrice(pipeType: string, grade: '신재' | '고재', h: number, gichoLen: number | null): number {
  const spec = getPipeSpec(pipeType, h, gichoLen);
  const data = PIPE_SPEC_PRICE[spec];
  if (!data) return 10000; // 폴백
  const price = data[grade];
  if (price === 0 && grade === '고재') return data.신재; // 1.8T 고재 없으면 신재가
  return price;
}

export function getPipeWeight(pipeType: string, h: number, gichoLen: number | null): { kg: number; cbm: number } {
  const spec = getPipeSpec(pipeType, h, gichoLen);
  const data = PIPE_SPEC_PRICE[spec];
  return data ? { kg: data.kg, cbm: data.cbm } : { kg: 10, cbm: 0.001 };
}

// ── 판넬 단가 (높이별 — 엑셀 통합데이터) ──
const RPP_PRICE: Record<string, Record<number, number>> = {
  신재: { 2: 10000, 3: 15000, 4: 20000, 5: 25000, 6: 30000, 7: 35000, 8: 40000, 9: 45000, 10: 50000 },
  고재: { 2: 5500, 3: 8300, 4: 11000, 5: 13800, 6: 16500, 7: 19300, 8: 22000, 9: 24800, 10: 27500 },
};
const EGI_PRICE_BY_H: Record<string, Record<number, number>> = {
  신재: { 1: 7000, 2: 11000, 3: 16500, 4: 22000, 5: 9000, 6: 9000, 7: 9000, 8: 9000, 9: 9000, 10: 9000 },
  고재: { 1: 4000, 2: 4400, 3: 6700, 4: 12000, 5: 3000, 6: 3000, 7: 3000, 8: 3000, 9: 3000, 10: 3000 },
};
export const PANEL_PRICE: Record<string, Record<string, number>> = {
  '스틸': { 신재: 21000, 고재: 15000 },  // ★ 고재 15,000 (5,000→수정)
  RPP:   { 신재: 15000, 고재: 8300 },   // 기본값 (높이별은 getPanelPrice)
  EGI:   { 신재: 9000,  고재: 3000 },
};

function egiPriceKey(h: number): number {
  if (h <= 1.4) return 1;
  if (h <= 2) return 2;
  if (h <= 3) return 3;
  if (h <= 4) return 4;
  return Math.floor(h);
}

export function getPanelPrice(panel: string, grade: '신재' | '고재', h: number): number {
  if (panel === 'RPP') {
    const hKey = Math.max(2, Math.min(10, Math.floor(h)));
    return RPP_PRICE[grade]?.[hKey] ?? PANEL_PRICE.RPP[grade] ?? 8300;
  }
  if (panel === 'EGI') {
    const key = egiPriceKey(h);
    return EGI_PRICE_BY_H[grade]?.[key] ?? PANEL_PRICE.EGI[grade] ?? 3000;
  }
  return (PANEL_PRICE[panel] ?? {})[grade] ?? 5000;
}

// ── 클램프/부자재 단가 (고재/신재 구분 — 엑셀 통합데이터) ──
export const CLAMP_PRICE: Record<string, Record<string, number>> = {
  고정클램프: { 신재: 1800, 고재: 1200 },
  자동클램프: { 신재: 1900, 고재: 1300 },
  싱글클램프: { 신재: 1200, 고재: 1200 },
  연결핀:     { 신재: 1200, 고재: 900 },
};
export const MISC_PRICE: Record<string, number> = {
  분진망: 15000, 굴착기: 720000,
  양개조이너: 400, 후크볼트: 150,  // ★ 엑셀 실제값 반영
  베이스판: 4000, 세트앙카: 2500, 전산볼트: 3000,
  'H-BAR': 15000,
};

// 하위호환용 (기존 코드가 PIPE_PRICE 참조하는 곳 대비)
export const PIPE_PRICE: Record<string, Record<string, number>> = {
  주주파이프: { 신재: 10200, 고재: 8400 },  // 3M 기준 기본값
  횡대파이프: { 신재: 19300, 고재: 15800 },
  지주파이프: { 신재: 10200, 고재: 8400 },
  기초파이프: { 신재: 5300, 고재: 4500 },
};

// ══════════════════════════════════════════
// BB 파라미터 (No.59) — BUG-06: init=차감률
// ══════════════════════════════════════════
const BB_PARAMS: Record<string, Record<string, {init:number,r1:number,r2?:number,piv?:number,fl:number}>> = {
  // ── 파이프류 ──
  주주파이프:  { 고재:{init:0.78,r1:0.016,fl:0.15}, 신재:{init:0.69,r1:0.016,r2:0.008,piv:12,fl:0.15} },
  횡대파이프:  { 고재:{init:0.75,r1:0.017,fl:0.10}, 신재:{init:0.66,r1:0.017,r2:0.009,piv:12,fl:0.10} },
  연장파이프:  { 고재:{init:0.70,r1:0.017,fl:0.05}, 신재:{init:0.61,r1:0.017,r2:0.009,piv:12,fl:0.05} },
  지주파이프:  { 고재:{init:0.68,r1:0.019,fl:0.05}, 신재:{init:0.59,r1:0.019,r2:0.010,piv:12,fl:0.05} },
  보조지주:   { 고재:{init:0.65,r1:0.019,fl:0.03}, 신재:{init:0.56,r1:0.019,r2:0.010,piv:12,fl:0.03} },
  단관파이프:  { 고재:{init:0.73,r1:0.017,fl:0.08}, 신재:{init:0.64,r1:0.017,r2:0.009,piv:12,fl:0.08} },
  // ── H빔 ──
  H빔:       { 고재:{init:0.72,r1:0.016,fl:0.10}, 신재:{init:0.63,r1:0.016,r2:0.008,piv:12,fl:0.10} },
  // ── 부자재 ──
  고정클램프:  { 고재:{init:0.55,r1:0.020,fl:0.00}, 신재:{init:0.46,r1:0.020,r2:0.010,piv:12,fl:0.00} },
  자동클램프:  { 고재:{init:0.50,r1:0.020,fl:0.00}, 신재:{init:0.41,r1:0.020,r2:0.010,piv:12,fl:0.00} },
  싱글클램프:  { 고재:{init:0.55,r1:0.020,fl:0.00}, 신재:{init:0.46,r1:0.020,r2:0.010,piv:12,fl:0.00} },
  연결핀:     { 고재:{init:0.45,r1:0.022,fl:0.00}, 신재:{init:0.36,r1:0.022,r2:0.011,piv:12,fl:0.00} },
  '후크B/N':  { 고재:{init:0.40,r1:0.022,fl:0.00}, 신재:{init:0.31,r1:0.022,r2:0.011,piv:12,fl:0.00} },
  양개조이너:  { 고재:{init:0.45,r1:0.020,fl:0.00}, 신재:{init:0.36,r1:0.020,r2:0.010,piv:12,fl:0.00} },
  세트앙카:   { 고재:{init:0.30,r1:0.020,fl:0.00}, 신재:{init:0.21,r1:0.020,r2:0.010,piv:12,fl:0.00} },
  베이스판:   { 고재:{init:0.45,r1:0.020,fl:0.00}, 신재:{init:0.36,r1:0.020,r2:0.010,piv:12,fl:0.00} },
  // ── 판넬류 ──
  RPP:        { 고재:{init:0.72,r1:0.019,fl:0.04}, 신재:{init:0.47,r1:0.019,r2:0.010,piv:12,fl:0.04} },
  EGI:        { 고재:{init:0.70,r1:0.020,fl:0.05}, 신재:{init:0.45,r1:0.020,r2:0.010,piv:12,fl:0.05} },
  '스틸':     { 고재:{init:0.60,r1:0.019,fl:0.04}, 신재:{init:0.35,r1:0.019,r2:0.010,piv:12,fl:0.04} },
  // ── 도어 ──
  양개도어:   { 고재:{init:0.60,r1:0.019,fl:0.00}, 신재:{init:0.51,r1:0.019,r2:0.010,piv:12,fl:0.00} },
  // ── 소모성 (BB 없음) ──
  분진망:     { 고재:{init:0,r1:0,fl:0}, 신재:{init:0,r1:0,fl:0} },
  기초파이프:  { 고재:{init:0,r1:0,fl:0}, 신재:{init:0,r1:0,fl:0} },
};

// BB차감률 = MAX(fl, init - r1*n) → 취득가 × 이 값 = 차감액
export function calcBBDeductRate(itemName: string, grade: string, months: number): number {
  if (months <= 0) return 0;
  const p = BB_PARAMS[itemName]?.[grade];
  if (!p || p.init === 0) return 0;
  if (grade === '신재' && p.r2 && p.piv) {
    const dep = months <= p.piv ? p.r1 * months : p.r1 * p.piv + p.r2! * (months - p.piv!);
    return Math.max(p.fl, Math.round((p.init - dep) * 1000) / 1000);
  }
  return Math.max(p.fl, Math.round((p.init - p.r1 * months) * 1000) / 1000);
}

// ══════════════════════════════════════════
// 자산구분별 등급 매핑
// ══════════════════════════════════════════
export type AssetType = '전체고재' | '전체신재' | '판넬만신재' | '파이프만신재';
// 단가 등급: 클램프/연결핀은 항상 신재 단가
function getPriceGrade(cat: 'panel'|'pipe'|'clamp', asset: AssetType): '신재'|'고재' {
  if (cat === 'clamp') return '신재'; // 단가는 항상 신재
  if (asset === '전체신재') return '신재';
  if (asset === '전체고재') return '고재';
  if (asset === '판넬만신재') return cat === 'panel' ? '신재' : '고재';
  if (asset === '파이프만신재') return cat === 'pipe' ? '신재' : '고재';
  return '고재';
}
// BB 등급: 부자재(클램프/연결핀)는 자산구분 무관 항상 신재 rate
function getBBGrade(cat: 'panel'|'pipe'|'clamp', asset: AssetType): '신재'|'고재' {
  if (cat === 'clamp') return '신재'; // ★ 부자재는 항상 신재 BB율
  if (asset === '전체신재') return '신재';
  if (asset === '전체고재') return '고재';
  if (asset === '판넬만신재') return cat === 'panel' ? '신재' : '고재';
  if (asset === '파이프만신재') return cat === 'pipe' ? '신재' : '고재';
  return '고재';
}
// 하위호환
function getGrade(cat: 'panel'|'pipe'|'clamp', asset: AssetType): '신재'|'고재' {
  return getPriceGrade(cat, asset);
}

// ══════════════════════════════════════════
// 횡대 기본단수 (★ v2.1: h>=4 조건)
// ══════════════════════════════════════════
export function getBaseHwangdae(h: number, panel: string): number {
  let base = h<=2?2:h<=3?3:h<=4?3:h<=5?4:h<=6?5:h<=7?6:h<=8?7:h<=9?8:9;
  if (panel === '스틸' && Math.floor(h) === 4) base = 4;
  if (panel === 'EGI' && h > 4) base += 1;
  return base;
}

export function getDustTier(dustH: number): number {
  if (dustH <= 0) return 0;
  if (dustH <= 1.6) return 1;
  if (dustH <= 2.6) return 2;
  if (dustH <= 3.6) return 3;
  return 4;
}

// 표준형 횡대 확정 테이블 (절대 변경 불가)
const STD_HWANGDAE: Record<number, number> = {
  1: 2, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5, 7: 7, 8: 8,
};

export function getFinalHwangdae(h: number, panel: string, isStd: boolean, dustN: number): number {
  if (isStd) {
    const stdBase = STD_HWANGDAE[Math.floor(h)] ?? (Math.floor(h) + 1);
    return stdBase + dustN;
  }
  const base = getBaseHwangdae(h, panel);
  return base + dustN;
}

// ══════════════════════════════════════════
// 기초파이프 길이 (v2.1 확장 테이블)
// ══════════════════════════════════════════
export function getGichoLength(h: number, isStd: boolean, floor: string): number | null {
  if (floor === '콘크리트') return null;
  const base: Record<number,number> = {1:1.5,2:1.5,3:1.5,4:1.5,5:2.0,6:2.0,7:2.5,8:3.0,9:3.0,10:3.5};
  const std: Record<number,number> = {1:1.5,2:1.5,3:2.0,4:2.0,5:2.5,6:3.0,7:3.0,8:3.5,9:3.5,10:4.0};
  const table = isStd ? std : base;
  return table[Math.floor(h)] ?? 2.0;
}

export function getStructType(h: number): string {
  if (h <= 3) return '비계식';
  if (h <= 4) return '비계식';
  if (h <= 5) return '비계식+보조지주';
  return 'H빔식 추천';
}

// ══════════════════════════════════════════
// Design
// ══════════════════════════════════════════
export interface Design {
  mode:'실전형'|'표준형'; span:number; jiju:'1:1'|'2:1'; bojo:string;
  hwangdae:number; found:'기초파이프'|'앵커볼트'; gichoLength:number|null;
  structType:string; isStd:boolean; isHBeam:boolean;
}

export function makeDesign(h: number, floor: string, panel: string, std: boolean, dustN: number = 0): Design {
  const gl = getGichoLength(h, std, floor);
  const st = getStructType(h);
  return {
    mode: std?'표준형':'실전형', span: std?2.0:3.0, jiju: std?'2:1':'1:1',
    bojo: std?'2:1':(h>=5?'2:1':'없음'),
    hwangdae: getFinalHwangdae(h, panel, std, dustN),
    found: floor==='콘크리트'?'앵커볼트':'기초파이프',
    gichoLength: gl, structType: st, isStd: std,
    isHBeam: st.includes('H빔'),
  };
}

// ══════════════════════════════════════════
// BOM 수량 (BUG-02~05 수정)
// ══════════════════════════════════════════
export function calcBOM(len: number, h: number, panel: string, design: Design, dustN: number) {
  const span = design.span;
  const juju = Math.ceil(len / span) + 1;
  // BUG-03: 지주 = 주주-1 (양끝에 지주 없음, 배치비율 무관)
  const jiuju = juju - 1;
  const hwN = design.hwangdae;
  // BUG-02: 횡대수 = (floor(len/6)+1)*단수-1
  const hwCnt = (Math.floor(len / 6) + 1) * hwN - 1;
  // BUG-04: 자동클 = 주주+지주-1
  const jadong = juju + jiuju - 1;
  // BUG-05: 고정클 = 자동클 × 2.54
  const gojung = Math.round(jadong * 2.54);
  const pin = hwCnt;
  const dustRolls = dustN > 0 ? Math.max(1, Math.ceil(len / 40)) : 0;
  const gichoQty = design.found === '기초파이프' ? juju + jiuju : 0;

  // 판넬수
  let panelQty: number;
  if (panel === 'RPP') panelQty = Math.ceil(len / 0.67);
  else if (panel === 'EGI') panelQty = Math.ceil(len / 0.53);
  else panelQty = Math.ceil(len * h / 0.99);

  // 전용부자재
  let specialName = ''; let specialQty = 0; let specialPrice = 0;
  if (panel === '스틸') { specialName = 'H-BAR'; specialQty = (juju-1)+2; specialPrice = 0; }
  else if (panel === 'RPP') { specialName = '양개조이너'; specialQty = (hwN + 1) * panelQty; specialPrice = MISC_PRICE.양개조이너; }
  else if (panel === 'EGI') { specialName = '후크볼트'; specialQty = panelQty * hwN * 2; specialPrice = MISC_PRICE.후크볼트; }

  return { juju, jiuju, hwN, hwCnt, jadong, gojung, pin, dustRolls, gichoQty, panelQty,
           specialName, specialQty, specialPrice, mainPostLength: h + dustN };
}

// ══════════════════════════════════════════
// 노무비 (v2.1: h×3500, RPP=0, H빔분기)
// ══════════════════════════════════════════
export function calcLabor(len: number, h: number, panel: string, span: number, isBB: boolean, dustH: number, isHBeam: boolean) {
  const dustN = getDustTier(dustH);
  const BASE_INSTALL = 3500; // ★ 원/M당/1M높이
  const BASE_REMOVE = 2700;
  const baseInstPerM = h * BASE_INSTALL;
  const baseRemPerM = h * BASE_REMOVE;
  const panelExtra = panel === '스틸' ? 2000 : 0; // ★ RPP=0, EGI=0, 스틸만+2000
  const hbeamInstExtra = isHBeam ? 3000 : 0;
  const hbeamRemExtra = isHBeam ? 2000 : 0;

  const spanCoeff: Record<number, {i:number,r:number}> = {
    1.5:{i:0.15,r:0.10}, 2.0:{i:0.10,r:0.06}, 2.5:{i:0.05,r:0.03}, 3.0:{i:0,r:0},
  };
  const sc = spanCoeff[span] ?? {i:0,r:0};

  // BUG-01: 기간할증 (높이 기반 생산성)
  const productivity = h <= 4 ? 150 : 50;
  const workDays = Math.ceil(len / productivity);
  const periodSurch = Math.max(0, workDays - 1) * 150000;

  // 분진망
  const dustInst = dustN > 0 ? len * dustN * 1500 + (dustH >= 2.0 ? len * 1500 : 0) : 0;
  const dustRem = dustN > 0 ? len * dustN * 1000 + (dustH >= 2.0 ? len * 1000 : 0) : 0;

  // ═ 설치비 ═
  const instBase = baseInstPerM * len;
  const instPanel = panelExtra * len;
  const instHBeam = hbeamInstExtra * len;
  const instSpan = Math.round((instBase + instPanel) * sc.i); // 경간: 기본+판넬에만
  const installTotal = instBase + instPanel + instHBeam + instSpan + dustInst + periodSurch;

  // ═ 해체비 (BB만) ═
  let removeTotal = 0;
  if (isBB) {
    const remBase = baseRemPerM * len;
    const remPanel = panelExtra * len;
    const remHBeam = hbeamRemExtra * len;
    const remSpan = Math.round((remBase + remPanel) * sc.r);
    removeTotal = remBase + remPanel + remHBeam + remSpan + dustRem + periodSurch;
  }

  return { installTotal, removeTotal, total: installTotal + removeTotal, workDays, periodSurch, dustInst, dustRem,
           instSpan, perM: Math.round((installTotal + removeTotal) / len) };
}

// ══════════════════════════════════════════
// 장비비 (엑셀 modCalcEngine 로직)
// 굴착기 대수/단가 + 스카이 + 5톤크레인 + 오가
// ══════════════════════════════════════════
const EQUIP_PRICE = {
  굴착기:     { day: 720000, half: 500000 },  // VAT 포함
  스카이:     { day: 720000, half: 500000 },
  '5톤크레인': { day: 720000, half: 500000 },
  소형오가:   { day: 1210000, half: 1210000 },
} as const;

export interface EquipDetail {
  items: { name: string; qty: number; price: number; amount: number }[];
  total: number;
}

export function calcEquipment(h: number, panel: string, totalLen: number, foundPipeQty: number, isHBeam: boolean): EquipDetail {
  const items: { name: string; qty: number; price: number; amount: number }[] = [];

  // ── 굴착기 ──
  let excavCnt = foundPipeQty > 0 ? Math.ceil(foundPipeQty / 200) : 1;
  if (totalLen >= 1000) excavCnt += 1;
  if (excavCnt === 0) excavCnt = 1;
  const excavPrice = EQUIP_PRICE.굴착기.day;
  items.push({ name: '굴착기', qty: excavCnt, price: excavPrice, amount: excavCnt * excavPrice });

  // ── 스카이 (높이에 따라) ──
  let needSky = false, skyLen = 0;
  if (panel === '스틸' && h >= 4) { needSky = true; skyLen = 130 - (h - 4) * 20; }
  else if (panel === 'RPP' && h >= 7) { needSky = true; skyLen = 150 - (h - 7) * 20; }
  else if (panel === 'EGI' && h > 4) { needSky = true; skyLen = 150 - (h - 5) * 20; }
  if (skyLen < 10) skyLen = 10;

  if (needSky && skyLen > 0) {
    const skyCnt = Math.ceil(totalLen / skyLen);
    const skyPrice = EQUIP_PRICE.스카이.day;
    items.push({ name: '스카이', qty: skyCnt, price: skyPrice, amount: skyCnt * skyPrice });
  }

  // ── 5톤크레인 (RPP H≥7) ──
  if (panel === 'RPP' && h >= 7) {
    let craneLen = 150 - (h - 7) * 20;
    if (craneLen < 10) craneLen = 10;
    const craneCnt = Math.ceil(totalLen / craneLen);
    const cranePrice = EQUIP_PRICE['5톤크레인'].day;
    items.push({ name: '5톤크레인', qty: craneCnt, price: cranePrice, amount: craneCnt * cranePrice });
  }

  // ── 오가 (H빔 구조) ──
  // H빔 수량은 BOM에서 별도로 관리 — 여기서는 isHBeam 플래그만 사용
  // H빔 시공 시 오가 필수: 일일작업량 일반=45본, 암반=12본
  if (isHBeam) {
    const ogaDays = Math.max(1, Math.ceil(totalLen / 3 / 45)); // 약 3M 간격
    const ogaPrice = EQUIP_PRICE.소형오가.day;
    items.push({ name: '소형오가', qty: ogaDays, price: ogaPrice, amount: ogaDays * ogaPrice });
  }

  const total = items.reduce((s, it) => s + it.amount, 0);
  return { items, total };
}

// ══════════════════════════════════════════
// 자재 단위무게/부피 마스터 (엑셀 통합데이터 S/T열)
// ══════════════════════════════════════════
// key = "품명|규격" or "품명" (규격 없으면)
// value = [kg, m3]
const UNIT_WEIGHT: Record<string, [number, number]> = {
  // 주주파이프 (대표 규격별)
  '주주파이프|3M': [7.86, 0.001], '주주파이프|4M': [10.48, 0.00133],
  '주주파이프|5M': [13.1, 0.00166], '주주파이프|6M': [15.72, 0.00199],
  // 횡대파이프
  '횡대파이프|6M': [15.72, 0.00199], '횡대파이프': [15.72, 0.00199],
  // 지주파이프 (대표)
  '지주파이프|3M': [7.86, 0.001], '지주파이프|4M': [10.48, 0.00133],
  '지주파이프|5M': [13.1, 0.00166], '지주파이프': [7.86, 0.001],
  // 기초파이프
  '기초파이프|1.5M': [3.93, 0.0005], '기초파이프|2.0M': [5.24, 0.00066],
  '기초파이프|2.5M': [6.55, 0.00083], '기초파이프|3.0M': [7.86, 0.001],
  '기초파이프': [5.24, 0.00066],
  // RPP 판넬 (높이별)
  'RPP|2M': [7.6, 0.0402], 'RPP|3M': [11.4, 0.0603], 'RPP|4M': [15.2, 0.0804],
  'RPP|5M': [19, 0.1005], 'RPP|6M': [22.8, 0.1206], 'RPP|7M': [26.6, 0.1407],
  'RPP|8M': [30.4, 0.1608], 'RPP': [15.2, 0.0804],
  // 스틸 판넬 (장당 0.5M)
  '스틸': [14, 0.0297],
  // EGI 판넬
  'EGI|1.8M': [3.88, 0.0005], 'EGI|2.4M': [5.18, 0.00066],
  'EGI|3.0M': [6.47, 0.00083], 'EGI|4.0M': [8.63, 0.0011],
  'EGI': [6.47, 0.00083],
  // 클램프/부자재
  '고정클램프': [0.45, 0.0001], '자동클램프': [0.61, 0.0001],
  '연결핀': [0.2, 0], '양개조이너': [0.15, 0],
  '후크볼트': [0.05, 0], '분진망': [12, 0.04],
};

function getUnitWV(name: string, h: number): [number, number] {
  const key = `${name}|${Math.floor(h)}M`;
  return UNIT_WEIGHT[key] ?? UNIT_WEIGHT[name] ?? [5, 0.005];
}

// ══════════════════════════════════════════
// 운반비 (v3 — 엑셀 modTransport_v3_patch 동일)
// 8종 차량, 무게/부피 기반 대수, 3구간 단가, 만원 절상
// ══════════════════════════════════════════
const VEHICLES = [
  { name: '24톤', maxKg: 24000, maxM3: 60 },
  { name: '11톤', maxKg: 14000, maxM3: 45 },
  { name: '5톤축', maxKg: 12000, maxM3: 40 },
  { name: '5톤',  maxKg: 8500,  maxM3: 35 },
  { name: '3.5톤', maxKg: 4500, maxM3: 30 },
  { name: '2.5톤', maxKg: 2500, maxM3: 20 },
  { name: '1.4톤', maxKg: 1500, maxM3: 15 },
  { name: '1톤',  maxKg: 1100,  maxM3: 8 },
] as const;

// 김포기준 편도단가 (엑셀 김포기준단가 시트)
const KIMPO_BASE: Record<string, number> = {
  '1톤': 70000, '1.4톤': 70000, '2.5톤': 100000, '3.5톤': 120000,
  '5톤': 140000, '5톤축': 160000, '11톤': 220000, '24톤': 280000,
};

const VEHICLE_RATIO: Record<string, number> = {
  '1톤': 0.5, '1.4톤': 0.5, '2.5톤': 0.68, '3.5톤': 0.86,
  '5톤': 1.0, '5톤축': 1.1, '11톤': 1.55, '24톤': 2.0,
};

// 5톤 기준 단가 (3구간 공식 — 운반요율 테이블 미등록 지역 폴백)
function calc5tonPrice(dist: number): number {
  let price: number;
  if (dist <= 30) price = 140000;
  else if (dist <= 80) price = 220000 + 1000 * (dist - 30);
  else price = 205000 + 620 * dist;
  return Math.ceil(price / 10000) * 10000;
}

// 차량별 단가 계산 (김포기준 × 거리비율)
function calcVehiclePrice(vehicleName: string, dist: number): number {
  const base5 = calc5tonPrice(dist);
  const ratio = VEHICLE_RATIO[vehicleName] ?? 1.0;
  return Math.ceil(base5 * ratio / 10000) * 10000;
}

export interface TransportDetail {
  vehicle: string; trucks: number; perTruck: number; trips: number; total: number;
  totalWeight: number; totalVolume: number;
}

export function calcTransport(dist: number, len: number, isBB: boolean, bomItems?: { name: string; qty: number; h?: number }[]): TransportDetail {
  const trips = isBB ? 2 : 1;

  // BOM 아이템이 없으면 기존 간이 방식 폴백
  if (!bomItems || bomItems.length === 0) {
    const base5 = calc5tonPrice(dist);
    const trucks = Math.max(2, Math.ceil(len / 90));
    const total = Math.ceil(trucks * base5 * trips / 10000) * 10000;
    return { vehicle: '5톤', trucks, perTruck: base5, trips, total, totalWeight: 0, totalVolume: 0 };
  }

  // 총 무게/부피 합산
  let totalWeight = 0, totalVolume = 0;
  for (const it of bomItems) {
    const [w, v] = getUnitWV(it.name, it.h ?? 3);
    totalWeight += it.qty * w;
    totalVolume += it.qty * v;
  }

  // 5톤 기준 단가
  const base5 = calc5tonPrice(dist);

  // 8종 차량 중 최저 비용 선택 (★ v3: 차량별 개별 단가)
  let bestVehicle = '5톤', bestQty = 999, bestRate = base5, bestCost = Infinity;

  for (const v of VEHICLES) {
    const qW = v.maxKg > 0 ? Math.ceil(totalWeight / v.maxKg) : 999;
    const qV = v.maxM3 > 0 ? Math.ceil(totalVolume / v.maxM3) : 999;
    const qty = Math.max(1, Math.max(qW, qV));
    const rate = calcVehiclePrice(v.name, dist);
    const cost = qty * rate * trips;
    if (cost < bestCost) {
      bestVehicle = v.name; bestQty = qty; bestRate = rate; bestCost = cost;
    }
  }

  const total = Math.ceil(bestCost / 10000) * 10000;
  return { vehicle: bestVehicle, trucks: bestQty, perTruck: bestRate, trips, total, totalWeight, totalVolume };
}

// ══════════════════════════════════════════
// 도어 (v2.2: 양개 비계식/각관식 분리, 홀딩 쪽문+수직포망)
// ══════════════════════════════════════════
export const DOOR_PRICE = {
  홀딩도어:   { 고재: 270000, 신재: 350000 },  // 원/M, H 6.0M 고정
  양개_비계:  { 고재: 100000, 신재: 130000 },  // 원/M, H 2M or 3M, W ≤ 4M
  양개_각관:  { 고재: 300000, 신재: 300000 },  // 원/M, H 2.4M 고정
  수직포망: 25000,                              // 원/장 (문짝 1M 폭당 1장)
} as const;

// gate: '없음' | '양개_비계' | '양개_각관' | '홀딩도어'
export function calcGate(gate: string, grade: '고재'|'신재', W: number, _h: number, mesh: boolean) {
  if (!gate || gate === '없음') return { total: 0, body: 0, meshAmt: 0, meshQty: 0 };
  if (gate === '홀딩도어') {
    const b = W * DOOR_PRICE.홀딩도어[grade];
    const meshQty = mesh ? W : 0; // 문짝 1M당 1장
    const m = meshQty * DOOR_PRICE.수직포망;
    return { total: b + m, body: b, meshAmt: m, meshQty };
  }
  if (gate === '양개_비계') {
    const b = W * DOOR_PRICE.양개_비계[grade];
    return { total: b, body: b, meshAmt: 0, meshQty: 0 };
  }
  if (gate === '양개_각관') {
    const b = W * DOOR_PRICE.양개_각관[grade];
    return { total: b, body: b, meshAmt: 0, meshQty: 0 };
  }
  return { total: 0, body: 0, meshAmt: 0, meshQty: 0 };
}

// ══════════════════════════════════════════
// 기한후 월대여료율 (엑셀 바이백_파라미터 L열 / 통합데이터 AI열)
// 품목별 차등 요율 — 엔진 v74 확정 테이블
// ══════════════════════════════════════════
const RENT_RATE: Record<string, number> = {
  주주파이프:  0.016,
  횡대파이프:  0.017,
  연장파이프:  0.017,
  지주파이프:  0.019,
  보조지주:   0.019,
  단관파이프:  0.017,
  H빔:       0.016,
  고정클램프:  0.020,
  자동클램프:  0.020,
  싱글클램프:  0.020,
  연결핀:     0.022,
  '후크B/N':  0.022,
  양개조이너:  0.020,
  세트앙카:   0.020,
  베이스판:   0.020,
  RPP:        0.019,
  EGI:        0.020,
  '스틸':     0.019,
  양개도어:   0.019,
  분진망:     0,       // 소모성 — 대여료 없음
  기초파이프:  0,       // 소모성 — 대여료 없음
};

export function getRentRate(itemName: string): number {
  return RENT_RATE[itemName] ?? 0.017; // 미등록 품목은 1.7% 기본값
}

// ══════════════════════════════════════════
// 규모보정계수 (설계서 4.3)
// ~50M=x1.60, 50~150=x1.03, 150~300=x1.00(기준), 300+=x0.97
// ══════════════════════════════════════════
export function getScaleCoeff(len: number): number {
  if (len <= 50) return 1.60;
  if (len <= 150) return 1.03;
  if (len <= 300) return 1.00;
  return 0.97;
}

// ══════════════════════════════════════════
// 메인 견적 계산
// ══════════════════════════════════════════
export interface QuoteInput {
  region: string; len: number; panel: string; h: number; floor: string;
  asset: AssetType; contract: '바이백' | '구매';
}
export interface CalcOpts {
  bbMonths: number; gate: string; doorGrade: '고재'|'신재'; doorW: number; doorMesh: boolean; dustH?: number;
}
export interface EstimateResult {
  matTotal: number; labTotal: number; eqpTotal: number; transTotal: number; gateTotal: number;
  bbRefund: number; bbRate: number; subtotal: number; total: number; rounded: number;
  totalPerM: number; minVal: number; maxVal: number;
  pctMat: number; pctLab: number; pctEqp: number; pctTrans: number;
  matM: number; labM: number; monthlyRent: number; dailyRent: number;
  transDetail: TransportDetail;
  eqpDetail: EquipDetail;
  bom: any; laborDetail: any; design: any;
}

export function calcEstimate(input: QuoteInput, design: Design, opts: CalcOpts): EstimateResult {
  const reg = REGION_DB[input.region] ?? REGION_DB['경기남부'];
  const isBB = input.contract === '바이백';
  const L = input.len;
  const dustH = opts.dustH ?? 0;
  const dustN = getDustTier(dustH);
  const pg = getPriceGrade('panel', input.asset);
  const pig = getPriceGrade('pipe', input.asset);
  // BB 등급: 클램프도 자산구분 따름
  const bbPG = getBBGrade('panel', input.asset);
  const bbPiG = getBBGrade('pipe', input.asset);
  const bbCG = getBBGrade('clamp', input.asset);

  const bom = calcBOM(L, input.h, input.panel, design, dustN);

  // 자재비 + BB차감 (★ v3: 파이프=규격별 단가, 클램프=고재/신재 구분)
  const cg = getPriceGrade('clamp', input.asset); // 클램프 단가 등급
  const items = [
    { name: input.panel, qty: bom.panelQty, price: getPanelPrice(input.panel, pg, input.h), bbGrade: bbPG, bbKey: input.panel },
    { name: '주주파이프', qty: bom.juju, price: getPipePrice('주주파이프', pig, input.h, design.gichoLength), bbGrade: bbPiG, bbKey: '주주파이프' },
    { name: '횡대파이프', qty: bom.hwCnt, price: getPipePrice('횡대파이프', pig, input.h, design.gichoLength), bbGrade: bbPiG, bbKey: '횡대파이프' },
    { name: '지주파이프', qty: bom.jiuju, price: getPipePrice('지주파이프', pig, input.h, design.gichoLength), bbGrade: bbPiG, bbKey: '지주파이프' },
    { name: '기초파이프', qty: bom.gichoQty, price: getPipePrice('기초파이프', '고재', input.h, design.gichoLength), bbGrade: '고재' as const, bbKey: '기초파이프' },
    { name: '고정클램프', qty: bom.gojung, price: CLAMP_PRICE.고정클램프[cg], bbGrade: bbCG, bbKey: '고정클램프' },
    { name: '자동클램프', qty: bom.jadong, price: CLAMP_PRICE.자동클램프[cg], bbGrade: bbCG, bbKey: '자동클램프' },
    { name: '연결핀', qty: bom.pin, price: CLAMP_PRICE.연결핀[cg], bbGrade: bbCG, bbKey: '연결핀' },
    { name: '분진망', qty: bom.dustRolls, price: MISC_PRICE.분진망, bbGrade: '신재' as const, bbKey: '분진망' },
    { name: bom.specialName, qty: bom.specialQty, price: bom.specialPrice, bbGrade: bbCG, bbKey: bom.specialName || '' },
  ].filter(i => i.qty > 0);

  let matTotal = 0, bbRefund = 0, rentTotal = 0;
  for (const it of items) {
    const amt = it.qty * it.price;
    matTotal += amt;
    if (isBB && opts.bbMonths > 0 && it.bbKey) {
      const rate = calcBBDeductRate(it.bbKey, it.bbGrade, opts.bbMonths);
      bbRefund += Math.round(amt * rate);
    }
    // 기한후 월대여료: 품목별 차등 요율 적용
    rentTotal += amt * getRentRate(it.bbKey || it.name);
  }

  // ── 장비비 (엑셀 modCalcEngine 로직) ──
  const eqp = calcEquipment(input.h, input.panel, L, bom.gichoQty, design.isHBeam);
  const eqpTotal = eqp.total;

  const labor = calcLabor(L, input.h, input.panel, design.span, isBB, dustH, design.isHBeam);
  const labTotal = labor.total;

  // ── 운반비 (BOM 무게/부피 기반) ──
  const bomItems = items.map(it => ({ name: it.bbKey || it.name, qty: it.qty, h: input.h }));
  const trans = calcTransport(reg.dist, L, isBB, bomItems);
  const transTotal = trans.total;
  const gateResult = calcGate(opts.gate, opts.doorGrade, opts.doorW, input.h, opts.doorMesh);
  const gateTotal = gateResult.total;

  // 도어 BB차감 (양개도어 파라미터 사용)
  let gateBBRefund = 0;
  if (isBB && opts.bbMonths > 0 && gateTotal > 0 && opts.gate !== '없음') {
    const gateRate = calcBBDeductRate('양개도어', opts.doorGrade, opts.bbMonths);
    gateBBRefund = Math.round(gateResult.body * gateRate);
  }

  // ── 규모보정 (설계서 4.3: M당 단가에 영향) ──
  const scaleCoeff = getScaleCoeff(L);

  const subtotal = Math.round((matTotal + labTotal + eqpTotal + transTotal + gateTotal) * scaleCoeff);
  const total = subtotal - bbRefund - gateBBRefund;
  const rounded = Math.round(total / 10000) * 10000;

  return {
    matTotal, labTotal, eqpTotal, transTotal, gateTotal,
    bbRefund: bbRefund + gateBBRefund, bbRate: matTotal > 0 ? bbRefund / matTotal : 0,
    subtotal, total, rounded,
    totalPerM: Math.round(total / L),
    minVal: Math.round(rounded * 0.92 / 10000) * 10000,
    maxVal: Math.round(rounded * 1.08 / 10000) * 10000,
    matM: Math.round(matTotal / L), labM: labor.perM,
    pctMat: subtotal > 0 ? Math.round(matTotal / subtotal * 100) : 0,
    pctLab: subtotal > 0 ? Math.round(labTotal / subtotal * 100) : 0,
    pctEqp: subtotal > 0 ? Math.round(eqpTotal / subtotal * 100) : 0,
    pctTrans: subtotal > 0 ? Math.round(transTotal / subtotal * 100) : 0,
    monthlyRent: Math.round(rentTotal), dailyRent: Math.round(rentTotal / 30),
    transDetail: trans,
    eqpDetail: eqp,
    bom, laborDetail: labor, design,
  };
}

// ══════════════════════════════════════════
// 8조합 매트릭스
// ══════════════════════════════════════════
export function calc8Matrix(input: Omit<QuoteInput,'asset'|'contract'>, floor: string, opts: Partial<CalcOpts>) {
  const assets: AssetType[] = ['전체고재','전체신재','판넬만신재','파이프만신재'];
  const dustN = getDustTier(opts.dustH ?? 0);
  const design = makeDesign(input.h, floor, input.panel, false, dustN);
  const baseOpts: CalcOpts = { bbMonths:opts.bbMonths??6, gate:opts.gate??'없음', doorGrade:(opts.doorGrade as any)??'신재', doorW:opts.doorW??4, doorMesh:opts.doorMesh??false, dustH:opts.dustH??0 };
  const bbResults: Record<string, EstimateResult> = {};
  const sellResults: Record<string, EstimateResult> = {};
  for (const a of assets) {
    bbResults[a] = calcEstimate({...input,floor,asset:a,contract:'바이백'} as QuoteInput, design, baseOpts);
    sellResults[a] = calcEstimate({...input,floor,asset:a,contract:'구매'} as QuoteInput, design, {...baseOpts,bbMonths:0});
  }
  return { bbResults, sellResults, design };
}

// ══════════════════════════════════════════
// 유틸
// ══════════════════════════════════════════
export function getHeightSteps(panel: string): number[] {
  if (panel === 'EGI') return [1,1.8,2,2.4,3,4,5,6,7,8,9,10];
  return [1,2,3,4,5,6,7,8,9,10];
}

export function inferRegion(addr: string): string|null {
  const s = addr.replace(/\s/g,'');
  if (/제주/.test(s)) return '제주'; if (/부산/.test(s)) return '부산';
  if (/강릉|속초|동해|삼척/.test(s)) return '강원해안';
  if (/강원|춘천|원주/.test(s)) return '강원내륙';
  if (/서산|태안|당진/.test(s)) return '충남서해';
  if (/충청|충남|충북|세종|대전/.test(s)) return '충청';
  if (/전라|광주|순천|여수/.test(s)) return '전라';
  if (/경상|대구|울산|창원|포항/.test(s)) return '경상';
  if (/안산|시흥|평택|화성|수원/.test(s)) return '경기서해안';
  if (/의정부|파주|고양|포천|양주/.test(s)) return '경기북부';
  if (/인천/.test(s)) return '인천'; if (/서울/.test(s)) return '서울';
  if (/경기/.test(s)) return '경기남부'; return null;
}

export function validateDeviation(a: number, b: number) {
  const d = Math.round((b-a)/a*1000)/10;
  return { deviation: d, flag: d>30?'VERY_HIGH':d>15?'HIGH':d<-15?'LOW':'NORMAL' };
}

export function generateComments(len: number, asset: string|null, contract: string|null, gate: string, trend: string): string[] {
  const c: string[] = [];
  if (len<=50) c.push('⚠ 데이터 부족'); else if (len<=150) c.push('참고용'); else c.push('데이터 충분');
  if (len<=50) c.push('소규모: M당 60%+ 높을 수 있음');
  if (len>=300) c.push('대규모: M당 약 3% 절감');
  if (asset?.includes('고재') && contract==='바이백') c.push('고재 BB차감률 높음→자재비↓');
  if (gate!=='없음') c.push('도어 별도 산출');
  c.push('경비 ±30% 변동 가능');
  return c;
}

export const DISCLAIMER = '본 견적은 과거 시공 데이터 기반 예상 범위이며, 구조설계 도서가 아닙니다. 구조 조건(경간/횡대/근입 등)은 참고용이며, 실제 시공 시 현장 여건에 따라 시공업체가 조정합니다. AXIS는 구조안전 설계를 제공하지 않으며, 시공 결과에 대한 설계 책임을 지지 않습니다. 정밀 구조검토가 필요한 경우 별도의 구조설계 전문업체에 의뢰하시기 바랍니다.';
