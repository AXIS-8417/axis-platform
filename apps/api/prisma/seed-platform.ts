import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CODE_MASTER = [
  // PARTY_ROLE
  { codeGroup:'PARTY_ROLE', code:'GAP', label:'갑(발주자)', sortOrder:1 },
  { codeGroup:'PARTY_ROLE', code:'EUL', label:'을(시공사)', sortOrder:2 },
  { codeGroup:'PARTY_ROLE', code:'BYEONG', label:'병(작업팀)', sortOrder:3 },
  // STATE_COMMON
  { codeGroup:'STATE_COMMON', code:'CREATED', label:'지시생성', sortOrder:1 },
  { codeGroup:'STATE_COMMON', code:'CALLING', label:'호출중', sortOrder:2 },
  { codeGroup:'STATE_COMMON', code:'MATCHED', label:'매칭완료', sortOrder:3 },
  { codeGroup:'STATE_COMMON', code:'STANDBY', label:'작업대기', sortOrder:4 },
  { codeGroup:'STATE_COMMON', code:'WORKING', label:'작업중', sortOrder:5 },
  { codeGroup:'STATE_COMMON', code:'WORK_DONE', label:'작업완료', sortOrder:6 },
  { codeGroup:'STATE_COMMON', code:'REPORT_DONE', label:'일보입력완료', sortOrder:7 },
  { codeGroup:'STATE_COMMON', code:'SETTLE_WAIT', label:'정산대기', sortOrder:8 },
  { codeGroup:'STATE_COMMON', code:'SETTLE_DONE', label:'정산완료', sortOrder:9 },
  { codeGroup:'STATE_COMMON', code:'SEALED', label:'봉인완료', sortOrder:10 },
  // WORK_TYPE
  { codeGroup:'WORK_TYPE', code:'INSTALL', label:'설치', sortOrder:1 },
  { codeGroup:'WORK_TYPE', code:'REMOVE', label:'해체', sortOrder:2 },
  { codeGroup:'WORK_TYPE', code:'REPAIR', label:'보수', sortOrder:3 },
  // FRAME_TYPE
  { codeGroup:'FRAME_TYPE', code:'H_BEAM', label:'H빔', sortOrder:1 },
  { codeGroup:'FRAME_TYPE', code:'PIPE', label:'파이프', sortOrder:2 },
  // PANEL_TYPE
  { codeGroup:'PANEL_TYPE', code:'EGI', label:'EGI', sortOrder:1 },
  { codeGroup:'PANEL_TYPE', code:'RPP', label:'RPP', sortOrder:2 },
  { codeGroup:'PANEL_TYPE', code:'STEEL', label:'스틸', sortOrder:3 },
  { codeGroup:'PANEL_TYPE', code:'ETC', label:'기타', sortOrder:4 },
  // CONTRACT_TYPE
  { codeGroup:'CONTRACT_TYPE', code:'BUYBACK', label:'바이백', sortOrder:1 },
  { codeGroup:'CONTRACT_TYPE', code:'PURCHASE', label:'구매', sortOrder:2 },
  { codeGroup:'CONTRACT_TYPE', code:'MONTHLY', label:'월임대', sortOrder:3 },
  // ASSIGN_METHOD
  { codeGroup:'ASSIGN_METHOD', code:'NORMAL', label:'일반배정', sortOrder:1 },
  { codeGroup:'ASSIGN_METHOD', code:'SAFE', label:'안심배정', sortOrder:2 },
  // CREW_TYPE
  { codeGroup:'CREW_TYPE', code:'STANDARD', label:'STANDARD', sortOrder:1 },
  { codeGroup:'CREW_TYPE', code:'AXIS', label:'AXIS', sortOrder:2 },
  // RISK_GRADE
  ...['R0','R1','R2','R3','R4','R5'].map((c,i) => ({ codeGroup:'RISK_GRADE', code:c, label:c, sortOrder:i+1 })),
  // PAY_METHOD
  { codeGroup:'PAY_METHOD', code:'IMMEDIATE', label:'바로지급', sortOrder:1 },
  { codeGroup:'PAY_METHOD', code:'FIRST_HALF', label:'1~15일', sortOrder:2 },
  { codeGroup:'PAY_METHOD', code:'SECOND_HALF', label:'16~말일', sortOrder:3 },
  // SEAL_TYPE
  { codeGroup:'SEAL_TYPE', code:'SINGLE_SEAL', label:'단독잠금', sortOrder:1 },
  { codeGroup:'SEAL_TYPE', code:'MUTUAL_SEAL', label:'상호잠금', sortOrder:2 },
  { codeGroup:'SEAL_TYPE', code:'AUTO_SEAL', label:'자동잠금', sortOrder:3 },
  // SEAL_AXIS
  { codeGroup:'SEAL_AXIS', code:'CONSTRUCTION', label:'시공', sortOrder:1 },
  { codeGroup:'SEAL_AXIS', code:'EQUIPMENT', label:'장비', sortOrder:2 },
  { codeGroup:'SEAL_AXIS', code:'FREIGHT', label:'화물', sortOrder:3 },
  { codeGroup:'SEAL_AXIS', code:'GATE', label:'게이트', sortOrder:4 },
  // FOUNDATION_TYPE
  { codeGroup:'FOUNDATION_TYPE', code:'EMBED', label:'근입', sortOrder:1 },
  { codeGroup:'FOUNDATION_TYPE', code:'BASEPLATE', label:'베이스판', sortOrder:2 },
  { codeGroup:'FOUNDATION_TYPE', code:'DIRECT', label:'직타', sortOrder:3 },
  // POST_ANGLE
  { codeGroup:'POST_ANGLE', code:'RIGHT', label:'직각', sortOrder:1 },
  { codeGroup:'POST_ANGLE', code:'INCLINE', label:'경사', sortOrder:2 },
  { codeGroup:'POST_ANGLE', code:'MIXED', label:'혼합', sortOrder:3 },
  // INSURANCE_TYPE
  ...['산재보험','고용보험','일반배상','전문배상','퇴직공제'].map((c,i) => ({ codeGroup:'INSURANCE_TYPE', code:c, label:c, sortOrder:i+1 })),
  // SAFETY_CHECK_RESULT
  { codeGroup:'SAFETY_CHECK_RESULT', code:'PASS', label:'통과', sortOrder:1 },
  { codeGroup:'SAFETY_CHECK_RESULT', code:'FAIL', label:'미통과', sortOrder:2 },
  // CHECK_CYCLE
  ...['일일','주간','월간','분기','반기','정밀'].map((c,i) => ({ codeGroup:'CHECK_CYCLE', code:c, label:c, sortOrder:i+1 })),
  // SEASON_TYPE
  ...['일반','해빙기','장마','태풍','동절기'].map((c,i) => ({ codeGroup:'SEASON_TYPE', code:c, label:c, sortOrder:i+1 })),
  // ACTION_STATUS
  ...['해당없음','미조치','조치완료','확인완료'].map((c,i) => ({ codeGroup:'ACTION_STATUS', code:c, label:c, sortOrder:i+1 })),
  // SAFETY_ROLE
  { codeGroup:'SAFETY_ROLE', code:'SR_TOTAL', label:'안전보건총괄책임자', sortOrder:1 },
  { codeGroup:'SAFETY_ROLE', code:'SR_MANAGE', label:'안전보건관리책임자', sortOrder:2 },
  { codeGroup:'SAFETY_ROLE', code:'SR_FIRE', label:'소방안전관리자', sortOrder:3 },
  { codeGroup:'SAFETY_ROLE', code:'SR_HEALTH', label:'보건관리자', sortOrder:4 },
  { codeGroup:'SAFETY_ROLE', code:'SR_SUPER', label:'관리감독자', sortOrder:5 },
  // SIGN_ROUTE
  ...['정회원','간편대면','간편원격','소개소경유'].map((c,i) => ({ codeGroup:'SIGN_ROUTE', code:c, label:c, sortOrder:i+1 })),
  // WORKER_TYPE
  ...['프리랜서','일용직','상용직','관리감독자'].map((c,i) => ({ codeGroup:'WORKER_TYPE', code:c, label:c, sortOrder:i+1 })),
  // TAX_TYPE
  { codeGroup:'TAX_TYPE', code:'TX_33', label:'3.3% 원천징수', sortOrder:1 },
  { codeGroup:'TAX_TYPE', code:'TX_DAILY', label:'일용근로소득', sortOrder:2 },
  { codeGroup:'TAX_TYPE', code:'TX_AGENCY', label:'인력사무소경유', sortOrder:3 },
  { codeGroup:'TAX_TYPE', code:'TX_WAGE', label:'급여소득', sortOrder:4 },
  // LICENSE_TYPE
  ...['굴착기','로더','지게차','크레인','불도저','로울러','항타및항발기','기중기','덤프트럭','기타'].map((c,i) => ({ codeGroup:'LICENSE_TYPE', code:c, label:c, sortOrder:i+1 })),
  // POUR_METHOD
  ...['직타','직타_깔때기','버킷_표준','버킷_원거리'].map((c,i) => ({ codeGroup:'POUR_METHOD', code:c, label:c, sortOrder:i+1 })),
  // GROUND_TYPE
  ...['점성토','사질토_표준','사질토_불량','자갈층','연약지반'].map((c,i) => ({ codeGroup:'GROUND_TYPE', code:c, label:c, sortOrder:i+1 })),
  // CHLORIDE_GRADE
  { codeGroup:'CHLORIDE_GRADE', code:'GREEN', label:'적합(≤0.25)', sortOrder:1 },
  { codeGroup:'CHLORIDE_GRADE', code:'YELLOW', label:'주의(0.26~0.30)', sortOrder:2 },
  { codeGroup:'CHLORIDE_GRADE', code:'RED', label:'부적합(>0.30)', sortOrder:3 },
  // TRANSPORT_GRADE
  { codeGroup:'TRANSPORT_GRADE', code:'OK', label:'적합', sortOrder:1 },
  { codeGroup:'TRANSPORT_GRADE', code:'FLAG', label:'FLAG(>60분)', sortOrder:2 },
  // CURING_MODE
  ...['여름','간절기','한중'].map((c,i) => ({ codeGroup:'CURING_MODE', code:c, label:c, sortOrder:i+1 })),
  // PLAN_TYPE
  { codeGroup:'PLAN_TYPE', code:'NONE', label:'무료', sortOrder:1 },
  { codeGroup:'PLAN_TYPE', code:'STANDARD', label:'스탠다드(₩49,000)', sortOrder:2 },
  { codeGroup:'PLAN_TYPE', code:'AXIS', label:'AXIS(₩99,000)', sortOrder:3 },
  // INCIDENT_TYPE
  ...['사고','아차사고','직업병','기타'].map((c,i) => ({ codeGroup:'INCIDENT_TYPE', code:c, label:c, sortOrder:i+1 })),
  // SEVERITY
  ...['경미','보통','중대','치명'].map((c,i) => ({ codeGroup:'SEVERITY', code:c, label:c, sortOrder:i+1 })),
  // EDU_TYPE
  ...['기초안전보건교육','채용시교육','작업내용변경시교육','특별교육','정기교육','건설기계조종사안전교육','특수형태교육'].map((c,i) => ({ codeGroup:'EDU_TYPE', code:c, label:c, sortOrder:i+1 })),
  // RISK_STATUS
  ...['NORMAL','WATCH','REINFORCED','PROTECTED'].map((c,i) => ({ codeGroup:'RISK_STATUS', code:c, label:c, sortOrder:i+1 })),
  // BILLING_STATUS
  ...['청구생성','승인대기','결제완료','취소'].map((c,i) => ({ codeGroup:'BILLING_STATUS', code:c, label:c, sortOrder:i+1 })),
  // PAYMENT_STATUS
  ...['CREATED','COMPLETED','FAILED','CANCELLED'].map((c,i) => ({ codeGroup:'PAYMENT_STATUS', code:c, label:c, sortOrder:i+1 })),
  // CALL_STATUS
  ...['호출중','수락','거부','만료'].map((c,i) => ({ codeGroup:'CALL_STATUS', code:c, label:c, sortOrder:i+1 })),
  // DESIGN_CHANGE_STATUS
  ...['WAITING','ACCEPTED','DISAGREEMENT','EXPIRED'].map((c,i) => ({ codeGroup:'DESIGN_CHANGE_STATUS', code:c, label:c, sortOrder:i+1 })),
  // DOC_STATUS
  ...['유효','만료','미등록'].map((c,i) => ({ codeGroup:'DOC_STATUS', code:c, label:c, sortOrder:i+1 })),
  // GUIDER_SIGNAL
  ...['수신호','무선','기타'].map((c,i) => ({ codeGroup:'GUIDER_SIGNAL', code:c, label:c, sortOrder:i+1 })),
  // COPY_METHOD
  ...['SMS','카카오톡','이메일','현장수기'].map((c,i) => ({ codeGroup:'COPY_METHOD', code:c, label:c, sortOrder:i+1 })),
  // AUTH_METHOD
  ...['전화번호','카카오','PASS','외국인등록번호','미인증'].map((c,i) => ({ codeGroup:'AUTH_METHOD', code:c, label:c, sortOrder:i+1 })),
  // RECORD_LEVEL
  ...['기본','표준','고급'].map((c,i) => ({ codeGroup:'RECORD_LEVEL', code:c, label:c, sortOrder:i+1 })),
  // CHECK_TARGET_TYPE
  { codeGroup:'CHECK_TARGET_TYPE', code:'SITE', label:'현장', sortOrder:1 },
  { codeGroup:'CHECK_TARGET_TYPE', code:'EQUIP', label:'장비', sortOrder:2 },
  // WEATHER
  ...['맑음','흐림','비','눈','강풍'].map((c,i) => ({ codeGroup:'WEATHER', code:c, label:c, sortOrder:i+1 })),
  // EQUIP_TYPE
  ...['굴착기','크레인','지게차','로더','불도저','로울러','항타기','덤프트럭','스카이','기타'].map((c,i) => ({ codeGroup:'EQUIP_TYPE', code:c, label:c, sortOrder:i+1 })),
];

