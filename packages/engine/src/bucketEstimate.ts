// AXIS 비율 기반 간편견적 (버킷 시스템) — 설계서 v4.8 §4, §10
// 364건 실전 데이터 → 60 버킷 → 재/노/경 비율 + M당 단가 추정
// 2층 구조: [1층] 정적 비율 기반 + [2층] 동적 보정 (운반/장비/거리)

import { getScaleFactor } from './scaleCorrection';

// ══════════════════════════════════════════
// 타입 정의
// ══════════════════════════════════════════
export type BucketPanel = 'EGI' | 'RPP' | '스틸';
export type BucketAsset = '전체고재' | '전체신재' | '판넬만신재' | '파이프만신재';
export type BucketContract = 'BB' | 'SELL';
export type BucketTier = 'A' | 'B' | 'C' | 'D';

export interface BucketKey {
  panel: BucketPanel;
  asset: BucketAsset;
  contract: BucketContract;
}

export interface BucketData {
  key: BucketKey;
  count: number;
  tier: BucketTier;
  ratios: { mat: number; lab: number; exp: number; door: number };
  bbDeductPct: number;
  perM: Record<string, number>; // 높이범위별 M당 단가
}

// ══════════════════════════════════════════
// Tier 판정 (Table 37)
// A: 10건+, B: 3~9건, C: 1~2건/보간, D: 없음
// ══════════════════════════════════════════
function getTier(count: number): BucketTier {
  if (count >= 10) return 'A';
  if (count >= 3) return 'B';
  if (count >= 1) return 'C';
  return 'D';
}

// ══════════════════════════════════════════
// 364건 실전 데이터에서 추출한 버킷 DB
// (판넬유형 × 자산구분 × 계약유형) → 비율 + M당 단가
// ══════════════════════════════════════════
const BUCKET_DB: BucketData[] = [
  // EGI × BB
  { key: { panel: 'EGI', asset: '전체고재', contract: 'BB' }, count: 50, tier: 'A',
    ratios: { mat: 47.7, lab: 31.0, exp: 11.7, door: 9.6 }, bbDeductPct: 31.2,
    perM: { '~2M': 38500, '2.1~2.5M': 52800, '2.6~3M': 49200, '3.1~4M': 68000, '4M+': 185000 } },
  { key: { panel: 'EGI', asset: '전체신재', contract: 'BB' }, count: 93, tier: 'A',
    ratios: { mat: 50.3, lab: 28.3, exp: 10.7, door: 11.1 }, bbDeductPct: 25.4,
    perM: { '~2M': 45200, '2.1~2.5M': 62500, '2.6~3M': 58400, '3.1~4M': 82000, '4M+': 225000 } },
  { key: { panel: 'EGI', asset: '판넬만신재', contract: 'BB' }, count: 2, tier: 'C',
    ratios: { mat: 47.6, lab: 23.6, exp: 9.7, door: 19.4 }, bbDeductPct: 30.1,
    perM: { '~2M': 42000, '2.1~2.5M': 58000, '2.6~3M': 54000, '3.1~4M': 75000, '4M+': 200000 } },
  { key: { panel: 'EGI', asset: '파이프만신재', contract: 'BB' }, count: 18, tier: 'A',
    ratios: { mat: 50.8, lab: 26.7, exp: 9.1, door: 13.4 }, bbDeductPct: 25.2,
    perM: { '~2M': 43000, '2.1~2.5M': 59500, '2.6~3M': 55800, '3.1~4M': 78000, '4M+': 210000 } },

  // EGI × SELL
  { key: { panel: 'EGI', asset: '전체고재', contract: 'SELL' }, count: 39, tier: 'A',
    ratios: { mat: 61.6, lab: 19.7, exp: 14.5, door: 4.9 }, bbDeductPct: 0,
    perM: { '~2M': 35200, '2.1~2.5M': 48500, '2.6~3M': 45100, '3.1~4M': 63000, '4M+': 170000 } },
  { key: { panel: 'EGI', asset: '전체신재', contract: 'SELL' }, count: 101, tier: 'A',
    ratios: { mat: 62.8, lab: 18.5, exp: 10.8, door: 8.5 }, bbDeductPct: 0,
    perM: { '~2M': 43700, '2.1~2.5M': 60200, '2.6~3M': 56200, '3.1~4M': 79400, '4M+': 216400 } },
  { key: { panel: 'EGI', asset: '판넬만신재', contract: 'SELL' }, count: 6, tier: 'B',
    ratios: { mat: 53.8, lab: 20.5, exp: 14.5, door: 13.4 }, bbDeductPct: 0,
    perM: { '~2M': 40000, '2.1~2.5M': 55000, '2.6~3M': 51000, '3.1~4M': 72000, '4M+': 195000 } },
  { key: { panel: 'EGI', asset: '파이프만신재', contract: 'SELL' }, count: 31, tier: 'A',
    ratios: { mat: 59.6, lab: 17.4, exp: 12.6, door: 10.7 }, bbDeductPct: 0,
    perM: { '~2M': 39000, '2.1~2.5M': 54000, '2.6~3M': 50500, '3.1~4M': 71000, '4M+': 190000 } },

  // RPP (21건 전체, tier B~C)
  { key: { panel: 'RPP', asset: '전체고재', contract: 'BB' }, count: 5, tier: 'B',
    ratios: { mat: 45.0, lab: 33.0, exp: 12.0, door: 10.0 }, bbDeductPct: 28.0,
    perM: { '~2M': 52000, '2.1~2.5M': 72000, '2.6~3M': 67000, '3.1~4M': 95000, '4M+': 260000 } },
  { key: { panel: 'RPP', asset: '전체신재', contract: 'BB' }, count: 8, tier: 'B',
    ratios: { mat: 52.0, lab: 27.0, exp: 10.0, door: 11.0 }, bbDeductPct: 23.0,
    perM: { '~2M': 58000, '2.1~2.5M': 80000, '2.6~3M': 75000, '3.1~4M': 106000, '4M+': 290000 } },
  { key: { panel: 'RPP', asset: '전체고재', contract: 'SELL' }, count: 3, tier: 'B',
    ratios: { mat: 58.0, lab: 22.0, exp: 12.0, door: 8.0 }, bbDeductPct: 0,
    perM: { '~2M': 48000, '2.1~2.5M': 66000, '2.6~3M': 62000, '3.1~4M': 87000, '4M+': 240000 } },
  { key: { panel: 'RPP', asset: '전체신재', contract: 'SELL' }, count: 5, tier: 'B',
    ratios: { mat: 63.0, lab: 19.0, exp: 9.0, door: 9.0 }, bbDeductPct: 0,
    perM: { '~2M': 55000, '2.1~2.5M': 76000, '2.6~3M': 71000, '3.1~4M': 100000, '4M+': 275000 } },

  // 스틸 (EGI × 1.5 보간, tier D)
  { key: { panel: '스틸', asset: '전체신재', contract: 'SELL' }, count: 1, tier: 'D',
    ratios: { mat: 65.0, lab: 18.0, exp: 10.0, door: 7.0 }, bbDeductPct: 0,
    perM: { '~2M': 65000, '2.1~2.5M': 90000, '2.6~3M': 84000, '3.1~4M': 119000, '4M+': 325000 } },
  { key: { panel: '스틸', asset: '전체신재', contract: 'BB' }, count: 1, tier: 'D',
    ratios: { mat: 54.0, lab: 26.0, exp: 10.0, door: 10.0 }, bbDeductPct: 22.0,
    perM: { '~2M': 68000, '2.1~2.5M': 94000, '2.6~3M': 87000, '3.1~4M': 123000, '4M+': 338000 } },
];

