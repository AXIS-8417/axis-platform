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
// 자재 단가 (엑셀 단가관리 실제값)
// ══════════════════════════════════════════
export const PANEL_PRICE: Record<string, Record<string, number>> = {
  '스틸': { 신재: 21000, 고재: 5000 },
  RPP:   { 신재: 28000, 고재: 8300 },
  EGI:   { 신재: 9000,  고재: 3000 },
};
export const PIPE_PRICE: Record<string, Record<string, number>> = {
  주주파이프: { 신재: 15800, 고재: 11000 },
  횡대파이프: { 신재: 15800, 고재: 15800 },
  지주파이프: { 신재: 8400,  고재: 8400 },
  기초파이프: { 신재: 4500,  고재: 4500 },
};
export const MISC_PRICE: Record<string, number> = {
  고정클램프: 1800, 자동클램프: 1900, 연결핀: 1200,
  분진망: 15000, 굴착기: 715000,
  양개조이너: 0, 후크볼트: 200,
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
// 운반비
// ══════════════════════════════════════════
export function calcTransport(dist: number, len: number, isBB: boolean) {
  const trucks = Math.max(2, Math.ceil(len / 90));
  const perTruck = Math.round(130000 + dist * 900);
  const trips = isBB ? 2 : 1;
  return { trucks, perTruck, total: Math.round(trucks * perTruck * trips / 1000) * 1000 };
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

  // 자재비 + BB차감 (단가는 priceGrade, BB는 bbGrade)
  const items = [
    { name: input.panel, qty: bom.panelQty, price: (PANEL_PRICE[input.panel]??{})[pg]??5000, bbGrade: bbPG, bbKey: input.panel },
    { name: '주주파이프', qty: bom.juju, price: PIPE_PRICE.주주파이프[pig], bbGrade: bbPiG, bbKey: '주주파이프' },
    { name: '횡대파이프', qty: bom.hwCnt, price: PIPE_PRICE.횡대파이프[pig], bbGrade: bbPiG, bbKey: '횡대파이프' },
    { name: '지주파이프', qty: bom.jiuju, price: PIPE_PRICE.지주파이프[pig], bbGrade: bbPiG, bbKey: '지주파이프' },
    { name: '기초파이프', qty: bom.gichoQty, price: PIPE_PRICE.기초파이프['고재'], bbGrade: '고재' as const, bbKey: '기초파이프' },
    { name: '고정클램프', qty: bom.gojung, price: MISC_PRICE.고정클램프, bbGrade: bbCG, bbKey: '고정클램프' },
    { name: '자동클램프', qty: bom.jadong, price: MISC_PRICE.자동클램프, bbGrade: bbCG, bbKey: '자동클램프' },
    { name: '연결핀', qty: bom.pin, price: MISC_PRICE.연결핀, bbGrade: bbCG, bbKey: '연결핀' },
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

  const eqpTotal = MISC_PRICE.굴착기;
  const labor = calcLabor(L, input.h, input.panel, design.span, isBB, dustH, design.isHBeam);
  const labTotal = labor.total;
  const trans = calcTransport(reg.dist, L, isBB);
  const transTotal = trans.total;
  const gateResult = calcGate(opts.gate, opts.doorGrade, opts.doorW, input.h, opts.doorMesh);
  const gateTotal = gateResult.total;

  // 도어 BB차감 (양개도어 파라미터 사용)
  let gateBBRefund = 0;
  if (isBB && opts.bbMonths > 0 && gateTotal > 0 && opts.gate !== '없음') {
    const gateRate = calcBBDeductRate('양개도어', opts.doorGrade, opts.bbMonths);
    gateBBRefund = Math.round(gateResult.body * gateRate);
  }

  const subtotal = matTotal + labTotal + eqpTotal + transTotal + gateTotal;
  const total = subtotal - bbRefund - gateBBRefund;
  const rounded = Math.round(total / 10000) * 10000;

  return {
    matTotal, labTotal, eqpTotal, transTotal, gateTotal,
    transDetail: trans,
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

export const DISCLAIMER = '본 견적은 과거 시공 데이터 기반 예상 범위이며 구조설계 도서가 아닙니다.';
