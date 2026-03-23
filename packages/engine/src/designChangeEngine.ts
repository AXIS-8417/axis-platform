// AXIS 설계변경 엔진 — 마스터 v2.9 시트 20
// 응답기한: 요청일+3일, 미응답시 자동확정

export type DesignChangeStatus = '대기' | '수락' | '미수락' | '무응답자동확정';

export const RESPONSE_DEADLINE_DAYS = 3;

export interface DesignChangeInput {
  requestDate: string;
  changeField: string;
  beforeValue: string;
  afterValue: string;
  monthlyConvertReq?: boolean;
}

export interface DesignChangeResult {
  responseDeadline: string;
  currentStatus: DesignChangeStatus;
  isOverdue: boolean;
  daysRemaining: number;
}

export function calcDesignChangeStatus(
  requestDate: string,
  responseDate: string | null,
  accepted: boolean | null,
  now: string,
): DesignChangeResult {
  const reqDate = new Date(requestDate);
  const deadline = new Date(reqDate);
  deadline.setDate(deadline.getDate() + RESPONSE_DEADLINE_DAYS);

  const nowDate = new Date(now);
  const daysRemaining = Math.ceil((deadline.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = nowDate > deadline;

  let currentStatus: DesignChangeStatus;
  if (responseDate && accepted === true) currentStatus = '수락';
  else if (responseDate && accepted === false) currentStatus = '미수락';
  else if (isOverdue) currentStatus = '무응답자동확정';
  else currentStatus = '대기';

  return { responseDeadline: deadline.toISOString().split('T')[0], currentStatus, isOverdue, daysRemaining: Math.max(0, daysRemaining) };
}

export function findOverdueChanges(
  changes: Array<{ id: string; requestDate: string; respondedAt: string | null; accepted: boolean | null }>,
  now: string,
): string[] {
  return changes
    .filter(c => calcDesignChangeStatus(c.requestDate, c.respondedAt, c.accepted, now).currentStatus === '무응답자동확정')
    .map(c => c.id);
}
