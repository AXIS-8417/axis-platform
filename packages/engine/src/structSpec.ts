// ═══════════════════════════════════════════════════════════════════
// AXIS 구조형(구조참고견적) 엔진 — v2.0
// 구조참고견적_설계명세서_v2.0.md + 구조검토_최종확정_v76.5 기반
// ★★★ 모든 상수는 v76.5 엑셀 검증 확정값. 임의 변경 금지.
// ═══════════════════════════════════════════════════════════════════

import { lookupWindSpeed, type WindData } from './wind';

// ─── 입출력 타입 ───────────────────────────────────────────────
export interface StructSpecInput {
  location: { sido: string; sigungu: string };
  panel: string;        // "RPP방음판" | "스틸방음판" | "EGI휀스"
  height: number;       // 판넬 높이 (M)
  dustH: number;        // 분진망 높이 (M), 0이면 미사용
  dustN: number;        // 분진망 단수, 0이면 미사용
  length: number;       // 총연장 (M)
  foundation: string;   // "기초파이프" | "베이스판" | "콘크리트"
  kzr?: number;         // 지표면조도계수 (기본 0.81)
  kzt?: number;         // 지형계수 (기본 1.0)
  constructionType?: '자동' | '비계식' | 'H빔식';  // 사용자 선택 시공방식 (기본: 자동)
}

export interface StructSpecResult {
  span: number;
  embedDepth: number;
  embedExposed: number;
  embedTotal: number;
  horiTier: number;
  jijuRatio: string;
  hasBracing: boolean;
  structType: string;
  postSpec: string;
  basis: {
    Vo: number; Kzr: number; Kzt: number; Iw: number; Gf: number;
    Cf: number; rho: number; pf_kN: number;
    stressRatio: number; horiStressRatio: number;
    Fs: number; sptN: number; phi: number;
    K_dist: number; bracingType: string;
  };
  confidence: string;
  warnings: string[];
}

// ─── 핵심 상수 (v76.5 확정) ──────────────────────────────────
const RHO = 1.25;       // 공기밀도 kg/m³ — KDS 41 00 00:2022
const IW = 0.60;        // 중요도계수 — 가시설 재현기간 1년
const SPT_N = 15;       // 지반 SPT-N 가정값
const PHI = 30;          // 내부마찰각 (°)
const GAMMA = 18;        // 토질 단위중량 (kN/m³)
const D_FOUND_PIPE = 0.0486;   // Φ48.6 파이프 직경 (m)
const D_FOUND_HBEAM = 0.45;    // H빔 기초 D450 (m)

// 비계파이프 제원 (P48.6×2.3T, SGT275) — DB_단면물성 확정
const PIPE = {
  D: 48.6, t: 2.3, A: 334.5,
  I: 89867,            // 단면2차모멘트 (mm⁴)
  Z: 3698,             // 단면계수 (mm³)
  r: 16.39,            // 단면2차반경 (mm)
  Fy: 275,             // 항복강도 (MPa) — SGT275
  fba: 175,            // 허용휨응력 (MPa) — Fy/1.5×1.25 가설할증
  tauA: 80,            // 허용전단응력 (MPa)
};

// H빔 물성 DB — 실제 사용하는 11종 (통합데이터 Z값 기준)
// 자동선정은 DB_높이규격매핑(HEIGHT_MAP)이 담당, 물성 조회는 여기서
// SS400 Fy=235MPa, fba=156MPa(가설할증), tauA=94MPa
const HBEAM: Record<string, { Z: number; A: number; Aw: number; fba: number }> = {
  'H-148×100':  { Z: 138000, A: 2684, Aw: 780,  fba: 156 },
  'H-150×150':  { Z: 219000, A: 4014, Aw: 910,  fba: 156 },
  'H-175×90':   { Z: 143000, A: 2304, Aw: 795,  fba: 156 },
  'H-175×175':  { Z: 356000, A: 5121, Aw: 1148, fba: 156 },
  'H-194×150':  { Z: 279000, A: 3901, Aw: 1056, fba: 156 },
  'H-200×100':  { Z: 184000, A: 2716, Aw: 1012, fba: 156 },
  'H-200×200':  { Z: 472000, A: 6353, Aw: 1408, fba: 156 },
  'H-200×204':  { Z: 498000, A: 7153, Aw: 2112, fba: 156 },
  'H-244×175':  { Z: 512000, A: 5624, Aw: 1554, fba: 156 },
  'H-250×125':  { Z: 356000, A: 3766, Aw: 1392, fba: 156 },
  'H-250×250':  { Z: 757000, A: 9218, Aw: 1998, fba: 156 },
};

