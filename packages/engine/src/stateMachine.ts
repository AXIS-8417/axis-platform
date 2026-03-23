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
// 확정본: 수락 / 거절(사유 입력) / 협의 요청(메모 기록) / 3일 무응답 → 자동 거절
export const DESIGN_CHANGE_STATUSES = [
  'WAITING',        // 대기 (갑이 변경 요청 후 을 응답 대기)
  'ACCEPTED',       // 수락 → 재견적 제출 (기존 이력 보존)
  'REJECTED',       // 거절 (을이 사유 입력 → 갑에게 전달)
  'NEGOTIATING',    // 협의 요청 (을이 메모 기록 → 갑/을 협의)
  'AUTO_REJECTED',  // 자동 거절 (3일 무응답 시 시스템 자동 처리)
  'EXPIRED',        // 만료 (견적 유효기간 경과)
] as const;

export type DesignChangeStatus = (typeof DESIGN_CHANGE_STATUSES)[number];

/** 72 hours (3일) in milliseconds — 3일 무응답 → 자동 거절 */
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
    return { shouldTransition: true, newStatus: 'AUTO_REJECTED' };
  }

  return { shouldTransition: false };
}

// ============================================================
// 게이트원장 상태머신
// 등록 → 을날인 → 병맞도장대기 → 병맞도장완료 → 대조 → 정산연동
// ============================================================
export const GATE_EVENT_STATUSES = [
  'REGISTERED',       // 등록
  'EUL_SEALED',       // 을 날인 완료 (SINGLE seal)
  'BYEONG_PENDING',   // 병 맞도장 대기
  'BYEONG_SEALED',    // 병 맞도장 완료 (MUTUAL seal)
  'RECONCILED',       // 대조 완료
  'MISMATCH',         // 불일치
  'SETTLED',          // 정산 연동
] as const;

export type GateEventStatus = (typeof GATE_EVENT_STATUSES)[number];

export const GATE_STATUS_LABEL: Record<string, string> = {
  REGISTERED: '등록',
  EUL_SEALED: '을 날인',
  BYEONG_PENDING: '병 맞도장 대기',
  BYEONG_SEALED: '병 맞도장',
  RECONCILED: '대조 완료',
  MISMATCH: '불일치',
  SETTLED: '정산 연동',
};

export interface GateTransitionRule {
  fromStatus: string;
  toStatus: string;
  triggerRole: string[];
  auto?: boolean;
  description: string;
}

export const GATE_TRANSITIONS: GateTransitionRule[] = [
  { fromStatus: 'REGISTERED', toStatus: 'EUL_SEALED', triggerRole: ['EUL'], auto: true, description: '을 이벤트 등록 시 자동 SINGLE seal' },
  { fromStatus: 'EUL_SEALED', toStatus: 'BYEONG_PENDING', triggerRole: ['EUL', 'SYSTEM'], auto: true, description: '병에게 맞도장 요청 자동 발송' },
  { fromStatus: 'BYEONG_PENDING', toStatus: 'BYEONG_SEALED', triggerRole: ['BYEONG'], description: '병이 맞도장 확인 (counterConfirm)' },
  { fromStatus: 'BYEONG_SEALED', toStatus: 'RECONCILED', triggerRole: ['EUL', 'SYSTEM'], auto: true, description: '수량 대조 자동 실행 (일치)' },
  { fromStatus: 'BYEONG_SEALED', toStatus: 'MISMATCH', triggerRole: ['EUL', 'SYSTEM'], auto: true, description: '수량 대조 자동 실행 (불일치)' },
  { fromStatus: 'RECONCILED', toStatus: 'SETTLED', triggerRole: ['EUL'], description: '정산(빌링) 연동' },
  { fromStatus: 'MISMATCH', toStatus: 'BYEONG_PENDING', triggerRole: ['EUL'], description: '불일치 시 재확인 요청' },
];

