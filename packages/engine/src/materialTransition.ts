// AXIS 자재상태전이 엔진 — 마스터 v2.9 시트 34

export type MaterialStatus =
  'IN_STOCK' | 'DISPATCHED' | 'ON_SITE' | 'INSTALLED' |
  'REMOVED' | 'PARTIALLY_REMOVED' | 'IN_TRANSIT' | 'RETURNED' | 'DISCARDED';

export type MaterialEventType =
  'DISPATCH' | 'INSTALL' | 'DISMANTLE' | 'PARTIAL_DISMANTLE' | 'RETURN' | 'DISCARD';

const MATERIAL_TRANSITIONS: Record<string, { from: MaterialStatus; to: MaterialStatus }> = {
  'DISPATCH':          { from: 'IN_STOCK',  to: 'DISPATCHED' },
  'INSTALL':           { from: 'ON_SITE',   to: 'INSTALLED' },
  'DISMANTLE':         { from: 'INSTALLED',  to: 'REMOVED' },
  'PARTIAL_DISMANTLE': { from: 'INSTALLED',  to: 'PARTIALLY_REMOVED' },
  'RETURN':            { from: 'IN_TRANSIT', to: 'RETURNED' },
  'DISCARD':           { from: 'REMOVED',    to: 'DISCARDED' },
};

export function canMaterialTransition(current: MaterialStatus, eventType: MaterialEventType): boolean {
  const rule = MATERIAL_TRANSITIONS[eventType];
  return !!rule && rule.from === current;
}

export function getMaterialNextStatus(current: MaterialStatus, eventType: MaterialEventType): MaterialStatus | null {
  const rule = MATERIAL_TRANSITIONS[eventType];
  if (!rule || rule.from !== current) return null;
  return rule.to;
}

export function getAllowedEvents(current: MaterialStatus): MaterialEventType[] {
  return (Object.entries(MATERIAL_TRANSITIONS) as [MaterialEventType, { from: MaterialStatus; to: MaterialStatus }][])
    .filter(([, rule]) => rule.from === current)
    .map(([evt]) => evt);
}

export interface MaterialBalance {
  materialId: string;
  siteId: string;
  contractQty: number;
  dispatchQty: number;
  installQty: number;
  returnQty: number;
  discardQty: number;
  onSiteBalance: number;
  matchStatus: 'MATCH' | 'MINOR_DIFF' | 'MAJOR_DIFF';
}

export function calcMaterialBalance(
  materialId: string, siteId: string, contractQty: number,
  events: Array<{ eventType: MaterialEventType; quantity: number }>,
): MaterialBalance {
  let dispatchQty = 0, installQty = 0, returnQty = 0, discardQty = 0;
  for (const e of events) {
    switch (e.eventType) {
      case 'DISPATCH': dispatchQty += e.quantity; break;
      case 'INSTALL': installQty += e.quantity; break;
      case 'RETURN': returnQty += e.quantity; break;
      case 'DISCARD': discardQty += e.quantity; break;
    }
  }
  const onSiteBalance = dispatchQty - installQty - returnQty - discardQty;
  const diff = Math.abs(contractQty - dispatchQty);
  const diffPct = contractQty > 0 ? diff / contractQty : 0;
  const matchStatus = diffPct <= 0.02 ? 'MATCH' : diffPct <= 0.10 ? 'MINOR_DIFF' : 'MAJOR_DIFF';

  return { materialId, siteId, contractQty, dispatchQty, installQty, returnQty, discardQty, onSiteBalance, matchStatus };
}