// 강종 DB — 엑셀 DB_단면물성 확정
export const STEEL_GRADES = {
  SGT275: { Fy: 275, fba: 175, tauA: 80, use: '비계파이프 Φ48.6' },
  SS400:  { Fy: 235, fba: 156, tauA: 94, use: 'H빔, 각관' },
} as const;

// 각관 물성 (□100×100 — NS현용 자립식, 통합데이터 미포함 → KS 계산)
export const SQUARE_TUBE: Record<string, { Z: number; A: number; r: number; fba: number }> = {
  '□100×100×2.0t': { Z: 25109, A: 784, r: 40.0, fba: 156 },  // SS400
  '□100×100×2.3t': { Z: 28615, A: 899, r: 39.9, fba: 156 },  // SS400
};

// 풍력계수 — 판넬별 분기 (v76.5 구검서 확정)
function getCf(panel: string): number {
  switch (panel) {
    case 'RPP방음판': return 1.2;
    case 'EGI휀스':   return 1.2;
    case '스틸방음판': return 1.3;
    default:          return 1.2;
  }
}

// 기초파이프 노출부 — 높이별 (양주 현장확인)
function getExposedLength(totalH: number): number {
  if (totalH <= 4) return 1.0;
  if (totalH <= 6) return 1.5;
  return 2.0;
}

// DB_높이규격매핑 — v76.5 엑셀 13구간
const HEIGHT_MAP = [
  { id: 'M01', H_min: 3, H_max: 3, system: 'EGI비계', postSpec: 'P48.6', span: 2000, tier: 3, embed: 1500 },
  { id: 'M02', H_min: 3, H_max: 4, system: '일반비계', postSpec: 'P48.6', span: 2000, tier: 3, embed: 2000 },
  { id: 'M03', H_min: 3, H_max: 4, system: 'RPP비계', postSpec: 'P48.6', span: 3000, tier: 3, embed: 2000 },
  { id: 'M04', H_min: 5, H_max: 5, system: '자립식', postSpec: '□100×100×2.3t', span: 2000, tier: 4, embed: 0 },
  { id: 'M05', H_min: 5, H_max: 6, system: 'H-빔항타', postSpec: 'H-148×100', span: 3000, tier: 4, embed: 2000 },
  { id: 'M06', H_min: 6, H_max: 6, system: 'H-빔매립', postSpec: 'H-148×100', span: 2000, tier: 5, embed: 2000 },
  { id: 'M07', H_min: 6, H_max: 7, system: 'H-빔RPP', postSpec: 'H-200×100', span: 3000, tier: 5, embed: 2500 },
  { id: 'M08', H_min: 8, H_max: 8, system: 'H-빔', postSpec: 'H-194×150', span: 3000, tier: 6, embed: 3000 },
  { id: 'M09', H_min: 9, H_max: 9, system: 'H-빔', postSpec: 'H-194×150', span: 3000, tier: 7, embed: 3500 },
  { id: 'M10', H_min: 10, H_max: 10, system: 'H-빔RPP', postSpec: 'H-194×150', span: 3000, tier: 8, embed: 4000 },
  { id: 'M11', H_min: 11, H_max: 11, system: '자립식', postSpec: 'H-250×125', span: 3000, tier: 0, embed: 0 },
  { id: 'M12', H_min: 12, H_max: 12, system: '자립식', postSpec: 'H-250×125', span: 3000, tier: 0, embed: 0 },
  { id: 'M13', H_min: 14, H_max: 14, system: '특수', postSpec: 'H-250×250', span: 3000, tier: 0, embed: 0 },
];

