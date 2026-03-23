// AXIS KDS 구조검토 엔진 — modStructural_v76.bas 이식
// 풍하중 Pf → 비계식/빔식 분기 → 최소근입깊이 → H빔 선정

// ══════════════════════════════════════════
// 물리 상수 (VBA 상수 이식)
// ══════════════════════════════════════════
const RHO_AIR = 1.25;              // kg/m³ 공기밀도
const PIPE_Z = 3698;               // mm³ 단면계수 (Φ48.6×2.4)
const PIPE_A = 334.5;              // mm² 단면적
const FBA_PIPE = 140;              // MPa 파이프 허용응력
const FBA_HBEAM = 156;             // MPa H빔 허용응력
const GAMMA_SOIL = 18;             // kN/m³ 토양 단위중량
const PHI = 25;                    // ° 내부마찰각
const FS_MIN = 1.5;                // 최소 안전율

// ══════════════════════════════════════════
// 풍속 파라미터 (VBA REGION_DB 확장)
// ══════════════════════════════════════════
export interface WindParams {
  Vo: number;    // 기본풍속 m/s
  Kzr: number;   // 풍속고도분포계수 (기본 1.0)
  Kzt: number;   // 지형계수 (기본 1.0)
  Iw: number;    // 중요도계수 (기본 1.0)
  Gf: number;    // 가스트계수 (기본 2.0)
  Cf: number;    // 풍력계수 (기본 1.2)
}

const DEFAULT_WIND: WindParams = {
  Vo: 26, Kzr: 1.0, Kzt: 1.0, Iw: 1.0, Gf: 2.0, Cf: 1.2,
};

// ══════════════════════════════════════════
// H빔 단면 DB (DB_단면물성 시트 기반)
// ══════════════════════════════════════════
export interface HBeamSection {
  name: string;       // H-100×100, H-125×125, ...
  height: number;     // mm
  width: number;      // mm
  tw: number;         // 웹두께 mm
  tf: number;         // 플랜지두께 mm
  area: number;       // cm²
  Ix: number;         // cm⁴ 단면2차모멘트
  Zx: number;         // cm³ 단면계수
  weight: number;     // kg/m
}

export const HBEAM_DB: HBeamSection[] = [
  { name: 'H-100×100', height: 100, width: 100, tw: 6, tf: 8, area: 21.9, Ix: 378, Zx: 75.6, weight: 17.2 },
  { name: 'H-125×125', height: 125, width: 125, tw: 6.5, tf: 9, area: 30.31, Ix: 847, Zx: 135.5, weight: 23.8 },
  { name: 'H-150×150', height: 150, width: 150, tw: 7, tf: 10, area: 40.14, Ix: 1640, Zx: 218.7, weight: 31.5 },
  { name: 'H-175×175', height: 175, width: 175, tw: 7.5, tf: 11, area: 51.21, Ix: 2880, Zx: 329.1, weight: 40.2 },
  { name: 'H-200×200', height: 200, width: 200, tw: 8, tf: 12, area: 63.53, Ix: 4720, Zx: 472.0, weight: 49.9 },
  { name: 'H-250×250', height: 250, width: 250, tw: 9, tf: 14, area: 92.18, Ix: 10800, Zx: 864.0, weight: 72.4 },
  { name: 'H-300×300', height: 300, width: 300, tw: 10, tf: 15, area: 119.8, Ix: 20400, Zx: 1360, weight: 94.0 },
  { name: 'H-350×350', height: 350, width: 350, tw: 12, tf: 19, area: 173.9, Ix: 40300, Zx: 2300, weight: 137 },
  { name: 'H-400×400', height: 400, width: 400, tw: 13, tf: 21, area: 218.7, Ix: 66600, Zx: 3330, weight: 172 },
];

// ══════════════════════════════════════════
// 입력/출력 인터페이스
// ══════════════════════════════════════════
export interface StructuralInput {
  panelHeight: number;           // M
  span: number;                  // M (경간)
  totalLength: number;           // M
  constructionType: '파이프' | 'H-빔';
  panelType: '스틸' | 'RPP' | 'EGI';
  wind?: Partial<WindParams>;
  isConcrete: boolean;           // 콘크리트 기초
}