// 교육의무시간 14건 프리셋
const EDU_REQUIREMENTS = [
  { workerType:'신규채용자', eduType:'기초안전보건교육', requiredMinutes:240, requiredHours:4.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'신규채용자', eduType:'채용시교육', requiredMinutes:480, requiredHours:8.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'일용근로자', eduType:'채용시교육', requiredMinutes:60, requiredHours:1.0, cycle:'매일', legalBasis:'산안법시행규칙§26①' },
  { workerType:'일용근로자', eduType:'기초안전보건교육', requiredMinutes:240, requiredHours:4.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'관리감독자', eduType:'정기교육', requiredMinutes:960, requiredHours:16.0, cycle:'연간', legalBasis:'산안법시행규칙§26①' },
  { workerType:'관리감독자', eduType:'채용시교육', requiredMinutes:480, requiredHours:8.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'건설기계조종사', eduType:'기초안전보건교육', requiredMinutes:240, requiredHours:4.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'건설기계조종사', eduType:'건설기계조종사안전교육', requiredMinutes:180, requiredHours:3.0, cycle:'매반기', legalBasis:'산안법시행규칙§26①' },
  { workerType:'건설기계조종사', eduType:'특별교육', requiredMinutes:960, requiredHours:16.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'특수형태근로종사자', eduType:'특수형태교육', requiredMinutes:120, requiredHours:2.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'특수형태근로종사자', eduType:'기초안전보건교육', requiredMinutes:240, requiredHours:4.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'작업내용변경자', eduType:'작업내용변경시교육', requiredMinutes:120, requiredHours:2.0, cycle:'변경시', legalBasis:'산안법시행규칙§26①' },
  { workerType:'유해위험작업자', eduType:'특별교육', requiredMinutes:960, requiredHours:16.0, cycle:'1회성', legalBasis:'산안법시행규칙§26①' },
  { workerType:'유해위험작업자', eduType:'특별교육_단기', requiredMinutes:120, requiredHours:2.0, cycle:'변경시', legalBasis:'산안법시행규칙§26①' },
];