function lookupPostSpec(totalH: number, structType: string): string {
  const keyword = structType === 'H빔식' ? '빔' : '비계';
  const m = HEIGHT_MAP.find(
    r => totalH >= r.H_min && totalH <= r.H_max && r.system.includes(keyword)
  );
  if (m) return m.postSpec;
  if (totalH <= 6) return 'H-148×100';
  if (totalH <= 8) return 'H-194×150';
  return 'H-194×150';
}

// DB_판정룰 — v76.5 엑셀 확정
export const JUDGE_RULES = [
  { id: 'HB_01', name: '지주 휨응력비',  passVal: 0.85, warnVal: 0.85, ngVal: 1.0, cmp: 'GT' },
  { id: 'HB_02', name: '횡대 합성응력',  passVal: 0.85, warnVal: 0.85, ngVal: 1.2, cmp: 'GT' },
  { id: 'HB_03', name: '전도 안전율',    passVal: 1.5,  warnVal: 1.5,  ngVal: 1.2, cmp: 'LT' },
  { id: 'HB_04', name: '지주 합성응력',  passVal: 0.85, warnVal: 0.85, ngVal: 1.2, cmp: 'GT' },
  { id: 'BK_01', name: '횡대 합성응력',  passVal: 0.85, warnVal: 0.85, ngVal: 1.0, cmp: 'GT' },
  { id: 'BK_02', name: '지주 응력비',    passVal: 0.75, warnVal: 0.90, ngVal: 1.0, cmp: 'GT' },
  { id: 'BK_03', name: '말뚝 응력비',    passVal: 0.75, warnVal: 0.90, ngVal: 1.0, cmp: 'GT' },
  { id: 'BK_04', name: '인발 안전율',    passVal: 3.0,  warnVal: 1.5,  ngVal: 1.2, cmp: 'LT' },
  { id: 'BK_05', name: '비계6m보조지주', passVal: 1,    warnVal: 0,    ngVal: 0,   cmp: 'BOOL' },
];

export function getJudgeThreshold(ruleID: string, field: 'PASS' | 'WARN' | 'NG'): number {
  const rule = JUDGE_RULES.find(r => r.id === ruleID);
  if (!rule) return 1.0;
  return field === 'PASS' ? rule.passVal : field === 'WARN' ? rule.warnVal : rule.ngVal;
}

export function getGrade(maxRatio: number, warnCount: number, ngCount: number): string {
  if (ngCount > 0) return 'F';
  if (warnCount >= 2) return 'D';
  if (warnCount >= 1) return 'C';
  if (maxRatio <= 0.75) return 'A';
  return 'B';
}

// ─── 응력비 계산: 비계식 ─────────────────────────────────────
// M=wH²/2(캔틸레버)×K_dist — v1.0의 wH²/8(단순보)에서 수정
function calcScaffoldStress(
  totalH: number, panelH: number, dustH: number,
  span: number, pf: number, K_dist: number
): number {
  const pf_N = pf * 1000;
  const W2 = pf_N * span;
  const W1 = dustH > 0 ? pf_N * span * 0.20 : 0;
  const M_cant = W2 * panelH * panelH / 2
               + W1 * dustH * (panelH + dustH / 2);
  const fb_cant = M_cant * 1000 / PIPE.Z;
  const fb_actual = fb_cant * K_dist;
  return fb_actual / PIPE.fba;
}

// ─── 응력비 계산: H빔식 ─────────────────────────────────────
function calcHBeamStress(
  totalH: number, panelH: number, dustH: number,
  pf: number, span: number, postSpec: string
): number {
  const beam = HBEAM[postSpec];
  if (!beam) return 999;
  const pf_N = pf * 1000;
  const W2 = pf_N * span;
  const W1 = dustH > 0 ? pf_N * span * 0.20 : 0;
  const M_post = W2 * panelH * panelH / 2
               + W1 * dustH * (panelH + dustH / 2);
  const fb_post = M_post * 1000 / beam.Z;
  return fb_post / beam.fba;
}