// ══════════════════════════════════════════
// 높이 범위 키 변환
// ══════════════════════════════════════════
function getHeightKey(h: number): string {
  if (h <= 2) return '~2M';
  if (h <= 2.5) return '2.1~2.5M';
  if (h <= 3) return '2.6~3M';
  if (h <= 4) return '3.1~4M';
  return '4M+';
}

// ══════════════════════════════════════════
// 버킷 조회
// ══════════════════════════════════════════
export function findBucket(key: BucketKey): BucketData | undefined {
  return BUCKET_DB.find(b =>
    b.key.panel === key.panel &&
    b.key.asset === key.asset &&
    b.key.contract === key.contract
  );
}

// ══════════════════════════════════════════
// 간편견적 입력
// ══════════════════════════════════════════
export interface SimpleEstimateInput {
  panel: BucketPanel;
  asset: BucketAsset;
  contract: BucketContract;
  height: number;          // M
  totalLength: number;     // M
  bbMonths?: number;       // BB 개월 수
  hasDoor?: boolean;
  doorWidthM?: number;
}

export interface SimpleEstimateResult {
  // 핵심 수치
  totalEstimate: number;      // 총견적금액
  perM: number;               // M당 단가
  matAmount: number;          // 자재비
  labAmount: number;          // 노무비
  expAmount: number;          // 경비
  doorAmount: number;         // 도어비
  bbDeductAmount: number;     // BB 차감액

  // 비율
  ratios: { mat: number; lab: number; exp: number; door: number };
  bbDeductPct: number;

  // 메타
  bucket: BucketKey;
  tier: BucketTier;
  tierLabel: string;
  dataCount: number;
  scaleFactor: number;
  scaleLabel: string;
  heightKey: string;

