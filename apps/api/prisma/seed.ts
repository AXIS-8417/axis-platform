import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ═══════════════════════════════════════════
  // 0. Existing seeds (PriceTrend + Users)
  // ═══════════════════════════════════════════
  await prisma.priceTrend.createMany({ data: [
    { panelType: 'RPP',  trend: 'DOWN', changePct: -3.2 },
    { panelType: 'EGI',  trend: 'DOWN', changePct: -1.8 },
    { panelType: '스틸', trend: 'FLAT', changePct: 0.0  },
  ], skipDuplicates: true });
  console.log('Price trends seeded');

  const adminPw = await bcrypt.hash('admin2026!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@axis.kr' },
    update: {},
    create: { email: 'admin@axis.kr', password: adminPw, role: 'ADMIN', companyName: 'AXIS' },
  });

  const gapPw = await bcrypt.hash('test1234', 10);
  await prisma.user.upsert({
    where: { email: 'gap@test.com' },
    update: {},
    create: { email: 'gap@test.com', password: gapPw, role: 'GAP', companyName: '테스트건설' },
  });

  const eulPw = await bcrypt.hash('test1234', 10);
  await prisma.user.upsert({
    where: { email: 'eul@test.com' },
    update: {},
    create: { email: 'eul@test.com', password: eulPw, role: 'EUL', companyName: '테스트시공' },
  });
  console.log('Users seeded');

  // ═══════════════════════════════════════════
  // 1. CodeMaster - AXIS master design v2.9
  //    37 code groups, 115 codes total
  // ═══════════════════════════════════════════
  const codes = [
    // PARTY_ROLE
    { codeGroup: 'PARTY_ROLE', code: 'GAP', label: '갑', sortOrder: 1 },
    { codeGroup: 'PARTY_ROLE', code: 'EUL', label: '을', sortOrder: 2 },
    { codeGroup: 'PARTY_ROLE', code: 'BYEONG', label: '병', sortOrder: 3 },

    // AXIS_TYPE
    { codeGroup: 'AXIS_TYPE', code: 'CONSTRUCTION', label: '시공', sortOrder: 1 },
    { codeGroup: 'AXIS_TYPE', code: 'EQUIPMENT', label: '장비', sortOrder: 2 },
    { codeGroup: 'AXIS_TYPE', code: 'CARGO', label: '화물', sortOrder: 3 },
    { codeGroup: 'AXIS_TYPE', code: 'GATE', label: '게이트', sortOrder: 4 },
    { codeGroup: 'AXIS_TYPE', code: 'COMPOSITE', label: '복합', sortOrder: 5 },

    // STATE_COMMON
    { codeGroup: 'STATE_COMMON', code: 'DRAFT', label: '작성', sortOrder: 1 },
    { codeGroup: 'STATE_COMMON', code: 'WAITING', label: '대기', sortOrder: 2 },
    { codeGroup: 'STATE_COMMON', code: 'IN_PROGRESS', label: '진행', sortOrder: 3 },
    { codeGroup: 'STATE_COMMON', code: 'COMPLETED', label: '완료', sortOrder: 4 },
    { codeGroup: 'STATE_COMMON', code: 'SUSPENDED', label: '중단', sortOrder: 5 },
    { codeGroup: 'STATE_COMMON', code: 'SEALED', label: '봉인', sortOrder: 6 },

    // WORK_ORDER_STATUS
    { codeGroup: 'WORK_ORDER_STATUS', code: 'ORDER_CREATED', label: '지시생성', sortOrder: 1 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'CALLING', label: '호출중', sortOrder: 2 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'MATCHED', label: '매칭완료', sortOrder: 3 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'WORK_READY', label: '작업대기', sortOrder: 4 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'WORKING', label: '작업중', sortOrder: 5 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'WORK_DONE', label: '작업완료', sortOrder: 6 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'REPORT_DONE', label: '일보입력완료', sortOrder: 7 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'SETTLE_READY', label: '정산대기', sortOrder: 8 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'SETTLE_DONE', label: '정산완료', sortOrder: 9 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'SEAL_DONE', label: '봉인완료', sortOrder: 10 },
    { codeGroup: 'WORK_ORDER_STATUS', code: 'CANCELLED', label: '취소', sortOrder: 99 },

    // SUBSCRIPTION_PLAN
    { codeGroup: 'SUBSCRIPTION_PLAN', code: 'NONE', label: '미구독', sortOrder: 1 },
    { codeGroup: 'SUBSCRIPTION_PLAN', code: 'STANDARD', label: '스탠다드', sortOrder: 2 },
    { codeGroup: 'SUBSCRIPTION_PLAN', code: 'AXIS', label: 'AXIS', sortOrder: 3 },

    // ASSIGN_TYPE
    { codeGroup: 'ASSIGN_TYPE', code: 'NORMAL', label: '일반배정', sortOrder: 1 },
    { codeGroup: 'ASSIGN_TYPE', code: 'SAFE', label: '안심배정', sortOrder: 2 },

    // SIGN_ROUTE
    { codeGroup: 'SIGN_ROUTE', code: 'SIGN_MEMBER', label: '정회원앱', sortOrder: 1 },
    { codeGroup: 'SIGN_ROUTE', code: 'SIGN_FACE', label: '간편대면', sortOrder: 2 },
    { codeGroup: 'SIGN_ROUTE', code: 'SIGN_REMOTE', label: '간편원격', sortOrder: 3 },
    { codeGroup: 'SIGN_ROUTE', code: 'SIGN_AGENCY', label: '소개소경유', sortOrder: 4 },

    // AUTH_METHOD
    { codeGroup: 'AUTH_METHOD', code: 'AUTH_PHONE', label: '전화번호', sortOrder: 1 },
    { codeGroup: 'AUTH_METHOD', code: 'AUTH_KAKAO', label: '카카오', sortOrder: 2 },
    { codeGroup: 'AUTH_METHOD', code: 'AUTH_PASS', label: 'PASS', sortOrder: 3 },
    { codeGroup: 'AUTH_METHOD', code: 'AUTH_ALIEN', label: '외국인등록번호', sortOrder: 4 },
    { codeGroup: 'AUTH_METHOD', code: 'AUTH_NONE', label: '미인증', sortOrder: 5 },

    // SAFETY_EDU_TYPE
    { codeGroup: 'SAFETY_EDU_TYPE', code: 'SE_HIRE', label: '채용시교육', sortOrder: 1 },
    { codeGroup: 'SAFETY_EDU_TYPE', code: 'SE_CHANGE', label: '작업내용변경시교육', sortOrder: 2 },
    { codeGroup: 'SAFETY_EDU_TYPE', code: 'SE_SPECIAL', label: '특별교육', sortOrder: 3 },
    { codeGroup: 'SAFETY_EDU_TYPE', code: 'SE_REGULAR', label: '정기교육', sortOrder: 4 },
    { codeGroup: 'SAFETY_EDU_TYPE', code: 'SE_SUPER', label: '관리감독자교육', sortOrder: 5 },
    { codeGroup: 'SAFETY_EDU_TYPE', code: 'SE_BASIC', label: '기초안전보건교육', sortOrder: 6 },

    // CHECK_CYCLE
    { codeGroup: 'CHECK_CYCLE', code: 'CK_DAILY', label: '일일점검', sortOrder: 1 },
    { codeGroup: 'CHECK_CYCLE', code: 'CK_WEEKLY', label: '주간점검', sortOrder: 2 },
    { codeGroup: 'CHECK_CYCLE', code: 'CK_MONTHLY', label: '월간점검', sortOrder: 3 },
    { codeGroup: 'CHECK_CYCLE', code: 'CK_QUARTER', label: '분기점검', sortOrder: 4 },
    { codeGroup: 'CHECK_CYCLE', code: 'CK_REGULAR', label: '정기점검', sortOrder: 5 },
    { codeGroup: 'CHECK_CYCLE', code: 'CK_PRECISE', label: '정밀점검', sortOrder: 6 },

    // SEASON_CHECK
    { codeGroup: 'SEASON_CHECK', code: 'SS_NORMAL', label: '일반', sortOrder: 1 },
    { codeGroup: 'SEASON_CHECK', code: 'SS_THAW', label: '해빙기', sortOrder: 2 },
    { codeGroup: 'SEASON_CHECK', code: 'SS_RAIN', label: '장마철', sortOrder: 3 },
    { codeGroup: 'SEASON_CHECK', code: 'SS_TYPH', label: '태풍기', sortOrder: 4 },
    { codeGroup: 'SEASON_CHECK', code: 'SS_WINTER', label: '동절기', sortOrder: 5 },

    // MATERIAL_TRANSITION
    { codeGroup: 'MATERIAL_TRANSITION', code: 'DISPATCH', label: 'IN_STOCK→DISPATCHED', sortOrder: 1 },
    { codeGroup: 'MATERIAL_TRANSITION', code: 'INSTALL', label: 'ON_SITE→INSTALLED', sortOrder: 2 },
    { codeGroup: 'MATERIAL_TRANSITION', code: 'REMOVE', label: 'INSTALLED→REMOVED', sortOrder: 3 },
    { codeGroup: 'MATERIAL_TRANSITION', code: 'PARTIAL_REMOVE', label: 'INSTALLED→PARTIALLY_REMOVED', sortOrder: 4 },
    { codeGroup: 'MATERIAL_TRANSITION', code: 'RETURN', label: 'IN_TRANSIT→RETURNED', sortOrder: 5 },
    { codeGroup: 'MATERIAL_TRANSITION', code: 'DISCARD', label: 'REMOVED→DISCARDED', sortOrder: 6 },

    // SEAL_TARGET_TYPE
    { codeGroup: 'SEAL_TARGET_TYPE', code: 'CONTRACT_SNAPSHOT', label: '계약스냅샷', sortOrder: 1 },
    { codeGroup: 'SEAL_TARGET_TYPE', code: 'ASSEMBLY_DRAWING', label: '조립도제출본', sortOrder: 2 },
    { codeGroup: 'SEAL_TARGET_TYPE', code: 'TEST_REPORT', label: '시험성적서', sortOrder: 3 },
    { codeGroup: 'SEAL_TARGET_TYPE', code: 'INSPECTION_CERT', label: '검사증명서', sortOrder: 4 },
    { codeGroup: 'SEAL_TARGET_TYPE', code: 'INVOICE', label: '거래명세표', sortOrder: 5 },
    { codeGroup: 'SEAL_TARGET_TYPE', code: 'EVIDENCE_PACKAGE', label: '증빙패키지', sortOrder: 6 },
    { codeGroup: 'SEAL_TARGET_TYPE', code: 'OTHER', label: '기타', sortOrder: 7 },

    // GATE_TYPE
    { codeGroup: 'GATE_TYPE', code: 'HOLDING', label: '홀딩도어', sortOrder: 1 },
    { codeGroup: 'GATE_TYPE', code: 'YANGAE', label: '양개도어', sortOrder: 2 },
    { codeGroup: 'GATE_TYPE', code: 'ETC', label: '기타', sortOrder: 3 },

    // GATE_MATERIAL
    { codeGroup: 'GATE_MATERIAL', code: 'NEW', label: '신재', sortOrder: 1 },
    { codeGroup: 'GATE_MATERIAL', code: 'USED', label: '고재', sortOrder: 2 },

    // GATE_EVENT_TYPE
    { codeGroup: 'GATE_EVENT_TYPE', code: 'MOVE', label: '이동', sortOrder: 1 },
    { codeGroup: 'GATE_EVENT_TYPE', code: 'DIRECT_SHIP', label: '직송', sortOrder: 2 },
    { codeGroup: 'GATE_EVENT_TYPE', code: 'INSTALL', label: '설치', sortOrder: 3 },
    { codeGroup: 'GATE_EVENT_TYPE', code: 'DISMANTLE', label: '해체', sortOrder: 4 },
    { codeGroup: 'GATE_EVENT_TYPE', code: 'RETRIEVE', label: '회수', sortOrder: 5 },
    { codeGroup: 'GATE_EVENT_TYPE', code: 'REPAIR', label: '보수', sortOrder: 6 },
    { codeGroup: 'GATE_EVENT_TYPE', code: 'CONDITION_CHECK', label: '상태판정', sortOrder: 7 },
    { codeGroup: 'GATE_EVENT_TYPE', code: 'DISPOSE', label: '폐기', sortOrder: 8 },

    // MATERIAL_SOURCE
    { codeGroup: 'MATERIAL_SOURCE', code: 'OUR_STOCK', label: '우리재고', sortOrder: 1 },
    { codeGroup: 'MATERIAL_SOURCE', code: 'VENDOR_STOCK', label: '게이트업체재고', sortOrder: 2 },
    { codeGroup: 'MATERIAL_SOURCE', code: 'DIRECT_SHIP', label: '현장직송', sortOrder: 3 },
    { codeGroup: 'MATERIAL_SOURCE', code: 'OTHER_SITE', label: '타현장전용', sortOrder: 4 },

    // COST_NATURE
    { codeGroup: 'COST_NATURE', code: 'BILLABLE', label: '비용청구있음', sortOrder: 1 },
    { codeGroup: 'COST_NATURE', code: 'FREE', label: '비용청구없음', sortOrder: 2 },
    { codeGroup: 'COST_NATURE', code: 'OWNERSHIP_TRANSFER', label: '자재소유전환', sortOrder: 3 },

    // SEAL_TYPE
    { codeGroup: 'SEAL_TYPE', code: 'SINGLE', label: '단독잠금', sortOrder: 1, remark: '상태동결만, 책임·정산 확정 아님' },
    { codeGroup: 'SEAL_TYPE', code: 'MUTUAL', label: '상호잠금', sortOrder: 2, remark: '상태동결만, 책임·정산 확정 아님' },
    { codeGroup: 'SEAL_TYPE', code: 'UNACCEPTED', label: '미수락잠금', sortOrder: 3, remark: '상태동결만, 책임·정산 확정 아님' },

    // JUDGMENT_RESULT
    { codeGroup: 'JUDGMENT_RESULT', code: 'USABLE', label: '사용가능', sortOrder: 1 },
    { codeGroup: 'JUDGMENT_RESULT', code: 'UNUSABLE', label: '사용불가', sortOrder: 2 },
    { codeGroup: 'JUDGMENT_RESULT', code: 'REPAIR_WAIT', label: '수리대기', sortOrder: 3 },

    // MOVE_TARGET
    { codeGroup: 'MOVE_TARGET', code: 'EUL', label: '을', sortOrder: 1 },
    { codeGroup: 'MOVE_TARGET', code: 'BYEONG', label: '병', sortOrder: 2 },
    { codeGroup: 'MOVE_TARGET', code: 'SITE', label: '현장', sortOrder: 3 },

    // MOVE_REASON
    { codeGroup: 'MOVE_REASON', code: 'INSTALL_IMPORT', label: '설치용반입', sortOrder: 1 },
    { codeGroup: 'MOVE_REASON', code: 'RETRIEVE_STORE', label: '회수/보관', sortOrder: 2 },
    { codeGroup: 'MOVE_REASON', code: 'SITE_MOVE', label: '현장이동', sortOrder: 3 },
    { codeGroup: 'MOVE_REASON', code: 'DISPOSE_REPAIR', label: '폐기/수리', sortOrder: 4 },

    // RECON_STATUS
    { codeGroup: 'RECON_STATUS', code: 'MATCHED', label: '상호기록일치', sortOrder: 1 },
    { codeGroup: 'RECON_STATUS', code: 'CHECK_NEEDED', label: '확인필요', sortOrder: 2 },

    // LOCK_STATUS
    { codeGroup: 'LOCK_STATUS', code: 'DRAFTING', label: '작성중', sortOrder: 1 },
    { codeGroup: 'LOCK_STATUS', code: 'LOCKED', label: '잠금완료', sortOrder: 2 },

    // YANGAE_STRUCTURE
    { codeGroup: 'YANGAE_STRUCTURE', code: 'YES', label: '해당', sortOrder: 1 },
    { codeGroup: 'YANGAE_STRUCTURE', code: 'NO', label: '해당없음', sortOrder: 2 },

    // PERFORM_TYPE
    { codeGroup: 'PERFORM_TYPE', code: 'INSTALL', label: '설치', sortOrder: 1 },
    { codeGroup: 'PERFORM_TYPE', code: 'DISMANTLE', label: '해체', sortOrder: 2 },
    { codeGroup: 'PERFORM_TYPE', code: 'RETRIEVE', label: '회수', sortOrder: 3 },
    { codeGroup: 'PERFORM_TYPE', code: 'REPAIR', label: '보수', sortOrder: 4 },

    // WORK_TYPE
    { codeGroup: 'WORK_TYPE', code: 'INSTALL', label: '설치', sortOrder: 1 },
    { codeGroup: 'WORK_TYPE', code: 'DISMANTLE', label: '해체', sortOrder: 2 },
    { codeGroup: 'WORK_TYPE', code: 'REPAIR', label: '보수', sortOrder: 3 },

    // CONTRACT_TYPE
    { codeGroup: 'CONTRACT_TYPE', code: 'BB', label: 'BB(Buy-Back)', sortOrder: 1 },
    { codeGroup: 'CONTRACT_TYPE', code: 'SELL', label: 'SELL(매도)', sortOrder: 2 },
    { codeGroup: 'CONTRACT_TYPE', code: 'RENTAL', label: '월임대', sortOrder: 3 },

    // PANEL_TYPE
    { codeGroup: 'PANEL_TYPE', code: 'EGI', label: 'EGI', sortOrder: 1 },
    { codeGroup: 'PANEL_TYPE', code: 'RPP', label: 'RPP', sortOrder: 2 },
    { codeGroup: 'PANEL_TYPE', code: 'STEEL', label: '스틸', sortOrder: 3 },

    // ASSET_TYPE
    { codeGroup: 'ASSET_TYPE', code: 'ALL_USED', label: '전체고재', sortOrder: 1 },
    { codeGroup: 'ASSET_TYPE', code: 'ALL_NEW', label: '전체신재', sortOrder: 2 },
    { codeGroup: 'ASSET_TYPE', code: 'PANEL_NEW', label: '판넬만신재', sortOrder: 3 },
    { codeGroup: 'ASSET_TYPE', code: 'PIPE_NEW', label: '파이프만신재', sortOrder: 4 },

    // GPS_EVENT
    { codeGroup: 'GPS_EVENT', code: 'ARRIVE', label: '도착', sortOrder: 1 },
    { codeGroup: 'GPS_EVENT', code: 'START', label: '시작', sortOrder: 2 },
    { codeGroup: 'GPS_EVENT', code: 'END', label: '종료', sortOrder: 3 },
    { codeGroup: 'GPS_EVENT', code: 'LEAVE', label: '출발', sortOrder: 4 },
    { codeGroup: 'GPS_EVENT', code: 'WAIT', label: '대기', sortOrder: 5 },
    { codeGroup: 'GPS_EVENT', code: 'SUSPEND', label: '일시중지', sortOrder: 6 },
    { codeGroup: 'GPS_EVENT', code: 'REARRIVE', label: '재도착', sortOrder: 7 },

    // DOC_CATEGORY
    { codeGroup: 'DOC_CATEGORY', code: 'INSURANCE', label: '보험', sortOrder: 1 },
    { codeGroup: 'DOC_CATEGORY', code: 'REGISTRATION', label: '등록증', sortOrder: 2 },
    { codeGroup: 'DOC_CATEGORY', code: 'LICENSE', label: '면허', sortOrder: 3 },
    { codeGroup: 'DOC_CATEGORY', code: 'EDU_CERT', label: '교육확인서', sortOrder: 4 },
    { codeGroup: 'DOC_CATEGORY', code: 'BIZ_LICENSE', label: '사업자등록증', sortOrder: 5 },
    { codeGroup: 'DOC_CATEGORY', code: 'REG_LEDGER', label: '등록원부', sortOrder: 6 },

    // BILLING_STATUS
    { codeGroup: 'BILLING_STATUS', code: 'CREATED', label: '생성', sortOrder: 1 },
    { codeGroup: 'BILLING_STATUS', code: 'COMPLETED', label: '완료', sortOrder: 2 },
    { codeGroup: 'BILLING_STATUS', code: 'CANCELLED', label: '취소', sortOrder: 3 },

    // PAYMENT_STATUS
    { codeGroup: 'PAYMENT_STATUS', code: 'CREATED', label: '생성', sortOrder: 1 },
    { codeGroup: 'PAYMENT_STATUS', code: 'COMPLETED', label: '완료', sortOrder: 2 },
    { codeGroup: 'PAYMENT_STATUS', code: 'FAILED', label: '실패', sortOrder: 3 },
    { codeGroup: 'PAYMENT_STATUS', code: 'CANCELLED', label: '취소', sortOrder: 4 },

    // SETTLEMENT_MODE
    { codeGroup: 'SETTLEMENT_MODE', code: 'STANDARD', label: '스탠다드', sortOrder: 1 },
    { codeGroup: 'SETTLEMENT_MODE', code: 'AXIS', label: 'AXIS', sortOrder: 2 },

    // DISMANTLE_TYPE
    { codeGroup: 'DISMANTLE_TYPE', code: 'FULL', label: '전체', sortOrder: 1 },
    { codeGroup: 'DISMANTLE_TYPE', code: 'PARTIAL', label: '부분', sortOrder: 2 },

    // DISMANTLE_STATUS
    { codeGroup: 'DISMANTLE_STATUS', code: 'REQUESTED', label: '요청됨', sortOrder: 1 },
    { codeGroup: 'DISMANTLE_STATUS', code: 'IN_PROGRESS', label: '진행중', sortOrder: 2 },
    { codeGroup: 'DISMANTLE_STATUS', code: 'CANDIDATE', label: '완료후보', sortOrder: 3 },
    { codeGroup: 'DISMANTLE_STATUS', code: 'COMPLETED', label: '완료', sortOrder: 4 },

    // BUYBACK_STATUS
    { codeGroup: 'BUYBACK_STATUS', code: 'SCHEDULED', label: '예정', sortOrder: 1 },
    { codeGroup: 'BUYBACK_STATUS', code: 'IN_PROGRESS', label: '진행중', sortOrder: 2 },
    { codeGroup: 'BUYBACK_STATUS', code: 'COMPLETED', label: '완료', sortOrder: 3 },

    // RENTAL_STATUS
    { codeGroup: 'RENTAL_STATUS', code: 'NEGOTIATING', label: '협의중', sortOrder: 1 },
    { codeGroup: 'RENTAL_STATUS', code: 'ACTIVE', label: '진행중', sortOrder: 2 },
    { codeGroup: 'RENTAL_STATUS', code: 'ENDED', label: '종료', sortOrder: 3 },

    // SAFETY_ROLE
    { codeGroup: 'SAFETY_ROLE', code: 'CHIEF', label: '안전총괄책임자', sortOrder: 1 },
    { codeGroup: 'SAFETY_ROLE', code: 'FIELD', label: '분야별안전담당', sortOrder: 2 },
    { codeGroup: 'SAFETY_ROLE', code: 'MANAGER', label: '안전관리자', sortOrder: 3 },
    { codeGroup: 'SAFETY_ROLE', code: 'OFFICER', label: '안전담당자', sortOrder: 4 },
    { codeGroup: 'SAFETY_ROLE', code: 'SUPERVISOR', label: '관리감독자', sortOrder: 5 },

    // MATERIAL_CATEGORY
    { codeGroup: 'MATERIAL_CATEGORY', code: 'PANEL', label: '판넬', sortOrder: 1 },
    { codeGroup: 'MATERIAL_CATEGORY', code: 'PIPE', label: '파이프', sortOrder: 2 },
    { codeGroup: 'MATERIAL_CATEGORY', code: 'HBEAM', label: 'H빔', sortOrder: 3 },
    { codeGroup: 'MATERIAL_CATEGORY', code: 'ACCESSORY', label: '부자재', sortOrder: 4 },

    // DESIGN_CHANGE_STATUS
    { codeGroup: 'DESIGN_CHANGE_STATUS', code: 'WAITING', label: '대기', sortOrder: 1 },
    { codeGroup: 'DESIGN_CHANGE_STATUS', code: 'ACCEPTED', label: '수락', sortOrder: 2 },
    { codeGroup: 'DESIGN_CHANGE_STATUS', code: 'REJECTED', label: '미수락', sortOrder: 3 },
    { codeGroup: 'DESIGN_CHANGE_STATUS', code: 'AUTO_CONFIRMED', label: '무응답자동확정', sortOrder: 4 },

    // WORKER_TYPE
    { codeGroup: 'WORKER_TYPE', code: 'DAILY', label: '일용직', sortOrder: 1 },
    { codeGroup: 'WORKER_TYPE', code: 'TEMP_WEEK', label: '기간제(1주이하)', sortOrder: 2 },
    { codeGroup: 'WORKER_TYPE', code: 'TEMP_MONTH', label: '기간제(1월이하)', sortOrder: 3 },
    { codeGroup: 'WORKER_TYPE', code: 'PERMANENT', label: '상용직', sortOrder: 4 },
    { codeGroup: 'WORKER_TYPE', code: 'SUPERVISOR', label: '관리감독자', sortOrder: 5 },

    // CREW_TYPE
    { codeGroup: 'CREW_TYPE', code: 'STANDARD', label: '스탠다드', sortOrder: 1 },
    { codeGroup: 'CREW_TYPE', code: 'AXIS', label: 'AXIS', sortOrder: 2 },

    // RECORD_LEVEL
    { codeGroup: 'RECORD_LEVEL', code: 'MINIMUM', label: '최소', sortOrder: 1 },
    { codeGroup: 'RECORD_LEVEL', code: 'FULL', label: '전체', sortOrder: 2 },

    // AXIS_STATUS
    { codeGroup: 'AXIS_STATUS', code: 'READY', label: 'READY', sortOrder: 1 },
    { codeGroup: 'AXIS_STATUS', code: 'PARTIAL', label: 'PARTIAL', sortOrder: 2 },
    { codeGroup: 'AXIS_STATUS', code: 'UNREADY', label: 'UNREADY', sortOrder: 3 },

    // COPY_METHOD
    { codeGroup: 'COPY_METHOD', code: 'SMS', label: 'SMS', sortOrder: 1 },
    { codeGroup: 'COPY_METHOD', code: 'KAKAO', label: '카카오', sortOrder: 2 },
    { codeGroup: 'COPY_METHOD', code: 'EMAIL', label: '이메일', sortOrder: 3 },
    { codeGroup: 'COPY_METHOD', code: 'MANUAL', label: '현장수기', sortOrder: 4 },

    // WORKER_REG_STATUS
    { codeGroup: 'WORKER_REG_STATUS', code: 'VERIFIED', label: '확인완료', sortOrder: 1 },
    { codeGroup: 'WORKER_REG_STATUS', code: 'SELF_REPORTED', label: '자가보고', sortOrder: 2 },
    { codeGroup: 'WORKER_REG_STATUS', code: 'NONE', label: '미등록', sortOrder: 3 },

    // INSURANCE_STATUS
    { codeGroup: 'INSURANCE_STATUS', code: 'VERIFIED', label: '확인완료', sortOrder: 1 },
    { codeGroup: 'INSURANCE_STATUS', code: 'EXPIRED', label: '만료', sortOrder: 2 },
    { codeGroup: 'INSURANCE_STATUS', code: 'NONE', label: '미등록', sortOrder: 3 },

    // CALL_STATUS
    { codeGroup: 'CALL_STATUS', code: 'CALLING', label: '호출중', sortOrder: 1 },
    { codeGroup: 'CALL_STATUS', code: 'ACCEPTED', label: '수락', sortOrder: 2 },
    { codeGroup: 'CALL_STATUS', code: 'REJECTED', label: '거절', sortOrder: 3 },
    { codeGroup: 'CALL_STATUS', code: 'TIMEOUT', label: '시간초과', sortOrder: 4 },
    { codeGroup: 'CALL_STATUS', code: 'CANCELLED', label: '취소', sortOrder: 5 },
  ];

  console.log(`CodeMaster: inserting ${codes.length} codes ...`);
  await prisma.codeMaster.createMany({
    data: codes,
    skipDuplicates: true,
  });
  console.log('CodeMaster: done.');

  // ═══════════════════════════════════════════
  // 2. SystemConfig (policy constants)
  // ═══════════════════════════════════════════
  const configs = [
    { configKey: 'MGMT_FEE_PCT', configValue: '0.15', description: '명목관리비율 15%' },
    { configKey: 'REBATE_PCT', configValue: '0.05', description: '월말환급율 5%' },
    { configKey: 'BURDEN_PCT', configValue: '0.10', description: '실부담율 10%' },
    { configKey: 'DESIGN_CHANGE_RESPONSE_DAYS', configValue: '3', description: '설계변경응답기한 (일)' },
    { configKey: 'INSTALL_CONFIRM_DAYS', configValue: '3', description: '설치확인텀 (일)' },
    { configKey: 'AMOUNT_UNIT', configValue: '원(정수)', description: '금액단위' },
    { configKey: 'TIME_FORMAT', configValue: 'yyyy-mm-dd', description: '시간형식' },
    { configKey: 'BB_DEFAULT_MONTHS', configValue: '6', description: 'BB 기본 개월수' },
    { configKey: 'SEAL_AUTHORITY', configValue: 'SERVER_ONLY', description: '잠금ID는 서버만 발급' },
    { configKey: 'GATE_CANON_VERSION', configValue: 'v6', description: '게이트 캐논 버전' },
    { configKey: 'MASTER_VERSION', configValue: 'v2.9', description: '마스터 설계서 버전' },
  ];

  console.log(`SystemConfig: upserting ${configs.length} entries ...`);
  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { configKey: cfg.configKey },
      update: { configValue: cfg.configValue, description: cfg.description },
      create: cfg,
    });
  }
  console.log('SystemConfig: done.');

  // ═══════════════════════════════════════════
  // 3. PartyDocRequirement (갑/을/병 required docs)
  // ═══════════════════════════════════════════
  const docRequirements: Array<{
    partyRole: string;
    docCategory: string;
    isRequired: boolean;
    description: string;
    legalBasis?: string;
    sortOrder: number;
  }> = [
    // 갑 (발주처)
    { partyRole: '갑', docCategory: '사업자등록증', isRequired: true, description: '발주처 사업자등록증', sortOrder: 1 },
    { partyRole: '갑', docCategory: '보험', isRequired: false, description: '발주처 보험증권 (선택)', sortOrder: 2 },

    // 을 (하도급사)
    { partyRole: '을', docCategory: '사업자등록증', isRequired: true, description: '하도급사 사업자등록증', sortOrder: 1 },
    { partyRole: '을', docCategory: '보험', isRequired: true, description: '시공보험 증권 (필수)', legalBasis: '건설산업기본법', sortOrder: 2 },
    { partyRole: '을', docCategory: '등록증', isRequired: true, description: '건설업 등록증', sortOrder: 3 },
    { partyRole: '을', docCategory: '등록원부', isRequired: true, description: '건설업 등록원부', sortOrder: 4 },
    { partyRole: '을', docCategory: '면허', isRequired: false, description: '관련 면허 (해당시)', sortOrder: 5 },
    { partyRole: '을', docCategory: '교육확인서', isRequired: false, description: '안전교육 확인서 (선택)', sortOrder: 6 },

    // 병 (시공팀/장비기사)
    { partyRole: '병', docCategory: '면허', isRequired: true, description: '조종사면허/기능사 자격증', legalBasis: '건설기계관리법', sortOrder: 1 },
    { partyRole: '병', docCategory: '교육확인서', isRequired: true, description: '기초안전보건교육 이수증', legalBasis: '산안법\u00A731', sortOrder: 2 },
    { partyRole: '병', docCategory: '보험', isRequired: true, description: '산재보험 가입증명', legalBasis: '산재보험법', sortOrder: 3 },
    { partyRole: '병', docCategory: '등록증', isRequired: false, description: '건설기계 등록증 (장비보유시)', sortOrder: 4 },
  ];

  console.log(`PartyDocRequirement: upserting ${docRequirements.length} entries ...`);
  for (const doc of docRequirements) {
    await prisma.partyDocRequirement.upsert({
      where: {
        partyRole_docCategory: {
          partyRole: doc.partyRole,
          docCategory: doc.docCategory,
        },
      },
      update: {
        isRequired: doc.isRequired,
        description: doc.description,
        legalBasis: doc.legalBasis ?? null,
        sortOrder: doc.sortOrder,
      },
      create: doc,
    });
  }
  console.log('PartyDocRequirement: done.');

  // ═══════════════════════════════════════════
  // 4. EducationRequirement (14 preset rows)
  //    산안법 기반 안전교육 의무시간
  // ═══════════════════════════════════════════
  const eduRequirements = [
    // 일용직(일일)
    { workerType: '일용직일일', eduType: 'SE_HIRE', requiredMinutes: 60, requiredHours: 1, cycle: '채용시', legalBasis: '산안법\u00A731' },
    // 기간제(1주이하)
    { workerType: '기간제1주이하', eduType: 'SE_HIRE', requiredMinutes: 60, requiredHours: 1, cycle: '채용시', legalBasis: '산안법\u00A731' },
    // 기간제(1월이하)
    { workerType: '기간제1월이하', eduType: 'SE_HIRE', requiredMinutes: 120, requiredHours: 2, cycle: '채용시', legalBasis: '산안법\u00A731' },
    // 상용직
    { workerType: '상용직', eduType: 'SE_HIRE', requiredMinutes: 480, requiredHours: 8, cycle: '채용시', legalBasis: '산안법\u00A731' },
    { workerType: '상용직', eduType: 'SE_CHANGE', requiredMinutes: 120, requiredHours: 2, cycle: '변경시', legalBasis: '산안법\u00A731' },
    { workerType: '상용직', eduType: 'SE_SPECIAL', requiredMinutes: 960, requiredHours: 16, cycle: '특별', legalBasis: '산안법\u00A731' },
    { workerType: '상용직', eduType: 'SE_REGULAR', requiredMinutes: 360, requiredHours: 6, cycle: '분기', legalBasis: '산안법\u00A731' },
    // 관리감독자
    { workerType: '관리감독자', eduType: 'SE_HIRE', requiredMinutes: 480, requiredHours: 8, cycle: '채용시', legalBasis: '산안법\u00A731' },
    { workerType: '관리감독자', eduType: 'SE_SUPER', requiredMinutes: 960, requiredHours: 16, cycle: '연간', legalBasis: '산안법\u00A731' },
    { workerType: '관리감독자', eduType: 'SE_REGULAR', requiredMinutes: 360, requiredHours: 6, cycle: '분기', legalBasis: '산안법\u00A731' },
    // 기초안전보건교육 (all worker types)
    { workerType: '일용직일일', eduType: 'SE_BASIC', requiredMinutes: 240, requiredHours: 4, cycle: '최초1회', legalBasis: '산안법\u00A731\u2461' },
    { workerType: '기간제1주이하', eduType: 'SE_BASIC', requiredMinutes: 240, requiredHours: 4, cycle: '최초1회', legalBasis: '산안법\u00A731\u2461' },
    { workerType: '기간제1월이하', eduType: 'SE_BASIC', requiredMinutes: 240, requiredHours: 4, cycle: '최초1회', legalBasis: '산안법\u00A731\u2461' },
    { workerType: '상용직', eduType: 'SE_BASIC', requiredMinutes: 240, requiredHours: 4, cycle: '최초1회', legalBasis: '산안법\u00A731\u2461' },
  ];

  console.log(`EducationRequirement: upserting ${eduRequirements.length} entries ...`);
  for (const edu of eduRequirements) {
    await prisma.educationRequirement.upsert({
      where: {
        workerType_eduType: {
          workerType: edu.workerType,
          eduType: edu.eduType,
        },
      },
      update: {
        requiredMinutes: edu.requiredMinutes,
        requiredHours: edu.requiredHours,
        cycle: edu.cycle,
        legalBasis: edu.legalBasis,
      },
      create: edu,
    });
  }
  console.log('EducationRequirement: done.');

  console.log('Seed completed successfully (AXIS master design v2.9).');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