// ─── 전도 안전율 (기초파이프) ────────────────────────────────
// D_FOUND=0.0486(파이프)/0.45(H빔) — v1.0의 0.3에서 수정
function calcMinEmbed(
  totalH: number, panelH: number, dustH: number,
  span: number, pf: number, phi: number, D: number,
): { depth: number; Fs: number } {
  const Kp = Math.tan((45 + phi / 2) * Math.PI / 180) ** 2;
  const pf_N = pf * 1000;
  const W2 = pf_N * span;
  const W1 = dustH > 0 ? pf_N * span * 0.20 : 0;

  let bestD = 5.0;
  let bestFs = 0;

  for (let d = 1.0; d <= 5.0; d += 0.1) {
    const Pp = 0.5 * Kp * GAMMA * d * d * D * 2 * 1000;
    const Mo_total = W2 * panelH * (d + panelH / 2)
                   + (dustH > 0 ? W1 * dustH * (d + panelH + dustH / 2) : 0);
    const Mr = Pp * d / 3;
    const Fs = Mr / Mo_total;
    if (Fs >= 1.5) {
      bestD = Math.round(d * 10) / 10;
      bestFs = Math.round(Fs * 100) / 100;
      break;
    }
    bestFs = Fs;
  }

  return { depth: bestD, Fs: bestFs };
}

