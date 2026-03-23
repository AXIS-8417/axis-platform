// AXIS 을(시공사) 평판 점수 엔진 — 확정본 v1.0
// 총 100점 · 90일 롤링 평균
// 갑 귀책 제외 기준 포함

// ══════════════════════════════════════════
// 평판 구성 (4개 항목)
// ══════════════════════════════════════════
export const REPUTATION_WEIGHTS = {
  responseRate: 25,       // 응답률 — 견적요청 응답 속도
  deliveryRate: 30,       // 납기준수율 — 설치예정일 준수
  reliabilityRate: 25,    // 이행신뢰도 — 연장/취소 이력
  recordRate: 20,         // 기록충실도 — 진행상황 입력 빈도
} as const;

export const REPUTATION_TOTAL = 100;
export const ROLLING_DAYS = 90;

// ══════════════════════════════════════════
// 갑 귀책 제외 기준
// ══════════════════════════════════════════
export type ExclusionReason =
  | 'GAP_CANCEL'           // 갑 귀책 취소 → 을 평판 영향 없음
  | 'GAP_CHANGE_REJECT'    // 갑 견적변경 요청 거절 → 을 평판 영향 없음
  | 'GAP_EXTENSION'        // 갑 연장 신청 건 → 을 평판 영향 없음
  | 'FORCE_MAJEURE';       // 불가항력 사유 등록 → 유예 (3건 반복 시 재검토)

export function isExcluded(reason: ExclusionReason, repeatCount?: number): boolean {
  if (reason === 'FORCE_MAJEURE') {
    return (repeatCount ?? 0) < 3; // 3건 미만까지 유예
  }
  return true; // 나머지는 무조건 제외
}

// ══════════════════════════════════════════
// 을 귀책 감점 규칙
// ══════════════════════════════════════════
export interface PenaltyEvent {
  type: 'NO_RESPONSE_7D'         // 7일 무응답 자동취소 → 경고 1회
    | 'LATE_DELIVERY'            // 설치예정일 미준수 (을 귀책) → 납기준수율 하락
    | 'EXTENSION_3PLUS';         // 3회 이상 연장 신청 (을 요청) → 이행신뢰도 하락
  severity: number;              // 감점 점수
}

export const PENALTY_TABLE: Record<PenaltyEvent['type'], { target: keyof typeof REPUTATION_WEIGHTS; penalty: number }> = {
  NO_RESPONSE_7D:  { target: 'responseRate',    penalty: 5 },
  LATE_DELIVERY:   { target: 'deliveryRate',     penalty: 8 },
  EXTENSION_3PLUS: { target: 'reliabilityRate',  penalty: 6 },
};

// ══════════════════════════════════════════
// 입력/출력 타입
// ══════════════════════════════════════════
export interface ReputationInput {
  // 90일 내 데이터
  totalRequests: number;          // 총 견적요청 수신 건수
  respondedRequests: number;      // 응답한 건수
  avgResponseHours: number;       // 평균 응답 시간 (시간)

  totalDeliveries: number;        // 총 납품 건수
  onTimeDeliveries: number;       // 정시 납품 건수

  totalContracts: number;         // 총 계약 건수
  extensionsByEul: number;        // 을 요청 연장 횟수
  cancelsByEul: number;           // 을 귀책 취소 횟수

  progressUpdates: number;        // 진행상황 입력 횟수
  expectedUpdates: number;        // 기대 입력 횟수 (7일마다 1회 기준)

  penalties: PenaltyEvent['type'][]; // 감점 이벤트 목록
  exclusions: ExclusionReason[];     // 갑 귀책 제외 이벤트
}

export interface ReputationResult {
  responseScore: number;        // 0~25
  deliveryScore: number;        // 0~30
  reliabilityScore: number;     // 0~25
  recordScore: number;          // 0~20
  totalScore: number;           // 0~100
  grade: string;                // 등급 라벨
  penalties: Array<{ type: string; deducted: number }>;
  excluded: number;             // 제외된 건수
}

// ══════════════════════════════════════════
// 메인: 을 평판 점수 계산
// ══════════════════════════════════════════
export function calcEulReputation(input: ReputationInput): ReputationResult {
  const w = REPUTATION_WEIGHTS;

  // 1. 응답률 (25점)
  let responseScore = 0;
  if (input.totalRequests > 0) {
    const rate = input.respondedRequests / input.totalRequests;
    // 응답률 기본 + 응답 속도 보너스
    responseScore = Math.round(rate * w.responseRate * 0.7); // 70%는 응답 여부
    if (input.avgResponseHours <= 2) responseScore += Math.round(w.responseRate * 0.3); // 2시간 이내 만점
    else if (input.avgResponseHours <= 6) responseScore += Math.round(w.responseRate * 0.2);
    else if (input.avgResponseHours <= 24) responseScore += Math.round(w.responseRate * 0.1);
  }
  responseScore = Math.min(w.responseRate, responseScore);

  // 2. 납기준수율 (30점)
  let deliveryScore = 0;
  if (input.totalDeliveries > 0) {
    deliveryScore = Math.round((input.onTimeDeliveries / input.totalDeliveries) * w.deliveryRate);
  }

  // 3. 이행신뢰도 (25점)
  let reliabilityScore = w.reliabilityRate; // 만점에서 차감
  if (input.totalContracts > 0) {
    const extensionPenalty = Math.min(10, input.extensionsByEul * 2); // 연장당 2점 감점, 최대 10
    const cancelPenalty = Math.min(15, input.cancelsByEul * 5);       // 취소당 5점 감점, 최대 15
    reliabilityScore = Math.max(0, w.reliabilityRate - extensionPenalty - cancelPenalty);
  }

  // 4. 기록충실도 (20점)
  let recordScore = 0;
  if (input.expectedUpdates > 0) {
    recordScore = Math.round((input.progressUpdates / input.expectedUpdates) * w.recordRate);
  }
  recordScore = Math.min(w.recordRate, recordScore);

  // 감점 이벤트 적용
  const penaltyDetails: Array<{ type: string; deducted: number }> = [];
  for (const p of input.penalties) {
    const rule = PENALTY_TABLE[p];
    penaltyDetails.push({ type: p, deducted: rule.penalty });
    switch (rule.target) {
      case 'responseRate': responseScore = Math.max(0, responseScore - rule.penalty); break;
      case 'deliveryRate': deliveryScore = Math.max(0, deliveryScore - rule.penalty); break;
      case 'reliabilityRate': reliabilityScore = Math.max(0, reliabilityScore - rule.penalty); break;
      case 'recordRate': recordScore = Math.max(0, recordScore - rule.penalty); break;
    }
  }

  const totalScore = responseScore + deliveryScore + reliabilityScore + recordScore;

  // 등급 판정
  let grade: string;
  if (totalScore >= 90) grade = '우수';
  else if (totalScore >= 75) grade = '양호';
  else if (totalScore >= 60) grade = '보통';
  else if (totalScore >= 40) grade = '주의';
  else grade = '경고';

  return {
    responseScore,
    deliveryScore,
    reliabilityScore,
    recordScore,
    totalScore,
    grade,
    penalties: penaltyDetails,
    excluded: input.exclusions.length,
  };
}