export function canGateTransition(
  currentStatus: string,
  targetStatus: string,
  role: string,
): TransitionResult {
  const rule = GATE_TRANSITIONS.find(t => t.fromStatus === currentStatus && t.toStatus === targetStatus);
  if (!rule) {
    return { allowed: false, reason: `게이트 전이 불가: ${GATE_STATUS_LABEL[currentStatus] ?? currentStatus} → ${GATE_STATUS_LABEL[targetStatus] ?? targetStatus}` };
  }
  if (!rule.triggerRole.includes(role) && !rule.triggerRole.includes('SYSTEM') && role !== 'ADMIN') {
    return { allowed: false, reason: `권한 부족: ${role}` };
  }
  return { allowed: true, nextStatus: targetStatus };
}

export function getGateNextStatuses(currentStatus: string): string[] {
  return GATE_TRANSITIONS
    .filter(t => t.fromStatus === currentStatus)
    .map(t => t.toStatus);
}

export function getGateFlow(): Array<{ status: string; label: string; description: string }> {
  return GATE_EVENT_STATUSES.map(s => ({
    status: s,
    label: GATE_STATUS_LABEL[s] ?? s,
    description: GATE_TRANSITIONS.find(t => t.toStatus === s)?.description ?? '',
  }));
}

// ============================================================
// 게이트 대조 엔진 (을/병 수량 비교)
// ============================================================
export interface GateEventData {
  eventId: string;
  gateId: string;
  eventType: string;
  quantity: number;
  unit: string;
}

export interface ReconciliationItem {
  eulEventId: string;
  byeongEventId: string | null;
  eulQty: number;
  byeongQty: number;
  diff: number;
  matchStatus: 'MATCH' | 'MISMATCH' | 'UNMATCHED';
}

export interface ReconciliationSummary {
  totalEul: number;
  totalByeong: number;
  matched: number;
  mismatched: number;
  unmatched: number;
  matchRate: number;
  items: ReconciliationItem[];
}

export function reconcileGateEvents(
  eulEvents: GateEventData[],
  byeongEvents: GateEventData[],
): ReconciliationSummary {
  const items: ReconciliationItem[] = [];
  const usedByeong = new Set<string>();

  for (const eul of eulEvents) {
    const match = byeongEvents.find(b =>
      b.gateId === eul.gateId &&
      b.eventType === eul.eventType &&
      !usedByeong.has(b.eventId)
    );

    if (match) {
      usedByeong.add(match.eventId);
      const diff = eul.quantity - match.quantity;
      items.push({
        eulEventId: eul.eventId,
        byeongEventId: match.eventId,
        eulQty: eul.quantity,
        byeongQty: match.quantity,
        diff,
        matchStatus: diff === 0 ? 'MATCH' : 'MISMATCH',
      });
    } else {
      items.push({
        eulEventId: eul.eventId,
        byeongEventId: null,
        eulQty: eul.quantity,
        byeongQty: 0,
        diff: eul.quantity,
        matchStatus: 'UNMATCHED',
      });
    }
  }

  const matched = items.filter(i => i.matchStatus === 'MATCH').length;
  const mismatched = items.filter(i => i.matchStatus === 'MISMATCH').length;
  const unmatched = items.filter(i => i.matchStatus === 'UNMATCHED').length;

  return {
    totalEul: eulEvents.length,
    totalByeong: byeongEvents.length,
    matched, mismatched, unmatched,
    matchRate: items.length > 0 ? Math.round(matched / items.length * 100) : 0,
    items,
  };
}

// ============================================================
// 정산 파이프라인 (빌링 상태 흐름)
// ============================================================
export const BILLING_STATUSES = [
  'CREATED',      // 청구생성
  'REVIEWING',    // 검토중
  'APPROVED',     // 승인
  'PAY_REQUESTED', // 결제요청
  'PAID',         // 결제완료
  'SETTLED',      // 정산완료
] as const;

export type BillingStatus = (typeof BILLING_STATUSES)[number];

export const BILLING_STATUS_LABEL: Record<string, string> = {
  CREATED: '청구생성',
  REVIEWING: '검토중',
  APPROVED: '승인',
  PAY_REQUESTED: '결제요청',
  PAID: '결제완료',
  SETTLED: '정산완료',
};