// ─── 메인 함수: CalcStructSpec ───────────────────────────────
export function CalcStructSpec(input: StructSpecInput): StructSpecResult {
  const totalH = input.height + input.dustH;
  const warnings: string[] = [];

  // STEP 1: 풍속 조회
  const wind = lookupWindSpeed(input.location.sido, input.location.sigungu);
  const Vo = wind.Vo;
  const Kzr = input.kzr ?? wind.Kzr_B;
  const Kzt = input.kzt ?? 1.0;
  const Gf = wind.Gf_B;
  const Cf = getCf(input.panel);

  // STEP 2: 풍압 (KDS 41 12 00)
  const Vd = Vo * Kzr * Kzt * IW;
  const pf = 0.5 * RHO * Vd * Vd * Gf * Cf / 1000;  // kN/m²

  // STEP 3: 구조타입 — 사용자 선택 우선, '자동'이면 높이 기반
  let structType: string;
  let postSpec: string;
  const userType = input.constructionType ?? '자동';
  if (userType === 'H빔식') {
    structType = 'H빔식';
    postSpec = lookupPostSpec(totalH, 'H빔식');
  } else if (userType === '비계식') {
    structType = '비계식';
    postSpec = 'P48.6';
  } else {
    // 자동: 높이 기반 결정
    if (totalH >= 7 || (input.panel === '스틸방음판' && totalH >= 6)) {
      structType = 'H빔식';
      postSpec = lookupPostSpec(totalH, 'H빔식');
    } else {
      structType = '비계식';
      postSpec = 'P48.6';
    }
  }

  // STEP 4: 보조지주 (비계식만)
  let hasBracing = false;
  if (structType === '비계식') {
    hasBracing = (totalH >= 5 || Vo >= 30);
    if (totalH >= 6 && !hasBracing) {
      hasBracing = true;
      warnings.push('H≥6m 비계식은 보조지주 필수 (구조적 불가)');
    }
  }

  // STEP 5: K_dist (보조지주 유무 분리 — v76.5 확정)
  let K_dist: number;
  if (structType === '비계식') {
    if (hasBracing) {
      K_dist = Math.exp(0.449 - 0.659 * totalH);
    } else {
      K_dist = Math.exp(-0.005 - 0.577 * totalH);
    }
  } else {
    K_dist = 1.0;
  }

  // STEP 6: 경간
  let span: number;
  let stressRatio: number;
  if (structType === 'H빔식') {
    span = 3.0;
    stressRatio = calcHBeamStress(totalH, input.height, input.dustH, pf, span, postSpec);
    if (stressRatio > 1.0) {
      span = 2.0;
      stressRatio = calcHBeamStress(totalH, input.height, input.dustH, pf, span, postSpec);
    }
  } else {
    const candidates = [3.0, 2.5, 2.0, 1.5];
    span = 1.5;
    stressRatio = 999;
    for (const s of candidates) {
      const ratio = calcScaffoldStress(totalH, input.height, input.dustH, s, pf, K_dist);
      if (ratio <= 1.0) { span = s; stressRatio = ratio; break; }
    }
    if (stressRatio > 1.0) {
      warnings.push(`경간 1.5M에서도 응력비 ${stressRatio.toFixed(2)} > 1.0. 구조검토서 필수.`);
    }
  }

  // STEP 7: 횡대 단수
  let horiTier: number;
  let horiStressRatio = 0;
  if (structType === 'H빔식') {
    horiTier = Math.max(3, Math.ceil(totalH * 0.8));
  } else {
    const panelH = input.height;
    horiTier = Math.ceil(panelH / 1.2) + 1;
    if (horiTier < 3) horiTier = 3;

    const burden = panelH / (horiTier - 1);
    const W_wind = pf * 1000 * burden;
    const W_dead = 300 * burden;
    const M_h = Math.sqrt(
      (W_dead * span * span / 10) ** 2 +
      (W_wind * span * span / 10) ** 2
    );
    const fb_h = M_h * 1000 / PIPE.Z;
    horiStressRatio = fb_h / PIPE.fba;

    while (horiStressRatio > 1.0 && horiTier < 10) {
      horiTier++;
      const newBurden = panelH / (horiTier - 1);
      const newW = pf * 1000 * newBurden;
      const newM = Math.sqrt(
        (300 * newBurden * span * span / 10) ** 2 +
        (newW * span * span / 10) ** 2
      );
      horiStressRatio = (newM * 1000 / PIPE.Z) / PIPE.fba;
    }

    horiTier = horiTier + input.dustN;
  }

  // STEP 8: 기초파이프
  let embedDepth = 0;
  let embedExposed = 0;
  let embedTotal = 0;
  let Fs = 999;
  if (input.foundation === '기초파이프') {
    const D_found = (structType === 'H빔식') ? D_FOUND_HBEAM : D_FOUND_PIPE;
    const result = calcMinEmbed(totalH, input.height, input.dustH, span, pf, PHI, D_found);
    embedDepth = result.depth;
    Fs = result.Fs;
    if (embedDepth < 1.5) embedDepth = 1.5;
    embedDepth = Math.ceil(embedDepth * 2) / 2;
    embedExposed = getExposedLength(totalH);
    embedTotal = embedDepth + embedExposed;
  }

  // STEP 9: 지주 비율
  const jijuRatio = structType === 'H빔식' ? 'N/A' : '1:1';

  // STEP 10: 신뢰도
  const confidence = totalH >= 8 ? '±25%추정' : '엔진계산';
  if (totalH >= 8) {
    warnings.push(`높이 ${totalH}M: 구검서 8m+ 미보유. ±25% 추정구간.`);
  }

  return {
    span, embedDepth, embedExposed, embedTotal,
    horiTier, jijuRatio, hasBracing, structType, postSpec,
    basis: {
      Vo, Kzr, Kzt, Iw: IW, Gf, Cf,
      rho: RHO, pf_kN: pf,
      stressRatio, horiStressRatio,
      Fs, sptN: SPT_N, phi: PHI,
      K_dist,
      bracingType: hasBracing ? '삼각트러스(6M+4M+1M)' : '없음',
    },
    confidence, warnings,
  };
}