export interface StructuralResult {
  structType: '비계식' | '빔식';
  Pf: number;                    // kN/m² 설계풍압
  Vd: number;                    // m/s 설계풍속

  // 비계식 검토
  scaffoldOk?: boolean;
  scaffoldStress?: number;       // MPa
  scaffoldAllowable?: number;    // MPa
  scaffoldRatio?: number;        // 응력비

  // H빔 검토
  hbeamOk?: boolean;
  selectedBeam?: string;
  hbeamStress?: number;
  hbeamAllowable?: number;
  hbeamRatio?: number;

  // 근입깊이
  minEmbedDepth: number;         // M
  safetyFactor: number;

  // 권고
  warnings: string[];
  recommendation: string;
}

// ══════════════════════════════════════════
// 1. 설계풍압 계산 (CalcPf_v2)
// Pf = 0.5 × ρ × Vd² × Gf × Cf / 1000  (kN/m²)
// ══════════════════════════════════════════
export function calcDesignWindPressure(wind: WindParams): { Pf: number; Vd: number } {
  const Vd = wind.Vo * wind.Kzr * wind.Kzt * wind.Iw;
  const Pf = (0.5 * RHO_AIR * Vd * Vd * wind.Gf * wind.Cf) / 1000;
  return { Pf: Math.round(Pf * 1000) / 1000, Vd: Math.round(Vd * 100) / 100 };
}

// ══════════════════════════════════════════
// 2. 구조형식 판정 (DetermineStructType)
// ══════════════════════════════════════════
export function determineStructType(h: number, requestedType: '파이프' | 'H-빔'): '비계식' | '빔식' {
  if (h >= 7 || requestedType === 'H-빔') return '빔식';
  return '비계식';
}

// ══════════════════════════════════════════
// 3. 비계식 검토 (CalcScaffold_v2)
// ══════════════════════════════════════════
function checkScaffold(Pf: number, h: number, span: number): {
  ok: boolean; stress: number; allowable: number; ratio: number;
} {
  // 단위풍하중 w = Pf × span (kN/m)
  const w = Pf * span;
  // 캔틸레버 모멘트 M = w × h² / 2 (kN·m)
  const M = (w * h * h) / 2;
  // 응력 σ = M × 10⁶ / Z (MPa)
  const stress = (M * 1e6) / PIPE_Z;
  const ratio = stress / FBA_PIPE;

  return {
    ok: ratio <= 1.0,
    stress: Math.round(stress * 10) / 10,
    allowable: FBA_PIPE,
    ratio: Math.round(ratio * 1000) / 1000,
  };
}

// ══════════════════════════════════════════
// 4. 최소근입깊이 (CalcMinEmbedDepth)
// 반복법: Fs >= 1.5 (embed 1.5~5.0m, step 0.1)
// ══════════════════════════════════════════
export function calcMinEmbedDepth(Pf: number, h: number, span: number): {
  depth: number; safetyFactor: number;
} {
  const w = Pf * span; // kN/m
  const M_overturn = (w * h * h) / 2; // 전도모멘트 kN·m

  const Ka = Math.tan((45 - PHI / 2) * Math.PI / 180) ** 2; // 주동토압계수
  const Kp = Math.tan((45 + PHI / 2) * Math.PI / 180) ** 2; // 수동토압계수

  let bestDepth = 5.0;
  let bestFs = 0;

  for (let d = 1.5; d <= 5.0; d += 0.1) {
    // 수동토압 저항모멘트
    const Pp = 0.5 * GAMMA_SOIL * d * d * Kp; // kN/m
    const M_resist = Pp * d / 3; // kN·m

    // 주동토압 작용모멘트
    const Pa = 0.5 * GAMMA_SOIL * d * d * Ka;
    const M_active = Pa * d / 3;

    const Fs = M_resist / (M_overturn + M_active);

    if (Fs >= FS_MIN) {
      bestDepth = Math.round(d * 10) / 10;
      bestFs = Math.round(Fs * 100) / 100;
      break;
    }
    bestFs = Math.round(Fs * 100) / 100;
  }

  return { depth: bestDepth, safetyFactor: bestFs };
}

