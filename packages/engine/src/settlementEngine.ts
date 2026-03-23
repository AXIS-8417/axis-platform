// AXIS 정산엔진 — 마스터 v2.9 시트 37-40, 46
// STANDARD vs AXIS 정산모드, 묶음(Bundle) 처리

export type SettlementMode = 'STANDARD' | 'AXIS';
export type BundlePeriodType = 'MONTH' | 'PROJECT' | 'CUSTOM';

export const SETTLEMENT_POLICY = {
  mgmtFeePct: 0.15,
  rebatePct: 0.05,
  burdenPct: 0.10,
} as const;

export interface SettlementItem {
  workId: string;
  siteId: string;
  eulPartyId: string;
  byeongPartyId: string;
  baseAmount: number;
  mode: SettlementMode;
}

export interface SettlementCalcResult {
  workId: string;
  baseAmount: number;
  mode: SettlementMode;
  mgmtFee: number;
  rebate: number;
  netBurden: number;
  eulPayout: number;
  byeongPayout: number;
  platformFee: number;
}

export function calcSettlement(item: SettlementItem): SettlementCalcResult {
  const { baseAmount, mode } = item;
  if (mode === 'STANDARD') {
    return { workId: item.workId, baseAmount, mode, mgmtFee: 0, rebate: 0, netBurden: 0, eulPayout: baseAmount, byeongPayout: 0, platformFee: 0 };
  }
  const mgmtFee = Math.round(baseAmount * SETTLEMENT_POLICY.mgmtFeePct);
  const rebate = Math.round(baseAmount * SETTLEMENT_POLICY.rebatePct);
  const netBurden = Math.round(baseAmount * SETTLEMENT_POLICY.burdenPct);
  return { workId: item.workId, baseAmount, mode, mgmtFee, rebate, netBurden, eulPayout: baseAmount - netBurden, byeongPayout: baseAmount, platformFee: netBurden };
}

export interface BundleInput {
  partyId: string;
  periodType: BundlePeriodType;
  periodStart: string;
  periodEnd: string;
  mode: SettlementMode;
  items: SettlementItem[];
}

export interface BundleResult {
  partyId: string;
  periodType: BundlePeriodType;
  itemCount: number;
  totalBase: number;
  totalMgmtFee: number;
  totalRebate: number;
  totalPlatformFee: number;
  totalPayout: number;
  items: SettlementCalcResult[];
}

export function calcSettlementBundle(input: BundleInput): BundleResult {
  const items = input.items.map(calcSettlement);
  return {
    partyId: input.partyId, periodType: input.periodType,
    itemCount: items.length,
    totalBase: items.reduce((s, i) => s + i.baseAmount, 0),
    totalMgmtFee: items.reduce((s, i) => s + i.mgmtFee, 0),
    totalRebate: items.reduce((s, i) => s + i.rebate, 0),
    totalPlatformFee: items.reduce((s, i) => s + i.platformFee, 0),
    totalPayout: items.reduce((s, i) => s + i.eulPayout, 0),
    items,
  };
}
