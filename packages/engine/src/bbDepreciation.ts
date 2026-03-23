// AXIS BB감가 엔진 — 설계서 v4.8 §9.10 Table 35 이식
// BB잔존율 = MAX(바닥값, 초기율 - 월감가율 × n개월)
// 신재: 1~12개월 전기감가, 13개월+ 후기감가(속도 50% 감소)

// ══════════════════════════════════════════
// BB 파라미터 마스터 (Table 35)
// ══════════════════════════════════════════
export interface BBParam {
  name: string;
  used: { initial: number; monthly: number; floor: number };
  new_: { initial: number; earlyMonthly: number; lateMonthly: number };
}

export const BB_PARAMS: BBParam[] = [
  { name: '주주파이프',   used: { initial: 0.78, monthly: 0.016, floor: 0.15 }, new_: { initial: 0.69, earlyMonthly: 0.016, lateMonthly: 0.008 } },
  { name: '횡대파이프',   used: { initial: 0.75, monthly: 0.017, floor: 0.10 }, new_: { initial: 0.66, earlyMonthly: 0.017, lateMonthly: 0.0085 } },
  { name: '지주파이프',   used: { initial: 0.68, monthly: 0.019, floor: 0.05 }, new_: { initial: 0.59, earlyMonthly: 0.019, lateMonthly: 0.0095 } },
  { name: 'RPP방음판',    used: { initial: 0.68, monthly: 0.019, floor: 0.04 }, new_: { initial: 0.43, earlyMonthly: 0.019, lateMonthly: 0.0095 } },
  { name: 'EGI휀스',      used: { initial: 0.72, monthly: 0.020, floor: 0.05 }, new_: { initial: 0.47, earlyMonthly: 0.020, lateMonthly: 0.010 } },
  { name: '스틸방음판',   used: { initial: 0.60, monthly: 0.019, floor: 0.04 }, new_: { initial: 0.35, earlyMonthly: 0.019, lateMonthly: 0.0095 } },
  { name: '고정클램프',   used: { initial: 0.55, monthly: 0.020, floor: 0.00 }, new_: { initial: 0.46, earlyMonthly: 0.020, lateMonthly: 0.010 } },
  { name: '연결핀',       used: { initial: 0.45, monthly: 0.022, floor: 0.00 }, new_: { initial: 0.36, earlyMonthly: 0.022, lateMonthly: 0.011 } },
  { name: '분진망',       used: { initial: 0, monthly: 0, floor: 0 },           new_: { initial: 0, earlyMonthly: 0, lateMonthly: 0 } },
  { name: '기초파이프',   used: { initial: 0, monthly: 0, floor: 0 },           new_: { initial: 0, earlyMonthly: 0, lateMonthly: 0 } },
];

// 이름 매핑 (다양한 표기 대응)
const NAME_MAP: Record<string, string> = {
  '주주': '주주파이프', '횡대': '횡대파이프', '지주': '지주파이프',
  '기초': '기초파이프', '고정': '고정클램프', '자동': '고정클램프',
  '연결': '연결핀', '분진': '분진망', 'EGI': 'EGI휀스',
  'RPP': 'RPP방음판', '스틸': '스틸방음판', '양개도어': 'EGI휀스',
  '홀딩도어': 'EGI휀스',
};

function findParam(itemName: string): BBParam | undefined {
  const exact = BB_PARAMS.find(p => p.name === itemName);
  if (exact) return exact;
  for (const [key, mapped] of Object.entries(NAME_MAP)) {
    if (itemName.includes(key)) return BB_PARAMS.find(p => p.name === mapped);
  }
  return undefined;
}

// ══════════════════════════════════════════
// BB 잔존율 계산
// ══════════════════════════════════════════
export function calcBBResidualRate(
  itemName: string,
  grade: '고재' | '신재',
  months: number,
): number {
  const param = findParam(itemName);
  if (!param) return 1; // 파라미터 없으면 차감 없음

  if (grade === '고재') {
    const { initial, monthly, floor } = param.used;
    if (initial === 0) return 1; // 소모품
    return Math.max(floor, initial - monthly * months);
  }

  // 신재: 전기(1~12) + 후기(13+)
  const { initial, earlyMonthly, lateMonthly } = param.new_;
  if (initial === 0) return 1;

  if (months <= 12) {
    return Math.max(0, initial - earlyMonthly * months);
  }
  const after12 = initial - earlyMonthly * 12;
  return Math.max(0, after12 - lateMonthly * (months - 12));
}