  // 신뢰구간 (P25~P75)
  range: { low: number; high: number };
  confidence: string;
}

// ══════════════════════════════════════════
// 메인: 비율 기반 간편견적
// ══════════════════════════════════════════
export function calcSimpleEstimate(input: SimpleEstimateInput): SimpleEstimateResult {
  const bucket = findBucket({
    panel: input.panel, asset: input.asset, contract: input.contract,
  });

  // 폴백: EGI 전체신재 SELL
  const fallback = BUCKET_DB[5]; // EGI/전체신재/SELL
  const data = bucket ?? fallback;

  const heightKey = getHeightKey(input.height);
  const basePerM = data.perM[heightKey] ?? data.perM['2.1~2.5M'] ?? 60000;

  // 규모보정
  const { band, factor: scaleFactor } = getScaleFactor(input.totalLength);
  const adjustedPerM = Math.round(basePerM * scaleFactor);

  // 총견적금액
  const totalBeforeDoor = adjustedPerM * input.totalLength;

  // 비율 분해
  const { mat, lab, exp, door } = data.ratios;
  const ratioSum = mat + lab + exp + (input.hasDoor ? door : 0);

  const matPct = mat / ratioSum * 100;
  const labPct = lab / ratioSum * 100;
  const expPct = exp / ratioSum * 100;
  const doorPct = input.hasDoor ? (door / ratioSum * 100) : 0;

  const matAmount = Math.round(totalBeforeDoor * matPct / 100);
  const labAmount = Math.round(totalBeforeDoor * labPct / 100);
  const expAmount = Math.round(totalBeforeDoor * expPct / 100);
  const doorAmount = input.hasDoor ? Math.round(totalBeforeDoor * doorPct / 100) : 0;

  const totalEstimate = matAmount + labAmount + expAmount + doorAmount;

  // BB 차감
  let bbDeductAmount = 0;
  if (input.contract === 'BB' && data.bbDeductPct > 0) {
    bbDeductAmount = Math.round(matAmount * data.bbDeductPct / 100);
  }

  // 신뢰구간 (Tier별)
  let rangeMultLow: number, rangeMultHigh: number, confidence: string;
  switch (data.tier) {
    case 'A': rangeMultLow = 0.85; rangeMultHigh = 1.15; confidence = '충분 (P25~P75)'; break;
    case 'B': rangeMultLow = 0.80; rangeMultHigh = 1.20; confidence = '참고 (P25~P75)'; break;
    case 'C': rangeMultLow = 0.75; rangeMultHigh = 1.25; confidence = '추정 (±20%)'; break;
    default:  rangeMultLow = 0.70; rangeMultHigh = 1.30; confidence = '부족 (엔진+AI)'; break;
  }

  const tierLabels: Record<BucketTier, string> = {
    'A': '충분 (10건+)', 'B': '참고 (3~9건)', 'C': '추정 (1~2건)', 'D': '부족 (보간)',
  };

  return {
    totalEstimate: totalEstimate - bbDeductAmount,
    perM: adjustedPerM,
    matAmount, labAmount, expAmount, doorAmount,
    bbDeductAmount,
    ratios: { mat: Math.round(matPct * 10) / 10, lab: Math.round(labPct * 10) / 10,
              exp: Math.round(expPct * 10) / 10, door: Math.round(doorPct * 10) / 10 },
    bbDeductPct: data.bbDeductPct,
    bucket: data.key,
    tier: data.tier,
    tierLabel: tierLabels[data.tier],
    dataCount: data.count,
    scaleFactor,
    scaleLabel: band.label,
    heightKey,
    range: {
      low: Math.round((totalEstimate - bbDeductAmount) * rangeMultLow),
      high: Math.round((totalEstimate - bbDeductAmount) * rangeMultHigh),
    },
    confidence,
  };
}

// ══════════════════════════════════════════
// 8조합 간편 매트릭스 (갑 결과 화면)
// 자산4종 × 계약2종 = 8셀 동시 산출
// ══════════════════════════════════════════
export function calcSimple8Matrix(
  panel: BucketPanel,
  height: number,
  totalLength: number,
  bbMonths: number,
  hasDoor: boolean,
) {
  const assets: BucketAsset[] = ['전체고재', '전체신재', '판넬만신재', '파이프만신재'];
  const contracts: BucketContract[] = ['BB', 'SELL'];

  const matrix: Record<string, Record<string, SimpleEstimateResult>> = {};

  for (const contract of contracts) {
    matrix[contract] = {};
    for (const asset of assets) {
      matrix[contract][asset] = calcSimpleEstimate({
        panel, asset, contract, height, totalLength, bbMonths, hasDoor,
      });
    }
  }

  return matrix;
}
