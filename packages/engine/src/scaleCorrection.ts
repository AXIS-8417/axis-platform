// AXIS 규모보정계수 + 구조타입 보정 — 설계서 v4.8 §4.3~4.4 Table 8
// 소규모 고단가, 대규모 저단가 패턴 반영

// ══════════════════════════════════════════
// 규모보정계수 (Table 8, 4단계)
// 기준: 150~300M = 1.00
// ══════════════════════════════════════════
export interface ScaleBand {
  label: string;
  min: number;
  max: number;
  medianPerM: number;
  factor: number;
}

export const SCALE_BANDS: ScaleBand[] = [
  { label: '소(~50M)',      min: 0,   max: 50,  medianPerM: 105000, factor: 1.60 },
  { label: '중소(50~150M)', min: 50,  max: 150, medianPerM: 70229,  factor: 1.03 },
  { label: '중(150~300M)',  min: 150, max: 300, medianPerM: 63545,  factor: 1.00 },
  { label: '대(300M+)',     min: 300, max: Infinity, medianPerM: 64000, factor: 0.97 },
];

export function getScaleFactor(totalLength: number): { band: ScaleBand; factor: number } {
  const band = SCALE_BANDS.find(b => totalLength > b.min && totalLength <= b.max)
    ?? SCALE_BANDS[2]; // 기준 폴백
  return { band, factor: band.factor };
}

// ══════════════════════════════════════════
// 구조타입 보정계수 (Table, §4.4)
// ══════════════════════════════════════════
export type StructureType = '비계식' | '보조지주' | 'H빔';

const STRUCTURE_FACTORS: Record<StructureType, number> = {
  '비계식': 1.00,
  '보조지주': 2.18,
  'H빔': 5.55,
};

export function getStructureFactor(type: StructureType): number {
  return STRUCTURE_FACTORS[type] ?? 1.00;
}

// ══════════════════════════════════════════
// 경간 난이도계수 (Table 34)
// 기준: 3.0M = 1.00
// ══════════════════════════════════════════
export interface SpanDifficulty {
  span: number;
  installFactor: number;
  removeFactor: number;
}

export const SPAN_DIFFICULTY: SpanDifficulty[] = [
  { span: 3.0, installFactor: 1.00, removeFactor: 1.00 },
  { span: 2.5, installFactor: 1.05, removeFactor: 1.03 },
  { span: 2.0, installFactor: 1.10, removeFactor: 1.06 },
  { span: 1.5, installFactor: 1.15, removeFactor: 1.10 },
];

export function getSpanDifficulty(span: number): SpanDifficulty {
  return SPAN_DIFFICULTY.find(s => Math.abs(s.span - span) < 0.01)
    ?? SPAN_DIFFICULTY[0]; // 3.0M 기본
}

// ══════════════════════════════════════════
// 통합 보정 적용
// ══════════════════════════════════════════
export interface CorrectionInput {
  totalLength: number;
  structureType: StructureType;
  span: number;
}

export interface CorrectionResult {
  scaleFactor: number;
  scaleLabel: string;
  structureFactor: number;
  spanInstallFactor: number;
  spanRemoveFactor: number;
  combinedFactor: number; // scale × structure (경간은 노무비에만 적용)
}

export function calcCorrections(input: CorrectionInput): CorrectionResult {
  const { band, factor: scaleFactor } = getScaleFactor(input.totalLength);
  const structureFactor = getStructureFactor(input.structureType);
  const spanDiff = getSpanDifficulty(input.span);

  return {
    scaleFactor,
    scaleLabel: band.label,
    structureFactor,
    spanInstallFactor: spanDiff.installFactor,
    spanRemoveFactor: spanDiff.removeFactor,
    combinedFactor: Math.round(scaleFactor * structureFactor * 100) / 100,
  };
}