// ─── 구조 근거 코멘트 자동생성 ──────────────────────────────
export function generateStructComment(input: StructSpecInput, spec: StructSpecResult): string[] {
  const comments: string[] = [];
  const b = spec.basis;

  comments.push(`현장위치: ${input.location.sido} ${input.location.sigungu}`);
  comments.push(`기본풍속: ${b.Vo}m/s (KDS 41 12 00:2022)`);
  comments.push(`노풍도: B (Kzr=${b.Kzr}, Kzt=${b.Kzt})`);
  comments.push(`설계풍압: ${b.pf_kN.toFixed(2)} kN/m² (Iw=${b.Iw}, ρ=${b.rho}, Cf=${b.Cf})`);
  comments.push(`구조타입: ${spec.structType} (${spec.postSpec})`);
  comments.push(`경간: ${spec.span}M (지주응력비 ${b.stressRatio.toFixed(2)})`);

  if (spec.embedDepth > 0) {
    comments.push(`기초파이프: ${spec.embedTotal}M (근입${spec.embedDepth}M+노출${spec.embedExposed}M)`);
    comments.push(`  전도안전율 Fs=${b.Fs.toFixed(2)} (SPT=${b.sptN}, φ=${b.phi}° 가정)`);
  }

  comments.push(`횡대: ${spec.horiTier}단 (응력비 ${b.horiStressRatio.toFixed(2)})`);
  comments.push(`지주: ${spec.jijuRatio}`);

  if (spec.hasBracing) {
    comments.push(`보조지주: ${b.bracingType}`);
  }

  if (spec.warnings.length > 0) {
    comments.push('');
    comments.push('⚠ 주의사항:');
    spec.warnings.forEach(w => comments.push(`  · ${w}`));
  }

  if (spec.confidence === '±25%추정') {
    comments.push(`★ 높이 ${input.height + input.dustH}M: 추정구간(±25%). 구조검토서 확인 권장`);
  }

  comments.push('');
  comments.push('※ 본 견적의 구조 조건은 AXIS 엔진이 현장 풍속·높이 기반으로 산출한 참고값이며,');
  comments.push('법적 구조검토서를 대체하지 않습니다.');
  comments.push(`풍하중 계수(Kzr=${b.Kzr}, Kzt=${b.Kzt}, Iw=${b.Iw}, ρ=${b.rho})는 표준값을 적용하였고,`);
  comments.push(`지반 조건은 표준값(SPT=${b.sptN}, φ=${b.phi}°)을 가정하였으며,`);
  comments.push('실제 시공 시 현장 여건에 따라 전문 구조기술사의 검토를 받으시기 바랍니다.');

  return comments;
}

// ─── BOM 생성: 구조형 ───────────────────────────────────────
export interface StructBOMItem {
  cat: string;
  name: string;
  qty: number;
  spec?: string;
  basis?: string;
}

