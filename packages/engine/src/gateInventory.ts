// AXIS 게이트 잔량집계 — Gate CANON v6 G09
// Event-sourced: 잔량 = (이동 + 직송 + 회수) - (설치 + 불량전환)

export interface GateEvent {
  eventId: string;
  gateId: string;
  siteId: string;
  eventType: string;
  quantity: number;
  eventDate: string;
  eventPartyId: string;
  holdPartyId: string;
}

export interface GateBalance {
  gateId: string;
  referenceDate: string;
  inTotal: number;
  installTotal: number;
  retrieveTotal: number;
  defectTotal: number;
  balance: number;
  warning: string;
}

export function calcGateBalance(
  gateId: string,
  events: GateEvent[],
  referenceDate: string,
): GateBalance {
  const refDate = new Date(referenceDate);
  const filtered = events.filter(e =>
    e.gateId === gateId && new Date(e.eventDate) <= refDate
  );

  let inTotal = 0, installTotal = 0, retrieveTotal = 0, defectTotal = 0;
  for (const e of filtered) {
    switch (e.eventType) {
      case '이동': case '직송': inTotal += e.quantity; break;
      case '설치': installTotal += e.quantity; break;
      case '회수': retrieveTotal += e.quantity; break;
      case '폐기': defectTotal += e.quantity; break;
    }
  }

  const balance = (inTotal + retrieveTotal) - (installTotal + defectTotal);
  return {
    gateId, referenceDate, inTotal, installTotal, retrieveTotal, defectTotal, balance,
    warning: balance < 0 ? '⚠️음수-확인필요' : '',
  };
}

export function calcAllGateBalances(events: GateEvent[], referenceDate: string): GateBalance[] {
  const gateIds = [...new Set(events.map(e => e.gateId))];
  return gateIds.map(id => calcGateBalance(id, events, referenceDate));
}

export interface ReconResult {
  gateId: string;
  siteId: string;
  eventType: string;
  eulQtySum: number;
  byeongQtySum: number;
  matchStatus: '상호기록일치' | '확인필요';
}

export function reconcileGateRecords(
  eulEvents: GateEvent[],
  byeongEvents: GateEvent[],
): ReconResult[] {
  const keyMap = new Map<string, { eul: number; byeong: number }>();

  for (const e of eulEvents) {
    const key = `${e.gateId}|${e.siteId}|${e.eventType}`;
    const cur = keyMap.get(key) || { eul: 0, byeong: 0 };
    cur.eul += e.quantity;
    keyMap.set(key, cur);
  }
  for (const e of byeongEvents) {
    const key = `${e.gateId}|${e.siteId}|${e.eventType}`;
    const cur = keyMap.get(key) || { eul: 0, byeong: 0 };
    cur.byeong += e.quantity;
    keyMap.set(key, cur);
  }

  const results: ReconResult[] = [];
  for (const [key, val] of keyMap) {
    const [gateId, siteId, eventType] = key.split('|');
    results.push({
      gateId, siteId, eventType,
      eulQtySum: val.eul, byeongQtySum: val.byeong,
      matchStatus: val.eul === val.byeong ? '상호기록일치' : '확인필요',
    });
  }
  return results;
}