// 양생기간 마스터
const CURING_MASTER = [
  { concreteType:'보통콘크리트', cementType:'보통포틀랜드', tempRange:'≥15℃', curingDays:5, strengthPct:70 },
  { concreteType:'보통콘크리트', cementType:'보통포틀랜드', tempRange:'4~15℃', curingDays:7, strengthPct:70 },
  { concreteType:'보통콘크리트', cementType:'보통포틀랜드', tempRange:'≤4℃', curingDays:10, strengthPct:70 },
  { concreteType:'보통콘크리트', cementType:'조강포틀랜드', tempRange:'≥15℃', curingDays:3, strengthPct:70 },
  { concreteType:'보통콘크리트', cementType:'조강포틀랜드', tempRange:'4~15℃', curingDays:5, strengthPct:70 },
  { concreteType:'보통콘크리트', cementType:'조강포틀랜드', tempRange:'≤4℃', curingDays:7, strengthPct:70 },
  { concreteType:'고강도콘크리트', cementType:'보통포틀랜드', tempRange:'≥15℃', curingDays:7, strengthPct:80 },
  { concreteType:'고강도콘크리트', cementType:'보통포틀랜드', tempRange:'4~15℃', curingDays:10, strengthPct:80 },
  { concreteType:'고강도콘크리트', cementType:'보통포틀랜드', tempRange:'≤4℃', curingDays:14, strengthPct:80 },
];

