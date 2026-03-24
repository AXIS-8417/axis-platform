// AXIS 견적엔진 v2.2 — 엑셀 통합데이터 마스터 전면 반영 (v2.1→v2.2)

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
// 풍속·지형·기초 구조 파라미터 (엑셀 구조계산 시트)
// ══════════════════════════════════════════
export const WIND_SPEED: Record<string, number> = {
  서울: 30, 경기북부: 30, 경기남부: 30, 경기서해안: 35,
  인천: 35, 강원내륙: 30, 강원해안: 35, 충청: 30,
  충남서해: 35, 전라: 30, 경상: 30, 부산: 35, 제주: 40,
};

export const TERRAIN: Record<string, {Cf:number, Gf:number}> = {
  일반: {Cf:1.2, Gf:1.8},
  해안: {Cf:1.3, Gf:2.0},
  고산: {Cf:1.3, Gf:2.1},
};

export const FOUNDATION_FACTOR: Record<string, number> = {
  기초파이프시공: 1.0,
  베이스판고정: 0.85,
  앵커볼트형: 0.75,
  무기초형: 0.6,
};

// ══════════════════════════════════════════
// H빔 규격 테이블 (엑셀 H빔규격 시트)
// ══════════════════════════════════════════
export const HBEAM_SPECS: Record<string, {Fy:number, Z:number, kg:number}> = {
  '100x50x5x7': {Fy:235, Z:42.2, kg:11.85},
  '100x100x6x8': {Fy:235, Z:76.5, kg:21.9},
  '125x60x6x8': {Fy:235, Z:61.5, kg:15.2},
  '125x125x6.5x9': {Fy:235, Z:113, kg:30.31},
  '150x75x5x7': {Fy:235, Z:88.8, kg:18.23},
  '150x150x7x10': {Fy:235, Z:162, kg:37.5},
  '175x90x5x8': {Fy:235, Z:122, kg:21.56},
  '200x100x5.5x8': {Fy:235, Z:160, kg:25.33},
  '200x200x8x12': {Fy:235, Z:355, kg:56.24},
  '250x125x6x9': {Fy:235, Z:247, kg:33.14},
  '250x250x9x14': {Fy:235, Z:613, kg:82.2},
  '300x150x6.5x9': {Fy:235, Z:374, kg:41.16},
  '300x300x10x15': {Fy:235, Z:920, kg:106.0},
  '350x175x7x11': {Fy:235, Z:557, kg:57.82},
  '400x200x8x13': {Fy:235, Z:770, kg:75.16},
};

export const HBEAM_PRICE_PER_KG = 1100; // 원/kg (신재/고재 동일)

// ══════════════════════════════════════════
// 작업조건 파라미터 (엑셀 작업조건 시트)
// ══════════════════════════════════════════
export const WORK_PARAMS = {
  오가_일일작업량_일반: 45,    // 본/일
  오가_일일작업량_암반: 12,    // 본/일
  암반현장_연료비배수: 2,
  기초파이프_장비기준: 200,   // 본 이상이면 굴착기 추가
  장거리기준_장비추가: 1000,  // M 이상이면 굴착기 +1
  // ── 노무비 설정 (엑셀 설정항목 시트) ──
  앙카설치단가: 2500,        // 원/개
  앙카해체단가: 1000,        // 원/개
  데카설치단가: 4000,        // 원/M/단
  데카해체단가: 2000,        // 원/M/단
  파이프최소품: 1000000,     // 1식 기준 최소 장비비
  H빔최소품: 1200000,       // 1일 기준 최소 장비비
  거리할증단가: 150000,      // 50km당
  최소일일비용: 900000,
  목표마진율: 0.1,
  스카이임대료: 650000,
  철판kg당단가: 3500,
  철판밀도: 7850,
  레미콘루베당단가: 120000,
  최소타설비용: 450000,
  홀딩도어추가루베: 3,
} as const;

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

