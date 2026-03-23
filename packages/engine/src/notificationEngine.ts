// AXIS 알림 발송 엔진 — HWP 확정명세서 v1.0 §11
// 카카오 알림톡 + 앱 푸시 기준

// ══════════════════════════════════════════
// 알림 타입 정의
// ══════════════════════════════════════════
export type NotifyTarget = 'GAP' | 'EUL';

export interface NotificationRule {
  id: string;
  target: NotifyTarget;
  trigger: string;
  message: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  autoSend: boolean;
}

// ══════════════════════════════════════════
// §11 알림 발송 기준 — 갑에게
// ══════════════════════════════════════════
export const GAP_NOTIFICATIONS: NotificationRule[] = [
  {
    id: 'GAP_EUL_CONFIRMED',
    target: 'GAP',
    trigger: '을 선택 확정 즉시',
    message: '을(시공사) 선택이 확정되었습니다. 설치예정일을 30일 이내에 입력해 주세요.',
    urgency: 'HIGH',
    autoSend: true,
  },
  {
    id: 'GAP_INSTALL_DATE_D5',
    target: 'GAP',
    trigger: '설치예정일 30일 경과 임박 (D-5)',
    message: '설치예정일 입력 기한이 5일 남았습니다. 미입력 시 을이 대기를 종료할 수 있습니다.',
    urgency: 'HIGH',
    autoSend: true,
  },
  {
    id: 'GAP_EUL_7DAY_WARN',
    target: 'GAP',
    trigger: '을 7일 무응답 경고',
    message: '을(시공사)이 7일간 진행상황을 업데이트하지 않았습니다.',
    urgency: 'MEDIUM',
    autoSend: true,
  },
  {
    id: 'GAP_EUL_ABANDON',
    target: 'GAP',
    trigger: '을 포기 신청',
    message: '을(시공사)이 대기 포기를 신청했습니다. 다른 업체 재견적이 가능합니다.',
    urgency: 'HIGH',
    autoSend: true,
  },
  {
    id: 'GAP_CHANGE_RESPONSE',
    target: 'GAP',
    trigger: '견적변경 거절/수락',
    message: '을(시공사)이 견적변경 요청에 응답했습니다.',
    urgency: 'MEDIUM',
    autoSend: true,
  },
  {
    id: 'GAP_COMPLETION',
    target: 'GAP',
    trigger: '완료 보고',
    message: '을(시공사)이 설치 완료 보고를 제출했습니다. 확인 후 봉인해 주세요.',
    urgency: 'HIGH',
    autoSend: true,
  },
];

// ══════════════════════════════════════════
// §11 알림 발송 기준 — 을에게
// ══════════════════════════════════════════
export const EUL_NOTIFICATIONS: NotificationRule[] = [
  {
    id: 'EUL_CONFIRMED',
    target: 'EUL',
    trigger: '선택 확정 즉시',
    message: '갑(발주처)이 귀사를 선택했습니다. 계약이 확정되었습니다.',
    urgency: 'HIGH',
    autoSend: true,
  },
  {
    id: 'EUL_INSTALL_DATE_SET',
    target: 'EUL',
    trigger: '갑 설치예정일 확정',
    message: '갑(발주처)이 설치예정일을 입력했습니다. 확인해 주세요.',
    urgency: 'HIGH',
    autoSend: true,
  },
  {
    id: 'EUL_GAP_20DAY_NODATE',
    target: 'EUL',
    trigger: '갑 미입력 20일 경과',
    message: '갑(발주처)이 설치예정일을 20일간 입력하지 않았습니다. 대기를 유지하거나 포기를 신청할 수 있습니다.',
    urgency: 'HIGH',
    autoSend: true,
  },
  {
    id: 'EUL_7DAY_WARN',
    target: 'EUL',
    trigger: '7일 무응답 경고',
    message: '7일간 진행상황 업데이트가 없습니다. 사유를 등록하지 않으면 자동취소됩니다.',
    urgency: 'HIGH',
    autoSend: true,
  },
  {
    id: 'EUL_CHANGE_REQUEST',
    target: 'EUL',
    trigger: '견적변경 요청 수신',
    message: '갑(발주처)이 견적변경을 요청했습니다. 3일 이내에 응답해 주세요.',
    urgency: 'HIGH',
    autoSend: true,
  },
  {
    id: 'EUL_CHANGE_AUTO_REJECT',
    target: 'EUL',
    trigger: '3일 무응답 자동거절',
    message: '견적변경 요청에 3일 내 응답하지 않아 자동 거절 처리되었습니다.',
    urgency: 'MEDIUM',
    autoSend: true,
  },
];