async function main() {
  // 코드마스터 시드
  for (const c of CODE_MASTER) {
    await (prisma as any).codeMaster.upsert({
      where: { id: `${c.codeGroup}_${c.code}` },
      update: {},
      create: { id: `${c.codeGroup}_${c.code}`, ...c },
    });
  }
  console.log(`✅ 코드마스터 ${CODE_MASTER.length}건 시드 완료 (${new Set(CODE_MASTER.map(c=>c.codeGroup)).size}그룹)`);

  // 교육의무시간 프리셋
  for (const e of EDU_REQUIREMENTS) {
    await (prisma as any).educationRequirement.upsert({
      where: { workerType_eduType: { workerType: e.workerType, eduType: e.eduType } },
      update: {},
      create: e,
    });
  }
  console.log(`✅ 교육의무시간 ${EDU_REQUIREMENTS.length}건 시드 완료`);

  // 양생기간 마스터
  for (const c of CURING_MASTER) {
    await (prisma as any).curingMaster.create({ data: c }).catch(() => {});
  }
  console.log(`✅ 양생기간 ${CURING_MASTER.length}건 시드 완료`);

  // 시스템 설정
  const configs = [
    { configKey:'GPS_ARRIVAL_RADIUS', configValue:'100', description:'도착 판정 반경(m)' },
    { configKey:'GPS_DEPART_RADIUS', configValue:'200', description:'이탈 판정 반경(m)' },
    { configKey:'GPS_STAY_MIN', configValue:'3', description:'최소 체류 시간(분)' },
    { configKey:'GPS_AUTO_START', configValue:'5', description:'자동 시작 시간(분)' },
    { configKey:'GPS_ACCURACY_MAX', configValue:'50', description:'유효 GPS 오차(m)' },
    { configKey:'AUTO_CONFIRM_HOURS', configValue:'72', description:'자동전이 시간(h)' },
    { configKey:'SEAL_AUTO_TIMEOUT', configValue:'72', description:'봉인 자동잠금 시간(h)' },
  ];
  for (const c of configs) {
    await (prisma as any).systemConfig.upsert({
      where: { configKey: c.configKey },
      update: {},
      create: c,
    });
  }
  console.log(`✅ 시스템설정 ${configs.length}건 시드 완료`);
}

main().then(() => prisma.$disconnect());
