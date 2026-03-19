// ============================================================
// AXIS Platform - Code Master Seed Data
// ============================================================

export interface CodeMasterEntry {
  codeGroup: string;
  code: string;
  label: string;
  sortOrder: number;
}

export const CODE_MASTER_SEED: CodeMasterEntry[] = [
  // ────────────────────────────────────────────
  // PARTY_ROLE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'PARTY_ROLE', code: 'GAP', label: '갑(발주자)', sortOrder: 1 },
  { codeGroup: 'PARTY_ROLE', code: 'EUL', label: '을(시공사)', sortOrder: 2 },
  { codeGroup: 'PARTY_ROLE', code: 'BYEONG', label: '병(작업팀)', sortOrder: 3 },

  // ────────────────────────────────────────────
  // STATE_COMMON (10)
  // ────────────────────────────────────────────
  { codeGroup: 'STATE_COMMON', code: 'CREATED', label: '지시생성', sortOrder: 1 },
  { codeGroup: 'STATE_COMMON', code: 'CALLING', label: '호출중', sortOrder: 2 },
  { codeGroup: 'STATE_COMMON', code: 'MATCHED', label: '매칭완료', sortOrder: 3 },
  { codeGroup: 'STATE_COMMON', code: 'STANDBY', label: '작업대기', sortOrder: 4 },
  { codeGroup: 'STATE_COMMON', code: 'WORKING', label: '작업중', sortOrder: 5 },
  { codeGroup: 'STATE_COMMON', code: 'WORK_DONE', label: '작업완료', sortOrder: 6 },
  { codeGroup: 'STATE_COMMON', code: 'REPORT_DONE', label: '일보입력완료', sortOrder: 7 },
  { codeGroup: 'STATE_COMMON', code: 'SETTLE_WAIT', label: '정산대기', sortOrder: 8 },
  { codeGroup: 'STATE_COMMON', code: 'SETTLE_DONE', label: '정산완료', sortOrder: 9 },
  { codeGroup: 'STATE_COMMON', code: 'SEALED', label: '봉인완료', sortOrder: 10 },

  // ────────────────────────────────────────────
  // WORK_TYPE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'WORK_TYPE', code: 'INSTALL', label: '설치', sortOrder: 1 },
  { codeGroup: 'WORK_TYPE', code: 'DISMANTLE', label: '해체', sortOrder: 2 },
  { codeGroup: 'WORK_TYPE', code: 'REPAIR', label: '보수', sortOrder: 3 },

  // ────────────────────────────────────────────
  // FRAME_TYPE (2)
  // ────────────────────────────────────────────
  { codeGroup: 'FRAME_TYPE', code: 'H_BEAM', label: 'H빔', sortOrder: 1 },
  { codeGroup: 'FRAME_TYPE', code: 'PIPE', label: '파이프', sortOrder: 2 },

  // ────────────────────────────────────────────
  // PANEL_TYPE (4)
  // ────────────────────────────────────────────
  { codeGroup: 'PANEL_TYPE', code: 'EGI', label: 'EGI', sortOrder: 1 },
  { codeGroup: 'PANEL_TYPE', code: 'RPP', label: 'RPP', sortOrder: 2 },
  { codeGroup: 'PANEL_TYPE', code: 'STEEL', label: '스틸', sortOrder: 3 },
  { codeGroup: 'PANEL_TYPE', code: 'ETC', label: '기타', sortOrder: 4 },

  // ────────────────────────────────────────────
  // CONTRACT_TYPE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'CONTRACT_TYPE', code: 'BUYBACK', label: '바이백', sortOrder: 1 },
  { codeGroup: 'CONTRACT_TYPE', code: 'PURCHASE', label: '구매', sortOrder: 2 },
  { codeGroup: 'CONTRACT_TYPE', code: 'MONTHLY_RENTAL', label: '월임대', sortOrder: 3 },

  // ────────────────────────────────────────────
  // ASSIGN_METHOD (2)
  // ────────────────────────────────────────────
  { codeGroup: 'ASSIGN_METHOD', code: 'NORMAL', label: '일반배정', sortOrder: 1 },
  { codeGroup: 'ASSIGN_METHOD', code: 'SAFE', label: '안심배정', sortOrder: 2 },

  // ────────────────────────────────────────────
  // CREW_TYPE (2)
  // ────────────────────────────────────────────
  { codeGroup: 'CREW_TYPE', code: 'STANDARD', label: 'STANDARD', sortOrder: 1 },
  { codeGroup: 'CREW_TYPE', code: 'AXIS', label: 'AXIS', sortOrder: 2 },

  // ────────────────────────────────────────────
  // RISK_GRADE (6)
  // ────────────────────────────────────────────
  { codeGroup: 'RISK_GRADE', code: 'R0', label: 'R0', sortOrder: 1 },
  { codeGroup: 'RISK_GRADE', code: 'R1', label: 'R1', sortOrder: 2 },
  { codeGroup: 'RISK_GRADE', code: 'R2', label: 'R2', sortOrder: 3 },
  { codeGroup: 'RISK_GRADE', code: 'R3', label: 'R3', sortOrder: 4 },
  { codeGroup: 'RISK_GRADE', code: 'R4', label: 'R4', sortOrder: 5 },
  { codeGroup: 'RISK_GRADE', code: 'R5', label: 'R5', sortOrder: 6 },

  // ────────────────────────────────────────────
  // PAY_METHOD (3)
  // ────────────────────────────────────────────
  { codeGroup: 'PAY_METHOD', code: 'IMMEDIATE', label: '바로지급', sortOrder: 1 },
  { codeGroup: 'PAY_METHOD', code: 'FIRST_HALF', label: '1~15일', sortOrder: 2 },
  { codeGroup: 'PAY_METHOD', code: 'SECOND_HALF', label: '16~말일', sortOrder: 3 },

  // ────────────────────────────────────────────
  // SEAL_TYPE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'SEAL_TYPE', code: 'SINGLE_SEAL', label: 'SINGLE_SEAL', sortOrder: 1 },
  { codeGroup: 'SEAL_TYPE', code: 'MUTUAL_SEAL', label: 'MUTUAL_SEAL', sortOrder: 2 },
  { codeGroup: 'SEAL_TYPE', code: 'AUTO_SEAL', label: 'AUTO_SEAL', sortOrder: 3 },

  // ────────────────────────────────────────────
  // SEAL_AXIS (4)
  // ────────────────────────────────────────────
  { codeGroup: 'SEAL_AXIS', code: 'CONSTRUCTION', label: '시공', sortOrder: 1 },
  { codeGroup: 'SEAL_AXIS', code: 'EQUIPMENT', label: '장비', sortOrder: 2 },
  { codeGroup: 'SEAL_AXIS', code: 'CARGO', label: '화물', sortOrder: 3 },
  { codeGroup: 'SEAL_AXIS', code: 'GATE', label: '게이트', sortOrder: 4 },

  // ────────────────────────────────────────────
  // FOUNDATION_TYPE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'FOUNDATION_TYPE', code: 'EMBED', label: '근입', sortOrder: 1 },
  { codeGroup: 'FOUNDATION_TYPE', code: 'BASE_PLATE', label: '베이스판', sortOrder: 2 },
  { codeGroup: 'FOUNDATION_TYPE', code: 'DIRECT', label: '직타', sortOrder: 3 },

  // ────────────────────────────────────────────
  // POST_ANGLE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'POST_ANGLE', code: 'RIGHT_ANGLE', label: '직각', sortOrder: 1 },
  { codeGroup: 'POST_ANGLE', code: 'INCLINE', label: '경사', sortOrder: 2 },
  { codeGroup: 'POST_ANGLE', code: 'MIXED', label: '혼합', sortOrder: 3 },

  // ────────────────────────────────────────────
  // INSURANCE_TYPE (5)
  // ────────────────────────────────────────────
  { codeGroup: 'INSURANCE_TYPE', code: 'INDUSTRIAL_ACCIDENT', label: '산재보험', sortOrder: 1 },
  { codeGroup: 'INSURANCE_TYPE', code: 'EMPLOYMENT', label: '고용보험', sortOrder: 2 },
  { codeGroup: 'INSURANCE_TYPE', code: 'GENERAL_LIABILITY', label: '일반배상', sortOrder: 3 },
  { codeGroup: 'INSURANCE_TYPE', code: 'PROFESSIONAL_LIABILITY', label: '전문배상', sortOrder: 4 },
  { codeGroup: 'INSURANCE_TYPE', code: 'RETIREMENT_DEDUCTION', label: '퇴직공제', sortOrder: 5 },

  // ────────────────────────────────────────────
  // SAFETY_CHECK_RESULT (2)
  // ────────────────────────────────────────────
  { codeGroup: 'SAFETY_CHECK_RESULT', code: 'PASS', label: '통과', sortOrder: 1 },
  { codeGroup: 'SAFETY_CHECK_RESULT', code: 'FAIL', label: '미통과', sortOrder: 2 },

  // ────────────────────────────────────────────
  // CHECK_CYCLE (6)
  // ────────────────────────────────────────────
  { codeGroup: 'CHECK_CYCLE', code: 'DAILY', label: '일일', sortOrder: 1 },
  { codeGroup: 'CHECK_CYCLE', code: 'WEEKLY', label: '주간', sortOrder: 2 },
  { codeGroup: 'CHECK_CYCLE', code: 'MONTHLY', label: '월간', sortOrder: 3 },
  { codeGroup: 'CHECK_CYCLE', code: 'QUARTERLY', label: '분기', sortOrder: 4 },
  { codeGroup: 'CHECK_CYCLE', code: 'SEMI_ANNUAL', label: '반기', sortOrder: 5 },
  { codeGroup: 'CHECK_CYCLE', code: 'PRECISION', label: '정밀', sortOrder: 6 },

  // ────────────────────────────────────────────
  // SEASON_TYPE (5)
  // ────────────────────────────────────────────
  { codeGroup: 'SEASON_TYPE', code: 'NORMAL', label: '일반', sortOrder: 1 },
  { codeGroup: 'SEASON_TYPE', code: 'THAW', label: '해빙기', sortOrder: 2 },
  { codeGroup: 'SEASON_TYPE', code: 'MONSOON', label: '장마', sortOrder: 3 },
  { codeGroup: 'SEASON_TYPE', code: 'TYPHOON', label: '태풍', sortOrder: 4 },
  { codeGroup: 'SEASON_TYPE', code: 'WINTER', label: '동절기', sortOrder: 5 },

  // ────────────────────────────────────────────
  // ACTION_STATUS (4)
  // ────────────────────────────────────────────
  { codeGroup: 'ACTION_STATUS', code: 'NOT_APPLICABLE', label: '해당없음', sortOrder: 1 },
  { codeGroup: 'ACTION_STATUS', code: 'PENDING', label: '미조치', sortOrder: 2 },
  { codeGroup: 'ACTION_STATUS', code: 'ACTION_DONE', label: '조치완료', sortOrder: 3 },
  { codeGroup: 'ACTION_STATUS', code: 'CONFIRMED', label: '확인완료', sortOrder: 4 },

  // ────────────────────────────────────────────
  // SAFETY_ROLE (5)
  // ────────────────────────────────────────────
  { codeGroup: 'SAFETY_ROLE', code: 'SR_TOTAL', label: 'SR_TOTAL', sortOrder: 1 },
  { codeGroup: 'SAFETY_ROLE', code: 'SR_MANAGE', label: 'SR_MANAGE', sortOrder: 2 },
  { codeGroup: 'SAFETY_ROLE', code: 'SR_FIRE', label: 'SR_FIRE', sortOrder: 3 },
  { codeGroup: 'SAFETY_ROLE', code: 'SR_HEALTH', label: 'SR_HEALTH', sortOrder: 4 },
  { codeGroup: 'SAFETY_ROLE', code: 'SR_SUPER', label: 'SR_SUPER', sortOrder: 5 },

  // ────────────────────────────────────────────
  // SIGN_ROUTE (4)
  // ────────────────────────────────────────────
  { codeGroup: 'SIGN_ROUTE', code: 'FULL_MEMBER', label: '정회원', sortOrder: 1 },
  { codeGroup: 'SIGN_ROUTE', code: 'SIMPLE_FACE', label: '간편대면', sortOrder: 2 },
  { codeGroup: 'SIGN_ROUTE', code: 'SIMPLE_REMOTE', label: '간편원격', sortOrder: 3 },
  { codeGroup: 'SIGN_ROUTE', code: 'AGENCY', label: '소개소경유', sortOrder: 4 },

  // ────────────────────────────────────────────
  // WORKER_TYPE (4)
  // ────────────────────────────────────────────
  { codeGroup: 'WORKER_TYPE', code: 'FREELANCER', label: '프리랜서', sortOrder: 1 },
  { codeGroup: 'WORKER_TYPE', code: 'DAILY', label: '일용직', sortOrder: 2 },
  { codeGroup: 'WORKER_TYPE', code: 'PERMANENT', label: '상용직', sortOrder: 3 },
  { codeGroup: 'WORKER_TYPE', code: 'SUPERVISOR', label: '관리감독자', sortOrder: 4 },

  // ────────────────────────────────────────────
  // TAX_TYPE (4)
  // ────────────────────────────────────────────
  { codeGroup: 'TAX_TYPE', code: 'TX_33', label: 'TX_33', sortOrder: 1 },
  { codeGroup: 'TAX_TYPE', code: 'TX_DAILY', label: 'TX_DAILY', sortOrder: 2 },
  { codeGroup: 'TAX_TYPE', code: 'TX_AGENCY', label: 'TX_AGENCY', sortOrder: 3 },
  { codeGroup: 'TAX_TYPE', code: 'TX_WAGE', label: 'TX_WAGE', sortOrder: 4 },

  // ────────────────────────────────────────────
  // LICENSE_TYPE (10)
  // ────────────────────────────────────────────
  { codeGroup: 'LICENSE_TYPE', code: 'EXCAVATOR', label: '굴착기', sortOrder: 1 },
  { codeGroup: 'LICENSE_TYPE', code: 'LOADER', label: '로더', sortOrder: 2 },
  { codeGroup: 'LICENSE_TYPE', code: 'FORKLIFT', label: '지게차', sortOrder: 3 },
  { codeGroup: 'LICENSE_TYPE', code: 'CRANE', label: '크레인', sortOrder: 4 },
  { codeGroup: 'LICENSE_TYPE', code: 'BULLDOZER', label: '불도저', sortOrder: 5 },
  { codeGroup: 'LICENSE_TYPE', code: 'ROLLER', label: '로울러', sortOrder: 6 },
  { codeGroup: 'LICENSE_TYPE', code: 'PILE_DRIVER', label: '항타및항발기', sortOrder: 7 },
  { codeGroup: 'LICENSE_TYPE', code: 'MOBILE_CRANE', label: '기중기', sortOrder: 8 },
  { codeGroup: 'LICENSE_TYPE', code: 'DUMP_TRUCK', label: '덤프트럭', sortOrder: 9 },
  { codeGroup: 'LICENSE_TYPE', code: 'OTHER', label: '기타', sortOrder: 10 },

  // ────────────────────────────────────────────
  // POUR_METHOD (4)
  // ────────────────────────────────────────────
  { codeGroup: 'POUR_METHOD', code: 'DIRECT', label: '직타', sortOrder: 1 },
  { codeGroup: 'POUR_METHOD', code: 'DIRECT_FUNNEL', label: '직타_깔때기', sortOrder: 2 },
  { codeGroup: 'POUR_METHOD', code: 'BUCKET_STD', label: '버킷_표준', sortOrder: 3 },
  { codeGroup: 'POUR_METHOD', code: 'BUCKET_FAR', label: '버킷_원거리', sortOrder: 4 },

  // ────────────────────────────────────────────
  // GROUND_TYPE (5)
  // ────────────────────────────────────────────
  { codeGroup: 'GROUND_TYPE', code: 'CLAY', label: '점성토', sortOrder: 1 },
  { codeGroup: 'GROUND_TYPE', code: 'SAND_STD', label: '사질토_표준', sortOrder: 2 },
  { codeGroup: 'GROUND_TYPE', code: 'SAND_POOR', label: '사질토_불량', sortOrder: 3 },
  { codeGroup: 'GROUND_TYPE', code: 'GRAVEL', label: '자갈층', sortOrder: 4 },
  { codeGroup: 'GROUND_TYPE', code: 'SOFT', label: '연약지반', sortOrder: 5 },

  // ────────────────────────────────────────────
  // CHLORIDE_GRADE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'CHLORIDE_GRADE', code: 'GREEN', label: 'GREEN', sortOrder: 1 },
  { codeGroup: 'CHLORIDE_GRADE', code: 'YELLOW', label: 'YELLOW', sortOrder: 2 },
  { codeGroup: 'CHLORIDE_GRADE', code: 'RED', label: 'RED', sortOrder: 3 },

  // ────────────────────────────────────────────
  // TRANSPORT_GRADE (2)
  // ────────────────────────────────────────────
  { codeGroup: 'TRANSPORT_GRADE', code: 'FIT', label: '적합', sortOrder: 1 },
  { codeGroup: 'TRANSPORT_GRADE', code: 'FLAG', label: 'FLAG', sortOrder: 2 },

  // ────────────────────────────────────────────
  // CURING_MODE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'CURING_MODE', code: 'SUMMER', label: '여름', sortOrder: 1 },
  { codeGroup: 'CURING_MODE', code: 'BETWEEN', label: '간절기', sortOrder: 2 },
  { codeGroup: 'CURING_MODE', code: 'COLD', label: '한중', sortOrder: 3 },

  // ────────────────────────────────────────────
  // PLAN_TYPE (3)
  // ────────────────────────────────────────────
  { codeGroup: 'PLAN_TYPE', code: 'NONE', label: 'NONE', sortOrder: 1 },
  { codeGroup: 'PLAN_TYPE', code: 'STANDARD', label: 'STANDARD', sortOrder: 2 },
  { codeGroup: 'PLAN_TYPE', code: 'AXIS', label: 'AXIS', sortOrder: 3 },

  // ────────────────────────────────────────────
  // INCIDENT_TYPE (4)
  // ────────────────────────────────────────────
  { codeGroup: 'INCIDENT_TYPE', code: 'ACCIDENT', label: '사고', sortOrder: 1 },
  { codeGroup: 'INCIDENT_TYPE', code: 'NEAR_MISS', label: '아차사고', sortOrder: 2 },
  { codeGroup: 'INCIDENT_TYPE', code: 'OCCUPATIONAL_DISEASE', label: '직업병', sortOrder: 3 },
  { codeGroup: 'INCIDENT_TYPE', code: 'OTHER', label: '기타', sortOrder: 4 },

  // ────────────────────────────────────────────
  // SEVERITY (4)
  // ────────────────────────────────────────────
  { codeGroup: 'SEVERITY', code: 'MINOR', label: '경미', sortOrder: 1 },
  { codeGroup: 'SEVERITY', code: 'MODERATE', label: '보통', sortOrder: 2 },
  { codeGroup: 'SEVERITY', code: 'SERIOUS', label: '중대', sortOrder: 3 },
  { codeGroup: 'SEVERITY', code: 'CRITICAL', label: '치명', sortOrder: 4 },

  // ────────────────────────────────────────────
  // EDU_TYPE (7)
  // ────────────────────────────────────────────
  { codeGroup: 'EDU_TYPE', code: 'BASIC_SAFETY', label: '기초안전보건교육', sortOrder: 1 },
  { codeGroup: 'EDU_TYPE', code: 'HIRING', label: '채용시교육', sortOrder: 2 },
  { codeGroup: 'EDU_TYPE', code: 'TASK_CHANGE', label: '작업내용변경시교육', sortOrder: 3 },
  { codeGroup: 'EDU_TYPE', code: 'SPECIAL', label: '특별교육', sortOrder: 4 },
  { codeGroup: 'EDU_TYPE', code: 'REGULAR', label: '정기교육', sortOrder: 5 },
  { codeGroup: 'EDU_TYPE', code: 'EQUIP_OPERATOR', label: '건설기계조종사안전교육', sortOrder: 6 },
  { codeGroup: 'EDU_TYPE', code: 'SPECIAL_WORKER', label: '특수형태교육', sortOrder: 7 },

  // ────────────────────────────────────────────
  // RISK_STATUS (4)
  // ────────────────────────────────────────────
  { codeGroup: 'RISK_STATUS', code: 'NORMAL', label: 'NORMAL', sortOrder: 1 },
  { codeGroup: 'RISK_STATUS', code: 'WATCH', label: 'WATCH', sortOrder: 2 },
  { codeGroup: 'RISK_STATUS', code: 'REINFORCED', label: 'REINFORCED', sortOrder: 3 },
  { codeGroup: 'RISK_STATUS', code: 'PROTECTED', label: 'PROTECTED', sortOrder: 4 },

  // ────────────────────────────────────────────
  // BILLING_STATUS (4)
  // ────────────────────────────────────────────
  { codeGroup: 'BILLING_STATUS', code: 'CREATED', label: '청구생성', sortOrder: 1 },
  { codeGroup: 'BILLING_STATUS', code: 'PENDING_APPROVAL', label: '승인대기', sortOrder: 2 },
  { codeGroup: 'BILLING_STATUS', code: 'PAID', label: '결제완료', sortOrder: 3 },
  { codeGroup: 'BILLING_STATUS', code: 'CANCELLED', label: '취소', sortOrder: 4 },

  // ────────────────────────────────────────────
  // PAYMENT_STATUS (4)
  // ────────────────────────────────────────────
  { codeGroup: 'PAYMENT_STATUS', code: 'CREATED', label: 'CREATED', sortOrder: 1 },
  { codeGroup: 'PAYMENT_STATUS', code: 'COMPLETED', label: 'COMPLETED', sortOrder: 2 },
  { codeGroup: 'PAYMENT_STATUS', code: 'FAILED', label: 'FAILED', sortOrder: 3 },
  { codeGroup: 'PAYMENT_STATUS', code: 'CANCELLED', label: 'CANCELLED', sortOrder: 4 },

  // ────────────────────────────────────────────
  // CALL_STATUS (4)
  // ────────────────────────────────────────────
  { codeGroup: 'CALL_STATUS', code: 'CALLING', label: '호출중', sortOrder: 1 },
  { codeGroup: 'CALL_STATUS', code: 'ACCEPTED', label: '수락', sortOrder: 2 },
  { codeGroup: 'CALL_STATUS', code: 'REJECTED', label: '거부', sortOrder: 3 },
  { codeGroup: 'CALL_STATUS', code: 'EXPIRED', label: '만료', sortOrder: 4 },

  // ────────────────────────────────────────────
  // DESIGN_CHANGE_STATUS (4)
  // ────────────────────────────────────────────
  { codeGroup: 'DESIGN_CHANGE_STATUS', code: 'WAITING', label: 'WAITING', sortOrder: 1 },
  { codeGroup: 'DESIGN_CHANGE_STATUS', code: 'ACCEPTED', label: 'ACCEPTED', sortOrder: 2 },
  { codeGroup: 'DESIGN_CHANGE_STATUS', code: 'DISAGREEMENT', label: 'DISAGREEMENT', sortOrder: 3 },
  { codeGroup: 'DESIGN_CHANGE_STATUS', code: 'EXPIRED', label: 'EXPIRED', sortOrder: 4 },

  // ────────────────────────────────────────────
  // DOC_STATUS (3)
  // ────────────────────────────────────────────
  { codeGroup: 'DOC_STATUS', code: 'VALID', label: '유효', sortOrder: 1 },
  { codeGroup: 'DOC_STATUS', code: 'EXPIRED', label: '만료', sortOrder: 2 },
  { codeGroup: 'DOC_STATUS', code: 'UNREGISTERED', label: '미등록', sortOrder: 3 },

  // ────────────────────────────────────────────
  // GUIDER_SIGNAL (3)
  // ────────────────────────────────────────────
  { codeGroup: 'GUIDER_SIGNAL', code: 'HAND', label: '수신호', sortOrder: 1 },
  { codeGroup: 'GUIDER_SIGNAL', code: 'RADIO', label: '무선', sortOrder: 2 },
  { codeGroup: 'GUIDER_SIGNAL', code: 'OTHER', label: '기타', sortOrder: 3 },

  // ────────────────────────────────────────────
  // COPY_METHOD (4)
  // ────────────────────────────────────────────
  { codeGroup: 'COPY_METHOD', code: 'SMS', label: 'SMS', sortOrder: 1 },
  { codeGroup: 'COPY_METHOD', code: 'KAKAO', label: '카카오톡', sortOrder: 2 },
  { codeGroup: 'COPY_METHOD', code: 'EMAIL', label: '이메일', sortOrder: 3 },
  { codeGroup: 'COPY_METHOD', code: 'ONSITE_PAPER', label: '현장수기', sortOrder: 4 },

  // ────────────────────────────────────────────
  // AUTH_METHOD (5)
  // ────────────────────────────────────────────
  { codeGroup: 'AUTH_METHOD', code: 'PHONE', label: '전화번호', sortOrder: 1 },
  { codeGroup: 'AUTH_METHOD', code: 'KAKAO', label: '카카오', sortOrder: 2 },
  { codeGroup: 'AUTH_METHOD', code: 'PASS', label: 'PASS', sortOrder: 3 },
  { codeGroup: 'AUTH_METHOD', code: 'FOREIGNER_ID', label: '외국인등록번호', sortOrder: 4 },
  { codeGroup: 'AUTH_METHOD', code: 'UNAUTHENTICATED', label: '미인증', sortOrder: 5 },

  // ────────────────────────────────────────────
  // RECORD_LEVEL (3)
  // ────────────────────────────────────────────
  { codeGroup: 'RECORD_LEVEL', code: 'BASIC', label: '기본', sortOrder: 1 },
  { codeGroup: 'RECORD_LEVEL', code: 'STANDARD', label: '표준', sortOrder: 2 },
  { codeGroup: 'RECORD_LEVEL', code: 'ADVANCED', label: '고급', sortOrder: 3 },

  // ────────────────────────────────────────────
  // CHECK_TARGET_TYPE (2)
  // ────────────────────────────────────────────
  { codeGroup: 'CHECK_TARGET_TYPE', code: 'SITE', label: '현장', sortOrder: 1 },
  { codeGroup: 'CHECK_TARGET_TYPE', code: 'EQUIPMENT', label: '장비', sortOrder: 2 },

  // ────────────────────────────────────────────
  // WEATHER (5)
  // ────────────────────────────────────────────
  { codeGroup: 'WEATHER', code: 'CLEAR', label: '맑음', sortOrder: 1 },
  { codeGroup: 'WEATHER', code: 'CLOUDY', label: '흐림', sortOrder: 2 },
  { codeGroup: 'WEATHER', code: 'RAIN', label: '비', sortOrder: 3 },
  { codeGroup: 'WEATHER', code: 'SNOW', label: '눈', sortOrder: 4 },
  { codeGroup: 'WEATHER', code: 'STRONG_WIND', label: '강풍', sortOrder: 5 },

  // ────────────────────────────────────────────
  // EQUIP_TYPE (10)
  // ────────────────────────────────────────────
  { codeGroup: 'EQUIP_TYPE', code: 'EXCAVATOR', label: '굴착기', sortOrder: 1 },
  { codeGroup: 'EQUIP_TYPE', code: 'CRANE', label: '크레인', sortOrder: 2 },
  { codeGroup: 'EQUIP_TYPE', code: 'FORKLIFT', label: '지게차', sortOrder: 3 },
  { codeGroup: 'EQUIP_TYPE', code: 'LOADER', label: '로더', sortOrder: 4 },
  { codeGroup: 'EQUIP_TYPE', code: 'BULLDOZER', label: '불도저', sortOrder: 5 },
  { codeGroup: 'EQUIP_TYPE', code: 'ROLLER', label: '로울러', sortOrder: 6 },
  { codeGroup: 'EQUIP_TYPE', code: 'PILE_DRIVER', label: '항타기', sortOrder: 7 },
  { codeGroup: 'EQUIP_TYPE', code: 'DUMP_TRUCK', label: '덤프트럭', sortOrder: 8 },
  { codeGroup: 'EQUIP_TYPE', code: 'SKYLIFT', label: '스카이', sortOrder: 9 },
  { codeGroup: 'EQUIP_TYPE', code: 'OTHER', label: '기타', sortOrder: 10 },
];