// ── EGI 판넬 단가 (높이 + 두께별 — 엑셀 통합데이터) ──
const EGI_PANEL_PRICE: Record<string, Record<string, Record<string, number>>> = {
  신재: {
    '1.8': { '0.5': 6300, '0.6': 7000 },
    '2.4': { '0.5': 8200, '0.6': 11000 },
    '3.0': { '0.5': 16500, '0.6': 16500 },
    '4.0': { '0.6': 22000, '0.8': 22000 },
  },
  고재: {
    '1.8': { default: 4000 },
    '2.4': { default: 4400 },
    '3.0': { default: 6700 },
    '4.0': { default: 12000 },
  },
};

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

/** EGI 판넬 두께별 단가 조회 (신규) */
export function getEgiPanelPrice(grade: '신재' | '고재', heightM: string, thicknessT?: string): number | null {
  const gradeData = EGI_PANEL_PRICE[grade];
  if (!gradeData) return null;
  const hData = gradeData[heightM];
  if (!hData) return null;
  if (grade === '고재') return hData['default'] ?? null;
  if (thicknessT && hData[thicknessT] !== undefined) return hData[thicknessT];
  // 두께 미지정 시 첫 번째 값 반환
  const vals = Object.values(hData);
  return vals.length > 0 ? vals[0] : null;
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
  케미칼앙카액: 10000, 레미콘: 150000,
  'H-BAR': 15000, 'ㄷ-BAR': 12000,
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
  mode:'실전형'|'표준형'; span:number; jiju:string; bojo:string;
  hwangdae:number; found:'기초파이프'|'앵커볼트'; gichoLength:number|null;
  structType:string; isStd:boolean; isHBeam:boolean;
}

