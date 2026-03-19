// ============================================================
// AXIS Platform - Work Order State Machine Engine
// ============================================================

export interface TransitionContext {
  role: string;
  tbmCompleted?: boolean;
  educationStatus?: string;
}

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
  nextStatus?: string;
}

export interface TransitionRule {
  fromStatus: string;
  toStatus: string;
  triggerRole: string[];
  gate?: (ctx: TransitionContext) => { pass: boolean; reason?: string };
}

// Work order statuses in order
export const WORK_ORDER_STATUSES = [
  'CREATED',     // 지시생성
  'CALLING',     // 호출중
  'MATCHED',     // 매칭완료
  'STANDBY',     // 작업대기
  'WORKING',     // 작업중
  'WORK_DONE',   // 작업완료
  'REPORT_DONE', // 일보입력완료
  'SETTLE_WAIT', // 정산대기
  'SETTLE_DONE', // 정산완료
  'SEALED',      // 봉인완료
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  CREATED: '지시생성',
  CALLING: '호출중',
  MATCHED: '매칭완료',
  STANDBY: '작업대기',
  WORKING: '작업중',
  WORK_DONE: '작업완료',
  REPORT_DONE: '일보입력완료',
  SETTLE_WAIT: '정산대기',
  SETTLE_DONE: '정산완료',
  SEALED: '봉인완료',
};

// Design change statuses with 72h auto-transition
export const DESIGN_CHANGE_STATUSES = [
  'WAITING',      // 대기
  'ACCEPTED',     // 수락
  'DISAGREEMENT', // 이의제기
  'EXPIRED',      // 만료
] as const;

export type DesignChangeStatus = (typeof DESIGN_CHANGE_STATUSES)[number];

/** 72 hours in milliseconds */
export const DESIGN_CHANGE_AUTO_TRANSITION_MS = 72 * 60 * 60 * 1000;

// ---- Transition rules ----

export const TRANSITIONS: TransitionRule[] = [
  {
    fromStatus: 'CREATED',
    toStatus: 'CALLING',
    triggerRole: ['GAP', 'EUL'],
  },
  {
    fromStatus: 'CALLING',
    toStatus: 'MATCHED',
    triggerRole: ['SYSTEM', 'BYEONG'],
  },
  {
    fromStatus: 'MATCHED',
    toStatus: 'STANDBY',
    triggerRole: ['EUL', 'BYEONG'],
  },
  {
    fromStatus: 'STANDBY',
    toStatus: 'WORKING',
    triggerRole: ['BYEONG'],
    gate: (ctx: TransitionContext) => {
      if (!ctx.tbmCompleted) {
        return { pass: false, reason: 'TBM(Tool Box Meeting) 완료 후 작업 시작이 가능합니다.' };
      }
      if (ctx.educationStatus !== '충족') {
        return { pass: false, reason: '안전교육 이수가 완료되지 않았습니다. 교육 이수 후 작업을 시작하세요.' };
      }
      return { pass: true };
    },
  },
  {
    fromStatus: 'WORKING',
    toStatus: 'WORK_DONE',
    triggerRole: ['BYEONG'],
  },
  {
    fromStatus: 'WORK_DONE',
    toStatus: 'REPORT_DONE',
    triggerRole: ['BYEONG', 'EUL'],
  },
  {
    fromStatus: 'REPORT_DONE',
    toStatus: 'SETTLE_WAIT',
    triggerRole: ['SYSTEM', 'EUL'],
  },
  {
    fromStatus: 'SETTLE_WAIT',
    toStatus: 'SETTLE_DONE',
    triggerRole: ['GAP', 'EUL'],
  },
  {
    fromStatus: 'SETTLE_DONE',
    toStatus: 'SEALED',
    triggerRole: ['SYSTEM', 'GAP', 'EUL'],
  },
];

/**
 * Check whether a transition from currentStatus to targetStatus is allowed.
 */
export function canTransition(
  currentStatus: string,
  targetStatus: string,
  context: TransitionContext,
): TransitionResult {
  const rule = TRANSITIONS.find(
    (t) => t.fromStatus === currentStatus && t.toStatus === targetStatus,
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `'${STATUS_LABEL[currentStatus] ?? currentStatus}' 에서 '${STATUS_LABEL[targetStatus] ?? targetStatus}' 로의 전환은 정의되지 않았습니다.`,
    };
  }

  // Role check
  if (!rule.triggerRole.includes(context.role) && !rule.triggerRole.includes('SYSTEM')) {
    return {
      allowed: false,
      reason: `역할 '${context.role}' 은(는) 이 전환을 수행할 권한이 없습니다. 허용 역할: ${rule.triggerRole.join(', ')}`,
    };
  }

  // Gate check
  if (rule.gate) {
    const gateResult = rule.gate(context);
    if (!gateResult.pass) {
      return {
        allowed: false,
        reason: gateResult.reason,
      };
    }
  }

  return {
    allowed: true,
    nextStatus: targetStatus,
  };
}

/**
 * Return all possible next statuses reachable from the current status.
 */
export function getNextStatuses(currentStatus: string): string[] {
  return TRANSITIONS
    .filter((t) => t.fromStatus === currentStatus)
    .map((t) => t.toStatus);
}

// ---- Design change 72h auto-transition ----

/**
 * Determines whether a design change in WAITING status should auto-transition
 * to DISAGREEMENT based on the elapsed time.
 */
export function checkDesignChangeAutoTransition(
  status: string,
  createdAt: Date,
  now: Date = new Date(),
): { shouldTransition: boolean; newStatus?: string } {
  if (status !== 'WAITING') {
    return { shouldTransition: false };
  }

  const elapsed = now.getTime() - createdAt.getTime();
  if (elapsed >= DESIGN_CHANGE_AUTO_TRANSITION_MS) {
    return { shouldTransition: true, newStatus: 'DISAGREEMENT' };
  }

  return { shouldTransition: false };
}