export function generateStructBOM(input: StructSpecInput, spec: StructSpecResult): StructBOMItem[] {
  const len = input.length;
  const totalH = input.height + input.dustH;
  const juju = Math.ceil(len / spec.span) + 1;
  const jiuju = juju - 1;  // 1:1 고정
  const gicho = juju + jiuju;
  const bom: StructBOMItem[] = [];

  if (spec.structType === '비계식') {
    // 판넬
    const panelW = input.panel === 'RPP방음판' ? 0.67
                 : input.panel === '스틸방음판' ? 1.98 : 0.55;
    const panelQty = input.panel === '스틸방음판'
      ? Math.ceil(input.height / 0.5) * Math.ceil(len / panelW)
      : Math.ceil(len / panelW);
    bom.push({ cat: '자재', name: input.panel, qty: panelQty, spec: `H:${input.height}M` });

    // 횡대파이프
    const hwCount = (Math.floor(len / 6) + 1) * spec.horiTier - 1;
    bom.push({ cat: '자재', name: '횡대파이프', qty: hwCount, spec: '6.0M x 2.3T' });

    // 주주파이프
    bom.push({ cat: '자재', name: '주주파이프', qty: juju,
               spec: `${totalH.toFixed(1)}M x 2.3T` });

    // 지주파이프
    bom.push({ cat: '자재', name: '지주파이프', qty: jiuju,
               spec: `${(totalH * 0.75).toFixed(1)}M x 2.3T`, basis: '지주 1:1' });

    // 보조지주 세트 (3종) — 수량 = 주주수 (v2.0 확정)
    if (spec.hasBracing) {
      bom.push({ cat: '자재', name: '보조지주(6M)', qty: juju,
                 spec: '6.0M x 2.3T', basis: '삼각대 장사선(수직)' });
      bom.push({ cat: '자재', name: '보조지주(4M)', qty: juju,
                 spec: '4.0M x 2.3T', basis: '삼각대 단사선(경사)' });
      bom.push({ cat: '자재', name: '수평재(1M)',   qty: juju,
                 spec: '1.0M x 2.3T', basis: '삼각대 수평보강' });
    }

    // 기초파이프 — 길이=근입+노출 (v2.0 수정)
    if (input.foundation === '기초파이프') {
      bom.push({ cat: '자재', name: '기초파이프', qty: gicho,
                 spec: `${spec.embedTotal.toFixed(1)}M x 2.3T`,
                 basis: `근입${spec.embedDepth}M+노출${spec.embedExposed}M, Fs=${spec.basis.Fs.toFixed(2)}` });
    }

    // 부자재
    const jadong = juju + jiuju - 1;
    const gojung = Math.round(jadong * 2.54);
    bom.push({ cat: '부자재', name: '고정클램프', qty: gojung, spec: '48.6Ø' });
    bom.push({ cat: '부자재', name: '자동클램프', qty: jadong, spec: '48.6Ø' });
    bom.push({ cat: '부자재', name: '연결핀', qty: hwCount, spec: '48.6Ø' });

    if (input.dustN > 0) {
      bom.push({ cat: '부자재', name: '분진망', qty: Math.ceil(len / 40), spec: '40M/Roll' });
    }

    if (input.panel === 'RPP방음판') {
      bom.push({ cat: '부자재', name: '양개조이너', qty: (spec.horiTier + 1) * panelQty });
    } else if (input.panel === 'EGI휀스') {
      bom.push({ cat: '부자재', name: '후크볼트', qty: panelQty * spec.horiTier * 2 });
    } else if (input.panel === '스틸방음판') {
      bom.push({ cat: '부자재', name: 'H-BAR', qty: juju + 1 });
    }

  } else {
    // H빔식 — 지주/보조지주/수평재 전부 없음
    const panelW = input.panel === 'RPP방음판' ? 0.67
                 : input.panel === '스틸방음판' ? 1.98 : 0.55;
    const panelQty = input.panel === '스틸방음판'
      ? Math.ceil(input.height / 0.5) * Math.ceil(len / panelW)
      : Math.ceil(len / panelW);

    bom.push({ cat: '자재', name: input.panel, qty: panelQty });
    bom.push({ cat: '자재', name: 'H빔', qty: juju, spec: spec.postSpec });

    const hwCount = (Math.floor(len / 6) + 1) * spec.horiTier - 1;
    bom.push({ cat: '자재', name: 'C형강', qty: hwCount, spec: 'C-100' });

    if (input.foundation === '기초파이프') {
      bom.push({ cat: '자재', name: '기초파이프', qty: juju * 2,
                 spec: `${spec.embedTotal.toFixed(1)}M x 2.3T` });
    }

    bom.push({ cat: '부자재', name: '연결핀', qty: hwCount });

    if (input.dustN > 0) {
      bom.push({ cat: '부자재', name: '분진망', qty: Math.ceil(len / 40) });
    }
  }

  return bom;
}

// ─── 노무비 공식 (실전형/구조형 공통) ────────────────────────
export interface LaborResult {
  installTotal: number;
  removeTotal: number;
  total: number;
}

export function calcStructLabor(
  panel: string, len: number, h: number, span: number,
  contract: string, dustN: number, dustH: number,
  isHBeam: boolean
): LaborResult {
  const isBB = contract === '바이백';
  const BASE_INSTALL = 3500;
  const BASE_REMOVE = 2700;
  const baseInstPerM = h * BASE_INSTALL;
  const baseRemPerM = h * BASE_REMOVE;
  const panelExtra = panel === '스틸방음판' ? 2000 : 0;
  const hbeamInst = isHBeam ? 3000 : 0;
  const hbeamDemo = isHBeam ? 2000 : 0;

  const spanCoeff: Record<number, { install: number; remove: number }> = {
    1.5: { install: 0.15, remove: 0.10 },
    2.0: { install: 0.10, remove: 0.06 },
    2.5: { install: 0.05, remove: 0.03 },
    3.0: { install: 0.00, remove: 0.00 },
  };
  const sc = spanCoeff[span] ?? { install: 0, remove: 0 };

  const productivity = h <= 4 ? 150 : 50;
  const workDays = Math.ceil(len / productivity);
  const periodCharge = Math.max(0, workDays - 1) * 150000;

  const dustInst = len * dustN * 1500;
  const dustDemo = len * dustN * 1000;

  const instBase = baseInstPerM * len;
  const instPanel = panelExtra * len;
  const instHBeam = hbeamInst * len;
  const instSpan = Math.round((instBase + instPanel) * sc.install);
  const installTotal = instBase + instPanel + instHBeam + instSpan + dustInst + periodCharge;

  let removeTotal = 0;
  if (isBB) {
    const remBase = baseRemPerM * len;
    const remPanel = panelExtra * len;
    const remHBeam = hbeamDemo * len;
    const remSpan = Math.round((remBase + remPanel) * sc.remove);
    removeTotal = remBase + remPanel + remHBeam + remSpan + dustDemo + periodCharge;
  }

  return { installTotal, removeTotal, total: installTotal + removeTotal };
}