export const ALL_NOTIFICATIONS = [...GAP_NOTIFICATIONS, ...EUL_NOTIFICATIONS];

// ══════════════════════════════════════════
// 알림 발송 판정 엔진
// ══════════════════════════════════════════
export interface ContractState {
  confirmedAt: Date;
  installDateEnteredAt: Date | null;
  installDate: Date | null;
  lastGapUpdateAt: Date | null;
  lastEulUpdateAt: Date | null;
  extensionCount: number;
  status: string; // 진행/경고/위험/취소/완료
  pendingDesignChangeAt: Date | null;
}

export interface PendingNotification {
  ruleId: string;
  target: NotifyTarget;
  message: string;
  urgency: string;
  daysOverdue?: number;
}

export function checkPendingNotifications(
  state: ContractState,
  now: Date = new Date(),
): PendingNotification[] {
  const pending: PendingNotification[] = [];
  const daysSinceConfirm = Math.floor((now.getTime() - state.confirmedAt.getTime()) / 86400000);

  // 갑: 설치예정일 D-5 경고
  if (!state.installDateEnteredAt && daysSinceConfirm >= 25) {
    pending.push({
      ruleId: 'GAP_INSTALL_DATE_D5',
      target: 'GAP',
      message: GAP_NOTIFICATIONS.find(n => n.id === 'GAP_INSTALL_DATE_D5')!.message,
      urgency: 'HIGH',
      daysOverdue: daysSinceConfirm - 25,
    });
  }

  // 을: 갑 미입력 20일
  if (!state.installDateEnteredAt && daysSinceConfirm >= 20) {
    pending.push({
      ruleId: 'EUL_GAP_20DAY_NODATE',
      target: 'EUL',
      message: EUL_NOTIFICATIONS.find(n => n.id === 'EUL_GAP_20DAY_NODATE')!.message,
      urgency: 'HIGH',
      daysOverdue: daysSinceConfirm - 20,
    });
  }

  // 을 7일 무응답
  if (state.lastEulUpdateAt) {
    const eulDays = Math.floor((now.getTime() - state.lastEulUpdateAt.getTime()) / 86400000);
    if (eulDays >= 7) {
      pending.push({
        ruleId: 'EUL_7DAY_WARN',
        target: 'EUL',
        message: EUL_NOTIFICATIONS.find(n => n.id === 'EUL_7DAY_WARN')!.message,
        urgency: 'HIGH',
        daysOverdue: eulDays - 7,
      });
      pending.push({
        ruleId: 'GAP_EUL_7DAY_WARN',
        target: 'GAP',
        message: GAP_NOTIFICATIONS.find(n => n.id === 'GAP_EUL_7DAY_WARN')!.message,
        urgency: 'MEDIUM',
        daysOverdue: eulDays - 7,
      });
    }
  }

  // 견적변경 3일 무응답
  if (state.pendingDesignChangeAt) {
    const changeDays = Math.floor((now.getTime() - state.pendingDesignChangeAt.getTime()) / 86400000);
    if (changeDays >= 3) {
      pending.push({
        ruleId: 'EUL_CHANGE_AUTO_REJECT',
        target: 'EUL',
        message: EUL_NOTIFICATIONS.find(n => n.id === 'EUL_CHANGE_AUTO_REJECT')!.message,
        urgency: 'MEDIUM',
      });
    }
  }

  return pending;
}

// ══════════════════════════════════════════
// 대시보드 상태 색상 판정 (§10.4)
// ══════════════════════════════════════════
export type DashboardColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

export function getDashboardColor(state: ContractState, now: Date = new Date()): { color: DashboardColor; label: string; hex: string } {
  if (state.status === '취소') return { color: 'gray', label: '취소 완료', hex: '#64748B' };
  if (state.status === '완료') return { color: 'blue', label: '완료 봉인', hex: '#3B82F6' };

  // Check last update from either side
  const lastUpdate = [state.lastGapUpdateAt, state.lastEulUpdateAt]
    .filter(Boolean)
    .sort((a, b) => b!.getTime() - a!.getTime())[0];

  if (lastUpdate) {
    const days = Math.floor((now.getTime() - lastUpdate.getTime()) / 86400000);
    if (days >= 10) return { color: 'red', label: '10일+ 무응답', hex: '#EF4444' };
    if (days >= 7) return { color: 'yellow', label: '7일 무응답', hex: '#EAB308' };
  }

  return { color: 'green', label: '정상 진행', hex: '#22C55E' };
}