export function makeDesign(h: number, floor: string, panel: string, std: boolean, dustN: number = 0): Design {
  const gl = getGichoLength(h, std, floor);
  const st = getStructType(h);
  const isHB = st.includes('H빔');
  return {
    mode: std?'표준형':'실전형', span: std?2.0:3.0,
    jiju: isHB ? 'N/A (H빔 자립)' : (std?'2:1':'1:1'),
    bojo: isHB ? 'N/A (H빔 자립)' : (std?'2:1':(h>=5?'2:1':'없음')),
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
  // H빔: 지주파이프=0, 보조지주=0 (VBA modStructural line 845-861)
  const jiuju = design.isHBeam ? 0 : juju - 1;
  const hwN = design.hwangdae;
  // BUG-02: 횡대수 = (floor(len/6)+1)*단수-1
  const hwCnt = (Math.floor(len / 6) + 1) * hwN - 1;
  // H빔: 클램프는 횡대 기반 (지주 없으므로 jadong 조정)
  const jadong = design.isHBeam ? juju - 1 : juju + jiuju - 1;
  // BUG-05: 고정클 = 자동클 × 2.54
  const gojung = Math.round(jadong * 2.54);
  const pin = hwCnt;
  const dustRolls = dustN > 0 ? Math.max(1, Math.ceil(len / 40)) : 0;
  // H빔: 기초파이프 = 주주 × 2 (양쪽), 비계식: 주주+지주
  const gichoQty = design.found === '기초파이프'
    ? (design.isHBeam ? juju * 2 : juju + jiuju)
    : 0;

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

  // ═ 최소품 적용 (엑셀: 파이프최소품 1,000,000 / H빔최소품 1,200,000) ═
  const minEquip = isHBeam ? WORK_PARAMS.H빔최소품 : WORK_PARAMS.파이프최소품;
  const adjustedInstall = Math.max(installTotal, minEquip);
  const adjustedRemove = isBB ? Math.max(removeTotal, minEquip) : 0;

  return { installTotal: adjustedInstall, removeTotal: adjustedRemove,
           total: adjustedInstall + adjustedRemove, workDays, periodSurch, dustInst, dustRem,
           instSpan, perM: Math.round((adjustedInstall + adjustedRemove) / len),
           minEquipApplied: installTotal < minEquip };
}

// ══════════════════════════════════════════
// 장비비 (엑셀 modCalcEngine 로직)
// 굴착기 대수/단가 + 스카이 + 5톤크레인 + 오가
// ══════════════════════════════════════════
const EQUIP_PRICE = {
  굴착기:        { day: 720000, half: 500000 },
  스카이:        { day: 720000, half: 500000 },
  '5톤크레인':   { day: 720000, half: 500000 },
  '9.5톤크레인': { day: 1210000, half: 1210000 },
  '25톤크레인':  { day: 1980000, half: 1100000 },
  소형오가:      { day: 1210000, half: 1210000 },
  오거스크류:    { day: 390000, half: 280000 },
  오거T4:       { day: 1320000, half: 1210000 },
  대형콤프레샤:  { day: 1050000, half: 1050000 },
} as const;

export { EQUIP_PRICE };

export interface EquipDetail {
  items: { name: string; qty: number; price: number; amount: number }[];
  total: number;
}

export function calcEquipment(h: number, panel: string, totalLen: number, foundPipeQty: number, isHBeam: boolean, isBB: boolean = false): EquipDetail {
  const items: { name: string; qty: number; price: number; amount: number }[] = [];

  // ── 굴착기 ──
  let excavCnt = foundPipeQty > 0 ? Math.ceil(foundPipeQty / WORK_PARAMS.기초파이프_장비기준) : 1;
  if (totalLen >= WORK_PARAMS.장거리기준_장비추가) excavCnt += 1;
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
    const ogaDays = Math.max(1, Math.ceil(totalLen / 3 / WORK_PARAMS.오가_일일작업량_일반)); // 약 3M 간격
    const ogaPrice = EQUIP_PRICE.소형오가.day;
    items.push({ name: '소형오가', qty: ogaDays, price: ogaPrice, amount: ogaDays * ogaPrice });
  }

  // ── H빔 + 바이백: 장비비 ×2 (해체 시 H빔을 잡아줘야 함) ──
  if (isHBeam && isBB) {
    const installTotal = items.reduce((s, it) => s + it.amount, 0);
    items.push({ name: '해체장비(BB)', qty: 1, price: installTotal, amount: installTotal });
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
// 운반비 (v3 — 엑셀 운반요율 시트 + modTransport_v3_patch 폴백)
// ══════════════════════════════════════════

// ── 운반요율 테이블 (엑셀 운반요율 시트 — 지역별 차량 8종 편도단가) ──
const TRANSPORT_RATES: Record<string, Record<string, number>> = {
  '경기도|김포시': {'1톤':70000,'1.4톤':70000,'2.5톤':100000,'3.5톤':120000,'5톤':140000,'5톤축':160000,'11톤':220000,'24톤':280000},
  '경기도|고양시': {'1톤':80000,'1.4톤':80000,'2.5톤':110000,'3.5톤':140000,'5톤':150000,'5톤축':170000,'11톤':240000,'24톤':310000},
  '경기도|파주시': {'1톤':80000,'1.4톤':80000,'2.5톤':110000,'3.5톤':140000,'5톤':160000,'5톤축':180000,'11톤':250000,'24톤':320000},
  '경기도|시흥시': {'1톤':70000,'1.4톤':70000,'2.5톤':100000,'3.5톤':130000,'5톤':150000,'5톤축':170000,'11톤':230000,'24톤':300000},
  '경기도|안산시': {'1톤':70000,'1.4톤':70000,'2.5톤':100000,'3.5톤':130000,'5톤':150000,'5톤축':170000,'11톤':230000,'24톤':300000},
  '경기도|수원시': {'1톤':80000,'1.4톤':80000,'2.5톤':110000,'3.5톤':140000,'5톤':160000,'5톤축':180000,'11톤':250000,'24톤':320000},
  '경기도|화성시': {'1톤':80000,'1.4톤':80000,'2.5톤':110000,'3.5톤':140000,'5톤':160000,'5톤축':180000,'11톤':250000,'24톤':320000},
  '경기도|평택시': {'1톤':90000,'1.4톤':90000,'2.5톤':130000,'3.5톤':160000,'5톤':180000,'5톤축':200000,'11톤':280000,'24톤':360000},
  '경기도|용인시': {'1톤':80000,'1.4톤':80000,'2.5톤':120000,'3.5톤':150000,'5톤':170000,'5톤축':190000,'11톤':260000,'24톤':340000},
  '경기도|성남시': {'1톤':70000,'1.4톤':70000,'2.5톤':100000,'3.5톤':130000,'5톤':150000,'5톤축':170000,'11톤':230000,'24톤':300000},
  '서울특별시|강남구': {'1톤':80000,'1.4톤':80000,'2.5톤':110000,'3.5톤':140000,'5톤':160000,'5톤축':180000,'11톤':250000,'24톤':320000},
  '서울특별시|마포구': {'1톤':80000,'1.4톤':80000,'2.5톤':110000,'3.5톤':140000,'5톤':150000,'5톤축':170000,'11톤':240000,'24톤':310000},
  '인천광역시|계양구': {'1톤':70000,'1.4톤':70000,'2.5톤':100000,'3.5톤':130000,'5톤':140000,'5톤축':160000,'11톤':220000,'24톤':290000},
  '충청남도|천안시': {'1톤':110000,'1.4톤':110000,'2.5톤':150000,'3.5톤':190000,'5톤':210000,'5톤축':240000,'11톤':330000,'24톤':430000},
  '충청북도|청주시': {'1톤':110000,'1.4톤':110000,'2.5톤':150000,'3.5톤':190000,'5톤':220000,'5톤축':250000,'11톤':340000,'24톤':440000},
  '대전광역시|서구': {'1톤':120000,'1.4톤':120000,'2.5톤':170000,'3.5톤':210000,'5톤':240000,'5톤축':270000,'11톤':370000,'24톤':480000},
  '강원특별자치도|춘천시': {'1톤':120000,'1.4톤':120000,'2.5톤':170000,'3.5톤':210000,'5톤':240000,'5톤축':270000,'11톤':370000,'24톤':480000},
  '강원특별자치도|원주시': {'1톤':140000,'1.4톤':140000,'2.5톤':190000,'3.5톤':240000,'5톤':270000,'5톤축':300000,'11톤':420000,'24톤':540000},
  '강원특별자치도|강릉시': {'1톤':170000,'1.4톤':170000,'2.5톤':240000,'3.5톤':300000,'5톤':340000,'5톤축':380000,'11톤':530000,'24톤':680000},
  '전라북도|전주시': {'1톤':160000,'1.4톤':160000,'2.5톤':220000,'3.5톤':270000,'5톤':310000,'5톤축':350000,'11톤':480000,'24톤':620000},
  '광주광역시|북구': {'1톤':190000,'1.4톤':190000,'2.5톤':260000,'3.5톤':330000,'5톤':370000,'5톤축':420000,'11톤':570000,'24톤':740000},
  '경상북도|구미시': {'1톤':170000,'1.4톤':170000,'2.5톤':230000,'3.5톤':290000,'5톤':330000,'5톤축':370000,'11톤':510000,'24톤':660000},
  '대구광역시|중구': {'1톤':180000,'1.4톤':180000,'2.5톤':250000,'3.5톤':310000,'5톤':350000,'5톤축':400000,'11톤':540000,'24톤':700000},
  '경상남도|창원시': {'1톤':200000,'1.4톤':200000,'2.5톤':280000,'3.5톤':350000,'5톤':400000,'5톤축':450000,'11톤':610000,'24톤':790000},
  '부산광역시|중구': {'1톤':210000,'1.4톤':210000,'2.5톤':290000,'3.5톤':360000,'5톤':410000,'5톤축':460000,'11톤':630000,'24톤':810000},
  '울산광역시|중구': {'1톤':200000,'1.4톤':200000,'2.5톤':270000,'3.5톤':340000,'5톤':390000,'5톤축':440000,'11톤':600000,'24톤':770000},
  '제주특별자치도|제주시': {'1톤':280000,'1.4톤':280000,'2.5톤':380000,'3.5톤':480000,'5톤':540000,'5톤축':610000,'11톤':830000,'24톤':1070000},
};

export { TRANSPORT_RATES };

/** 주소 문자열로 TRANSPORT_RATES 키 매칭 시도 */
function matchTransportRegion(address: string): Record<string, number> | null {
  if (!address) return null;
  const norm = address.replace(/\s/g, '');
  for (const key of Object.keys(TRANSPORT_RATES)) {
    const parts = key.split('|');
    // parts[0] = 시도, parts[1] = 시군구
    if (parts.every(p => norm.includes(p))) {
      return TRANSPORT_RATES[key];
    }
    // 시군구만으로도 매칭 시도 (예: "김포시" → "경기도|김포시")
    if (parts[1] && norm.includes(parts[1])) {
      return TRANSPORT_RATES[key];
    }
  }
  return null;
}

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

export function calcTransport(dist: number, len: number, isBB: boolean, bomItems?: { name: string; qty: number; h?: number }[], address?: string): TransportDetail {
  const trips = isBB ? 2 : 1;

  // 지역별 운반요율 테이블 매칭 시도
  const regionRates = address ? matchTransportRegion(address) : null;

  // BOM 아이템이 없으면 기존 간이 방식 폴백
  if (!bomItems || bomItems.length === 0) {
    const base5 = regionRates ? regionRates['5톤'] : calc5tonPrice(dist);
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

  // 8종 차량 중 최저 비용 선택
  let bestVehicle = '5톤', bestQty = 999, bestRate = 0, bestCost = Infinity;

  for (const v of VEHICLES) {
    const qW = v.maxKg > 0 ? Math.ceil(totalWeight / v.maxKg) : 999;
    const qV = v.maxM3 > 0 ? Math.ceil(totalVolume / v.maxM3) : 999;
    const qty = Math.max(1, Math.max(qW, qV));
    // 지역테이블 우선, 없으면 공식 기반 단가
    const rate = regionRates ? (regionRates[v.name] ?? calcVehiclePrice(v.name, dist)) : calcVehiclePrice(v.name, dist);
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
  양개도어:   { 신재: 350000, 고재: 200000 },  // 원/M (per door leaf), H:2.4M, W:2.0~8.0M
  홀딩도어:   { 신재: 63000, 고재: 50000 },    // 원/㎡, H:6.0M, W:6.0~12.0M
  현장DIY출입문: { '2.0': 100000, '3.0': 200000, '4.0': 300000, '5.0': 400000, '6.0': 500000 } as Record<string, number>,
  // 레거시 호환
  양개_비계:  { 고재: 100000, 신재: 130000 },  // 원/M, H 2M or 3M, W ≤ 4M
  양개_각관:  { 고재: 300000, 신재: 300000 },  // 원/M, H 2.4M 고정
  수직포망: 25000,                              // 원/장 (문짝 1M 폭당 1장)
} as const;

// gate: '없음' | '양개_비계' | '양개_각관' | '양개도어' | '홀딩도어' | '현장DIY출입문'
export function calcGate(gate: string, grade: '고재'|'신재', W: number, _h: number, mesh: boolean) {
  if (!gate || gate === '없음') return { total: 0, body: 0, meshAmt: 0, meshQty: 0 };
  if (gate === '홀딩도어') {
    const H = 6.0; // 홀딩도어 고정높이
    const area = W * H;
    const unitPrice = grade === '신재' ? DOOR_PRICE.홀딩도어.신재 : DOOR_PRICE.홀딩도어.고재;
    const b = Math.round(area * unitPrice);
    const meshQty = mesh ? W : 0; // 문짝 1M당 1장
    const m = meshQty * DOOR_PRICE.수직포망;
    return { total: b + m, body: b, meshAmt: m, meshQty };
  }
  if (gate === '양개도어') {
    const unitPrice = grade === '신재' ? DOOR_PRICE.양개도어.신재 : DOOR_PRICE.양개도어.고재;
    const b = Math.round(W * unitPrice);
    const meshQty = mesh ? W : 0;
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
  if (gate === '현장DIY출입문') {
    const wKey = W.toFixed(1);
    const b = DOOR_PRICE.현장DIY출입문[wKey] ?? Math.round(W * 100000);
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
  address?: string; // 운반요율 테이블 매칭용 주소
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
  // H빔: 주주파이프 대신 H빔, 지주파이프=0 (VBA modStructural line 845-872)
  const hbeamPrice = design.isHBeam ? Math.round((50 * (input.h + 1.5) * (input.asset.includes('신재') ? 1200 : 800)) / 100) * 100 : 0;
  const items = [
    { name: input.panel, qty: bom.panelQty, price: getPanelPrice(input.panel, pg, input.h), bbGrade: bbPG, bbKey: input.panel },
    ...(design.isHBeam
      ? [{ name: 'H빔', qty: bom.juju, price: hbeamPrice, bbGrade: bbPiG, bbKey: '주주파이프' }]
      : [{ name: '주주파이프', qty: bom.juju, price: getPipePrice('주주파이프', pig, input.h, design.gichoLength), bbGrade: bbPiG, bbKey: '주주파이프' }]
    ),
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
  const eqp = calcEquipment(input.h, input.panel, L, bom.gichoQty, design.isHBeam, isBB);
  const eqpTotal = eqp.total;

  const labor = calcLabor(L, input.h, input.panel, design.span, isBB, dustH, design.isHBeam);
  const labTotal = labor.total;

  // ── 운반비 (BOM 무게/부피 기반, 지역테이블 우선) ──
  const bomItems = items.map(it => ({ name: it.bbKey || it.name, qty: it.qty, h: input.h }));
  const trans = calcTransport(reg.dist, L, isBB, bomItems, input.address);
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

// ══════════════════════════════════════════
// V2 확장 모듈 re-export
// ══════════════════════════════════════════
export { calcEquipmentCost, type EquipmentInput, type EquipmentItem, type EquipmentResult } from './equipmentCost';
export { calcTransportV3, haversine, calcBase5tonPrice, calcDistance, VEHICLES, REGION_COORDS, type TransportInput, type TransportResult, type TransportOption, type VehicleSpec } from './transportV3';
export { applyPriceRules, applyPriceRulesToAll, type QuoteItem as PriceQuoteItem, type PriceRule, type PriceOverride, type PriceRuleResult, type CorrectionMode } from './priceRule';
export { calcEnvAssessment, getRegionMultiplier, getPM10Grade, type EnvInput, type EnvScore, type EnvGrade } from './envAssessment';
export { runStructuralCheck, calcDesignWindPressure, determineStructType, calcMinEmbedDepth, selectOptimalHBeam, HBEAM_DB, type StructuralInput, type StructuralResult, type HBeamSection, type WindParams } from './structuralCheck';
export { calcEstimateV2, calc8MatrixV2, type QuoteInputV2, type CalcOptsV2, type EstimateResultV2 } from './calcEstimateV2';
export { calcBBResidualRate, calcBBDeductRateV2, calcBBDeduction, calcMonthlyRental, BB_PARAMS, type BBParam, type BBItem, type BBResult, type MonthlyRentalResult } from './bbDepreciation';
export { getScaleFactor, getStructureFactor, getSpanDifficulty, calcCorrections, SCALE_BANDS, SPAN_DIFFICULTY, type ScaleBand, type SpanDifficulty, type StructureType, type CorrectionInput, type CorrectionResult } from './scaleCorrection';
export { calcDoorEstimate, calcDoorBBDeduct, type DoorType, type DoorGrade, type DoorStructure, type DoorInput, type DoorResult } from './doorEstimate';
export { calcHBeamEstimate, selectOptimalHBeam as selectHBeam, determineStructType as determineHBeamStructType, calcWindPressure as calcHBeamWindPressure, calcHBeamBOM, calcHBeamLabor, calcHBeamEquip, HBEAM_ENGINE_PARAMS, EQUIP_PRICES, type HBeamSpec, type HBeamSelectionResult, type HBeamBOM, type HBeamLaborCost, type HBeamEquipCost, type HBeamEstimateInput, type HBeamEstimateResult, type StructureType as HBeamStructureType } from './hbeamEstimate';
export { calcSimpleEstimate, calcSimple8Matrix, findBucket, type BucketPanel, type BucketAsset, type BucketContract, type BucketTier, type BucketKey, type BucketData, type SimpleEstimateInput, type SimpleEstimateResult } from './bucketEstimate';
export { canTransition, getNextStatuses, canGateTransition, getGateNextStatuses, getGateFlow, reconcileGateEvents, canBillingTransition, getBillingFlow, buildPlatformBridge, checkDesignChangeAutoTransition, WORK_ORDER_STATUSES, STATUS_LABEL, GATE_EVENT_STATUSES, GATE_STATUS_LABEL, BILLING_STATUSES, BILLING_STATUS_LABEL, type WorkOrderStatus, type GateEventStatus, type BillingStatus, type TransitionContext, type TransitionResult, type GateEventData, type ReconciliationItem, type ReconciliationSummary, type QuoteToPlatformInput, type QuoteToPlatformResult } from './stateMachine';
export { checkEducationCompliance, EDUCATION_REQUIREMENTS, type EducationRequirement as EduReq, type CompletedEducation, type EducationGap, type ComplianceResult } from './educationCompliance';
export { calculateRemiconOrder, judgeChloride, judgeTransport, getCuringMode, type RemiconOrderResult } from './remiconCalculator';

// ══════════════════════════════════════════
// Phase 3: 신규 엔진 모듈 (게이트잔량/자재전이/정산/설계변경/서류체크/권한)
// ══════════════════════════════════════════
export { calcGateBalance, calcAllGateBalances, reconcileGateRecords, type GateEvent, type GateBalance, type ReconResult } from './gateInventory';
export { canMaterialTransition, getMaterialNextStatus, getAllowedEvents, calcMaterialBalance, type MaterialStatus, type MaterialEventType, type MaterialBalance } from './materialTransition';
export { calcSettlement, calcSettlementBundle, SETTLEMENT_POLICY, type SettlementItem, type SettlementCalcResult, type SettlementMode, type BundlePeriodType, type BundleInput, type BundleResult } from './settlementEngine';
export { calcDesignChangeStatus, findOverdueChanges, RESPONSE_DEADLINE_DAYS, type DesignChangeStatus, type DesignChangeInput, type DesignChangeResult } from './designChangeEngine';
export { checkPartyDocs, DEFAULT_REQUIREMENTS, type PartyRole, type DocStatus, type DocRequirement, type PartyDoc, type DocCheckResult } from './partyDocChecker';
export { checkPermission, getAccessibleResources, getPermissionMatrix, type PermRole, type PermAction } from './permissionMatrix';

// ══════════════════════════════════════════
// 을(시공사) 평판 엔진 — 확정본 v1.0
// ══════════════════════════════════════════
export { calcEulReputation, isExcluded, REPUTATION_WEIGHTS, PENALTY_TABLE, type ReputationInput, type ReputationResult, type ExclusionReason, type PenaltyEvent } from './eulReputation';
export { checkPendingNotifications, getDashboardColor, GAP_NOTIFICATIONS, EUL_NOTIFICATIONS, ALL_NOTIFICATIONS, type NotifyTarget, type NotificationRule, type ContractState, type PendingNotification, type DashboardColor } from './notificationEngine';

// ══════════════════════════════════════════
// 구조형(구조참고견적) 엔진 — v2.0
// ══════════════════════════════════════════
export { CalcStructSpec, generateStructComment, generateStructBOM, calcStructLabor, getJudgeThreshold, getGrade, JUDGE_RULES, STRUCT_DISCLAIMER, type StructSpecInput, type StructSpecResult, type StructBOMItem, type LaborResult as StructLaborResult } from './structSpec';
export { lookupWindSpeed, WIND_DB, type WindData } from './wind';