// ══════════════════════════════════════════
// 5. 최적 H빔 선정 (SelectOptimalHBeam)
// ══════════════════════════════════════════
export function selectOptimalHBeam(Pf: number, h: number, span: number): {
  beam: HBeamSection | null;
  stress: number;
  ratio: number;
  ok: boolean;
} {
  const w = Pf * span;
  const M = (w * h * h) / 2; // kN·m

  // 경량순 탐색
  for (const beam of HBEAM_DB) {
    // σ = M × 10⁶ / (Zx × 10³)  [Zx: cm³ → mm³]
    const stress = (M * 1e6) / (beam.Zx * 1e3);
    const ratio = stress / FBA_HBEAM;

    if (ratio <= 1.0) {
      return {
        beam,
        stress: Math.round(stress * 10) / 10,
        ratio: Math.round(ratio * 1000) / 1000,
        ok: true,
      };
    }
  }

  // 최대 단면도 불충분
  const lastBeam = HBEAM_DB[HBEAM_DB.length - 1];
  const stress = (M * 1e6) / (lastBeam.Zx * 1e3);
  return {
    beam: lastBeam,
    stress: Math.round(stress * 10) / 10,
    ratio: Math.round((stress / FBA_HBEAM) * 1000) / 1000,
    ok: false,
  };
}

// ══════════════════════════════════════════
// 메인: 구조검토 실행
// ══════════════════════════════════════════
export function runStructuralCheck(input: StructuralInput): StructuralResult {
  const wind: WindParams = { ...DEFAULT_WIND, ...input.wind };
  const { Pf, Vd } = calcDesignWindPressure(wind);
  const structType = determineStructType(input.panelHeight, input.constructionType);

  const warnings: string[] = [];
  let recommendation = '';

  // 비계식 검토
  let scaffoldResult: ReturnType<typeof checkScaffold> | undefined;
  if (structType === '비계식') {
    scaffoldResult = checkScaffold(Pf, input.panelHeight, input.span);
    if (!scaffoldResult.ok) {
      warnings.push(`비계식 응력비 ${scaffoldResult.ratio} > 1.0 — H빔식 전환 권장`);
      recommendation = 'H빔식 전환 필요';
    } else {
      recommendation = `비계식 OK (응력비 ${scaffoldResult.ratio})`;
    }
  }

  // H빔 검토
  let hbeamResult: ReturnType<typeof selectOptimalHBeam> | undefined;
  if (structType === '빔식' || (scaffoldResult && !scaffoldResult.ok)) {
    hbeamResult = selectOptimalHBeam(Pf, input.panelHeight, input.span);
    if (hbeamResult.ok) {
      recommendation = `${hbeamResult.beam!.name} 선정 (응력비 ${hbeamResult.ratio})`;
    } else {
      warnings.push('최대 H빔 단면도 불충분 — 특수설계 필요');
      recommendation = '특수설계 검토 필요';
    }
  }

  // 근입깊이
  const embed = input.isConcrete
    ? { depth: 0, safetyFactor: 99 }
    : calcMinEmbedDepth(Pf, input.panelHeight, input.span);

  if (!input.isConcrete && embed.safetyFactor < FS_MIN) {
    warnings.push(`근입깊이 5.0M에서도 Fs=${embed.safetyFactor} < ${FS_MIN}`);
  }

  // 높이 경고
  if (input.panelHeight >= 8) warnings.push('H>=8M: 특별안전관리 대상');
  if (Vd >= 30) warnings.push(`설계풍속 ${Vd}m/s: 강풍 지역`);

  return {
    structType,
    Pf, Vd,
    scaffoldOk: scaffoldResult?.ok,
    scaffoldStress: scaffoldResult?.stress,
    scaffoldAllowable: scaffoldResult ? FBA_PIPE : undefined,
    scaffoldRatio: scaffoldResult?.ratio,
    hbeamOk: hbeamResult?.ok,
    selectedBeam: hbeamResult?.beam?.name,
    hbeamStress: hbeamResult?.stress,
    hbeamAllowable: hbeamResult ? FBA_HBEAM : undefined,
    hbeamRatio: hbeamResult?.ratio,
    minEmbedDepth: embed.depth,
    safetyFactor: embed.safetyFactor,
    warnings,
    recommendation,
  };
}