export const BILLING_TRANSITIONS: Array<{ from: string; to: string; role: string[] }> = [
  { from: 'CREATED', to: 'REVIEWING', role: ['GAP'] },
  { from: 'REVIEWING', to: 'APPROVED', role: ['GAP'] },
  { from: 'APPROVED', to: 'PAY_REQUESTED', role: ['GAP'] },
  { from: 'PAY_REQUESTED', to: 'PAID', role: ['SYSTEM', 'GAP'] },
  { from: 'PAID', to: 'SETTLED', role: ['EUL', 'SYSTEM'] },
];

export function canBillingTransition(
  current: string, target: string, role: string,
): TransitionResult {
  const rule = BILLING_TRANSITIONS.find(t => t.from === current && t.to === target);
  if (!rule) return { allowed: false, reason: `정산 전이 불가: ${current} → ${target}` };
  if (!rule.role.includes(role) && !rule.role.includes('SYSTEM') && role !== 'ADMIN') {
    return { allowed: false, reason: `권한 부족` };
  }
  return { allowed: true, nextStatus: target };
}

export function getBillingFlow(): Array<{ status: string; label: string; role: string }> {
  return [
    { status: 'CREATED', label: '을 청구 생성', role: 'EUL' },
    { status: 'REVIEWING', label: '갑 검토', role: 'GAP' },
    { status: 'APPROVED', label: '갑 승인', role: 'GAP' },
    { status: 'PAY_REQUESTED', label: 'PG 결제', role: 'GAP' },
    { status: 'PAID', label: '결제 확인', role: 'SYSTEM' },
    { status: 'SETTLED', label: '정산 봉인', role: 'EUL' },
  ];
}

// ============================================================
// Quote → Platform 브릿지 (견적 → 계약 → 작업지시 파이프라인)
// ============================================================
export interface QuoteToPlatformInput {
  estimateId: string;
  engineResult: {
    matTotal: number;
    labTotal: number;
    eqpTotal: number;
    transTotal: number;
    gateTotal: number;
    total: number;
    bbRefund: number;
  };
  selectedContractor?: {
    responseId: string;
    partyId: string;
    submittedPerM: number;
  };
  siteInfo: {
    siteName: string;
    address: string;
    panelType: string;
    heightM: number;
    lenM: number;
    spanM: number;
    foundationType: string;
  };
  contractTerms: {
    contractType: string; // SELL / BB
    bbMonths?: number;
    startDate: string;
    endDate: string;
  };
}

export interface QuoteToPlatformResult {
  contractData: {
    siteId: string;
    contractAmount: number;
    contractType: string;
    bbMonths: number;
    startDate: string;
    endDate: string;
    estimateId: string;
    responseId: string | null;
  };
  workOrderData: {
    siteId: string;
    panelType: string;
    frameType: string;
    spanM: number;
    foundationType: string;
    currentStatus: 'CREATED';
  };
  gateData: {
    siteId: string;
    gateName: string;
    gateType: string;
  } | null;
}

export function buildPlatformBridge(input: QuoteToPlatformInput): QuoteToPlatformResult {
  const siteId = `SITE_${Date.now()}`;
  const hasGate = input.engineResult.gateTotal > 0;

  return {
    contractData: {
      siteId,
      contractAmount: input.selectedContractor
        ? Math.round(input.selectedContractor.submittedPerM * input.siteInfo.lenM)
        : input.engineResult.total,
      contractType: input.contractTerms.contractType,
      bbMonths: input.contractTerms.bbMonths ?? 0,
      startDate: input.contractTerms.startDate,
      endDate: input.contractTerms.endDate,
      estimateId: input.estimateId,
      responseId: input.selectedContractor?.responseId ?? null,
    },
    workOrderData: {
      siteId,
      panelType: input.siteInfo.panelType,
      frameType: input.siteInfo.heightM >= 7 ? 'H빔식' : '비계식',
      spanM: input.siteInfo.spanM,
      foundationType: input.siteInfo.foundationType,
      currentStatus: 'CREATED',
    },
    gateData: hasGate ? {
      siteId,
      gateName: `${input.siteInfo.siteName} 정문`,
      gateType: 'MAIN',
    } : null,
  };
}