// ─── 면책 문구 ──────────────────────────────────────────────
export const STRUCT_DISCLAIMER = `※ 본 견적의 구조 조건은 AXIS 엔진이 현장 풍속·높이 기반으로 산출한 참고값이며,
법적 구조검토서를 대체하지 않습니다.
풍하중 계수(Kzr=0.81, Kzt=1.0, Iw=0.6, ρ=1.25)는 표준값을 적용하였고,
지반 조건은 표준값(SPT=15, φ=30°)을 가정하였으며,
실제 시공 시 현장 여건에 따라 전문 구조기술사의 검토를 받으시기 바랍니다.`;

// ─── 실측마스터 9건 (캘리브레이션 검증용) ────────────────────
// v76.5 엑셀 실측마스터_8건 시트에서 1:1 이식
// ★ 이 값이 정답. 엔진 계산 결과는 이 값과 비교해서 오차 확인용.
export const CALIBRATION_MASTER = [
  { id: 'CAL01', name: '창동EGI3m', system: '비계', panel: 'EGI', totalH: 3, panelH: 3, dustH: 0, W: 2, Vo: 28, pf: 0.306, F1V: 0.747, fbR: 0.992, Fs: 1.36 },
  { id: 'CAL02', name: '인천RPP4m', system: '비계', panel: 'RPP', totalH: 4, panelH: 4, dustH: 0, W: 3, Vo: 28, pf: 0.306, F1V: 0.394, fbR: 0.12, Fs: 1.82 },
  { id: 'CAL03', name: '동탄비계4+1', system: '비계', panel: '일반', totalH: 5, panelH: 4, dustH: 1, W: 2, Vo: 26, pf: 0.263, F1V: 0.416, fbR: 0.583, Fs: 1.24 },
  { id: 'CAL04', name: '파주비계4m', system: '비계', panel: '일반', totalH: 4, panelH: 4, dustH: 0, W: 2, Vo: 28, pf: 0.306, F1V: 0.751, fbR: 0.901, Fs: 1.99 },
  { id: 'CAL05', name: '동탄H빔5+1', system: 'H-빔', panel: 'RPP', totalH: 6, panelH: 5, dustH: 1, W: 3, Vo: 26, pf: 0.263, F1V: 0.305, fbR: 0.628, Fs: 9.18 },
  { id: 'CAL06', name: '동탄H빔6+1', system: 'H-빔', panel: 'RPP', totalH: 7, panelH: 6, dustH: 1, W: 3, Vo: 26, pf: 0.263, F1V: 0.377, fbR: 0.653, Fs: 11.68 },
  { id: 'CAL07', name: '부천H빔B3', system: 'H-빔', panel: '일반', totalH: 6, panelH: 6, dustH: 0, W: 3, Vo: 26, pf: 0.736, F1V: 0, fbR: 0, Fs: 0 },
  { id: 'CAL08', name: '부천H빔B2', system: 'H-빔', panel: '일반', totalH: 6, panelH: 6, dustH: 0, W: 2, Vo: 26, pf: 0.736, F1V: 0.74, fbR: 0.862, Fs: 0 },
  { id: 'CAL09', name: '양주RPP6m', system: '비계(보조지주)', panel: 'RPP', totalH: 6, panelH: 6, dustH: 0, W: 2, Vo: 28, pf: 0.33, F1V: 0, fbR: 0, Fs: 1.29 },
] as const;
