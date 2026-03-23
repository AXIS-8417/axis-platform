// AXIS 환경평가 엔진 — modEnv_v3.bas 이식
// V-World 지오코딩 + AirKorea PM10 → 소음/분진/진동 점수

// ══════════════════════════════════════════
// 환경 등급 정의
// ══════════════════════════════════════════
export type EnvGrade = 'LOW' | 'MID' | 'HIGH';

export interface EnvInput {
  address: string;
  region: string;           // 시/구 이름 (inferRegion 결과)
  panelHeight: number;
  isNight: boolean;         // 야간작업
  pm10?: number;            // PM10 수치 (API에서)
  landUse?: string;         // 용도지역 (주거/상업/공업/녹지)
}

export interface EnvScore {
  noise: number;            // 소음 점수 (0~100)
  dust: number;             // 분진 점수 (0~100)
  vibration: number;        // 진동 점수 (0~100)
  totalScore: number;       // 종합 점수
  grade: EnvGrade;
  pm10Grade: EnvGrade;
  recommendedDustHeight: number;  // 권장 분진망 높이 M
  regionMultiplier: number;
  warnings: string[];
}

// ══════════════════════════════════════════
// 지역 가중치 (VBA GetRegionMultiplier 이식)
// ══════════════════════════════════════════
const PREMIUM_DISTRICTS = ['강남', '서초', '송파', '마포', '용산'];
const SEOUL_DISTRICTS = ['종로', '중구', '동대문', '성동', '광진', '성북', '강북', '도봉', '노원', '은평', '서대문', '양천', '강서', '구로', '금천', '영등포', '동작', '관악'];

export function getRegionMultiplier(region: string): number {
  if (PREMIUM_DISTRICTS.some((d) => region.includes(d))) return 1.5;
  if (region.includes('서울') || SEOUL_DISTRICTS.some((d) => region.includes(d))) return 1.3;
  if (region.includes('경기') || region.includes('인천')) return 1.1;
  return 0.9;
}

// ══════════════════════════════════════════
// PM10 등급
// ══════════════════════════════════════════
export function getPM10Grade(pm10: number): EnvGrade {
  if (pm10 < 30) return 'LOW';
  if (pm10 > 80) return 'HIGH';
  return 'MID';
}

// ══════════════════════════════════════════
// 소음 점수 (높이/야간/지역 반영)
// ══════════════════════════════════════════
function calcNoiseScore(h: number, isNight: boolean, regionMult: number): number {
  let base = 30;
  // 높이별 가중
  if (h >= 7) base += 30;
  else if (h >= 5) base += 20;
  else if (h >= 3) base += 10;

  // 야간
  if (isNight) base += 20;

  return Math.min(100, Math.round(base * regionMult));
}

// ══════════════════════════════════════════
// 분진 점수 (PM10/높이/지역 반영)
// ══════════════════════════════════════════
function calcDustScore(h: number, pm10Grade: EnvGrade, regionMult: number): number {
  let base = 20;
  if (pm10Grade === 'HIGH') base += 40;
  else if (pm10Grade === 'MID') base += 20;

  if (h >= 6) base += 15;
  else if (h >= 4) base += 10;

  return Math.min(100, Math.round(base * regionMult));
}

// ══════════════════════════════════════════
// 진동 점수 (높이/지역 반영)
// ══════════════════════════════════════════
function calcVibrationScore(h: number, regionMult: number): number {
  let base = 15;
  if (h >= 8) base += 25;
  else if (h >= 5) base += 15;
  else if (h >= 3) base += 5;

  return Math.min(100, Math.round(base * regionMult));
}

// ══════════════════════════════════════════
// 권장 분진망 높이 (VBA 이식)
// ══════════════════════════════════════════
function recommendDustHeight(grade: EnvGrade, regionMult: number): number {
  // 강남권(1.5) → 항상 6M+
  if (regionMult >= 1.5) return 6;
  if (grade === 'HIGH') return 6;
  if (grade === 'MID') return 4;
  return 3;
}

// ══════════════════════════════════════════
// 메인: 환경평가
// ══════════════════════════════════════════
export function calcEnvAssessment(input: EnvInput): EnvScore {
  const regionMult = getRegionMultiplier(input.region);
  const pm10 = input.pm10 ?? 50; // 기본값 MID
  const pm10Grade = getPM10Grade(pm10);

  const noise = calcNoiseScore(input.panelHeight, input.isNight, regionMult);
  const dust = calcDustScore(input.panelHeight, pm10Grade, regionMult);
  const vibration = calcVibrationScore(input.panelHeight, regionMult);

  const totalScore = Math.round((noise * 0.4 + dust * 0.35 + vibration * 0.25));

  let grade: EnvGrade;
  if (totalScore >= 70) grade = 'HIGH';
  else if (totalScore >= 40) grade = 'MID';
  else grade = 'LOW';

  const recommendedDustHeight = recommendDustHeight(grade, regionMult);

  const warnings: string[] = [];
  if (grade === 'HIGH') warnings.push('환경 민감 지역: 소음/분진 저감 조치 필수');
  if (pm10Grade === 'HIGH') warnings.push('미세먼지 고농도: 분진망 필수 설치');
  if (input.isNight) warnings.push('야간작업: 소음 기준 강화 (65dB → 50dB)');
  if (regionMult >= 1.5) warnings.push('프리미엄 지역: 민원 리스크 높음');
  if (input.panelHeight >= 7) warnings.push('고소작업: 안전관리 강화');

  return {
    noise, dust, vibration, totalScore, grade, pm10Grade,
    recommendedDustHeight, regionMultiplier: regionMult, warnings,
  };
}