// ══════════════════════════════════════════
// BB 차감율 계산 (1 - 잔존율)
// ══════════════════════════════════════════
export function calcBBDeductRateV2(
  itemName: string,
  grade: '고재' | '신재',
  months: number,
): number {
  return 1 - calcBBResidualRate(itemName, grade, months);
}

// ══════════════════════════════════════════
// 품목별 BB 차감 일괄 계산
// ══════════════════════════════════════════
export interface BBItem {
  name: string;
  grade: '고재' | '신재';
  acquisitionCost: number; // 취득가
}

export interface BBResult {
  items: Array<{
    name: string;
    grade: string;
    acquisitionCost: number;
    residualRate: number;
    deductRate: number;
    deductAmount: number;
  }>;
  totalDeduct: number;
  totalAcquisition: number;
  avgDeductRate: number;
}

export function calcBBDeduction(items: BBItem[], months: number): BBResult {
  const results = items.map(it => {
    const residualRate = calcBBResidualRate(it.name, it.grade, months);
    const deductRate = 1 - residualRate;
    const deductAmount = Math.round(it.acquisitionCost * deductRate);
    return {
      name: it.name, grade: it.grade,
      acquisitionCost: it.acquisitionCost,
      residualRate: Math.round(residualRate * 1000) / 1000,
      deductRate: Math.round(deductRate * 1000) / 1000,
      deductAmount,
    };
  });

  const totalDeduct = results.reduce((s, r) => s + r.deductAmount, 0);
  const totalAcquisition = results.reduce((s, r) => s + r.acquisitionCost, 0);

  return {
    items: results,
    totalDeduct,
    totalAcquisition,
    avgDeductRate: totalAcquisition > 0 ? Math.round(totalDeduct / totalAcquisition * 1000) / 1000 : 0,
  };
}

// ══════════════════════════════════════════
// 월임대료 계산 (§9.11)
// 기한후 월임대료 = 취득가 × 월대여료율
// ══════════════════════════════════════════
const MONTHLY_RENTAL_RATES: Record<string, number> = {
  '주주파이프': 0.016, '횡대파이프': 0.017, '지주파이프': 0.019,
  '고정클램프': 0.020, '자동클램프': 0.020, '연결핀': 0.022,
  'EGI휀스': 0.020, 'RPP방음판': 0.019, '스틸방음판': 0.019,
  '분진망': 0, '기초파이프': 0,
};

export interface MonthlyRentalResult {
  items: Array<{ name: string; acquisitionCost: number; rate: number; monthly: number }>;
  totalMonthly: number;
  totalDaily: number;
  comment: string;
}

export function calcMonthlyRental(items: BBItem[]): MonthlyRentalResult {
  const results = items.map(it => {
    let rate = MONTHLY_RENTAL_RATES[it.name] ?? 0;
    if (rate === 0) {
      for (const [key, mapped] of Object.entries(NAME_MAP)) {
        if (it.name.includes(key)) {
          rate = MONTHLY_RENTAL_RATES[mapped] ?? 0;
          break;
        }
      }
    }
    return {
      name: it.name,
      acquisitionCost: it.acquisitionCost,
      rate,
      monthly: Math.round(it.acquisitionCost * rate),
    };
  });

  const totalMonthly = results.reduce((s, r) => s + r.monthly, 0);
  const totalDaily = Math.round(totalMonthly / 30);
  const monthlyMan = Math.round(totalMonthly / 10000);
  const comment = `BB 기한 초과 시 월 약 ${monthlyMan}만원 (일 약 ${totalDaily.toLocaleString()}원) 임대료 발생`;

  return { items: results, totalMonthly, totalDaily, comment };
}
