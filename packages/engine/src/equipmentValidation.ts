// ============================================================
// AXIS Platform - Equipment Deployment 13-Item Validation Engine
// ============================================================

export interface ValidationItem {
  id: number;
  name: string;
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  reason?: string;
}

export interface EquipmentContext {
  inspectionExpiry?: Date;
  durabilityDate?: Date;
  hasRegistration?: boolean;
  hasInsurance?: boolean;
  operatorLicenseValid?: boolean;
  specialEducation?: boolean;
  basicSafetyEducation?: boolean;
  operatorSafetyEducation?: boolean;
  specialWorkerEducation?: boolean;
  supervisorAssigned?: boolean;
  guiderAssigned?: boolean;
  preSurveySealId?: string;
  safetyCheckPassed?: boolean;
}

interface ValidationRule {
  id: number;
  name: string;
  check: (ctx: EquipmentContext, now: Date) => { status: 'PASS' | 'FAIL' | 'UNKNOWN'; reason?: string };
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 1,
    name: '정기검사 유효기간',
    check: (ctx, now) => {
      if (ctx.inspectionExpiry == null) return { status: 'UNKNOWN', reason: '정기검사 만료일 정보 없음' };
      return ctx.inspectionExpiry > now
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '정기검사 유효기간이 만료되었습니다.' };
    },
  },
  {
    id: 2,
    name: '내구연한 확인',
    check: (ctx, now) => {
      if (ctx.durabilityDate == null) return { status: 'UNKNOWN', reason: '내구연한 정보 없음' };
      return ctx.durabilityDate > now
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '내구연한이 초과되었습니다.' };
    },
  },
  {
    id: 3,
    name: '장비등록증 보유',
    check: (ctx) => {
      if (ctx.hasRegistration == null) return { status: 'UNKNOWN', reason: '장비등록증 정보 없음' };
      return ctx.hasRegistration
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '장비등록증이 없습니다.' };
    },
  },
  {
    id: 4,
    name: '보험 가입 확인',
    check: (ctx) => {
      if (ctx.hasInsurance == null) return { status: 'UNKNOWN', reason: '보험 가입 정보 없음' };
      return ctx.hasInsurance
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '보험이 미가입 상태입니다.' };
    },
  },
  {
    id: 5,
    name: '조종사 면허 유효',
    check: (ctx) => {
      if (ctx.operatorLicenseValid == null) return { status: 'UNKNOWN', reason: '면허 정보 없음' };
      return ctx.operatorLicenseValid
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '조종사 면허가 유효하지 않습니다.' };
    },
  },
  {
    id: 6,
    name: '특별교육 이수',
    check: (ctx) => {
      if (ctx.specialEducation == null) return { status: 'UNKNOWN', reason: '특별교육 이수 정보 없음' };
      return ctx.specialEducation
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '특별교육 미이수 상태입니다.' };
    },
  },
  {
    id: 7,
    name: '기초안전보건교육 이수',
    check: (ctx) => {
      if (ctx.basicSafetyEducation == null) return { status: 'UNKNOWN', reason: '기초안전보건교육 정보 없음' };
      return ctx.basicSafetyEducation
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '기초안전보건교육 미이수 상태입니다.' };
    },
  },
  {
    id: 8,
    name: '조종사 안전교육 이수',
    check: (ctx) => {
      if (ctx.operatorSafetyEducation == null) return { status: 'UNKNOWN', reason: '조종사 안전교육 정보 없음' };
      return ctx.operatorSafetyEducation
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '조종사 안전교육 미이수 상태입니다.' };
    },
  },
  {
    id: 9,
    name: '특수형태근로종사자 교육',
    check: (ctx) => {
      if (ctx.specialWorkerEducation == null) return { status: 'UNKNOWN', reason: '특수형태근로종사자 교육 정보 없음' };
      return ctx.specialWorkerEducation
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '특수형태근로종사자 교육 미이수 상태입니다.' };
    },
  },
  {
    id: 10,
    name: '관리감독자 배치',
    check: (ctx) => {
      if (ctx.supervisorAssigned == null) return { status: 'UNKNOWN', reason: '관리감독자 배치 정보 없음' };
      return ctx.supervisorAssigned
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '관리감독자가 배치되지 않았습니다.' };
    },
  },
  {
    id: 11,
    name: '유도자 배치',
    check: (ctx) => {
      if (ctx.guiderAssigned == null) return { status: 'UNKNOWN', reason: '유도자 배치 정보 없음' };
      return ctx.guiderAssigned
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '유도자가 배치되지 않았습니다.' };
    },
  },
  {
    id: 12,
    name: '사전조사 봉인 완료',
    check: (ctx) => {
      if (ctx.preSurveySealId == null || ctx.preSurveySealId === '') {
        return { status: 'FAIL', reason: '사전조사 봉인이 완료되지 않았습니다.' };
      }
      return { status: 'PASS' };
    },
  },
  {
    id: 13,
    name: '안전점검 통과',
    check: (ctx) => {
      if (ctx.safetyCheckPassed == null) return { status: 'UNKNOWN', reason: '안전점검 결과 정보 없음' };
      return ctx.safetyCheckPassed
        ? { status: 'PASS' }
        : { status: 'FAIL', reason: '안전점검을 통과하지 못했습니다.' };
    },
  },
];

/**
 * Validate all 13 equipment deployment items.
 * ALL items must be PASS for the deployment to be allowed.
 * A single FAIL or UNKNOWN blocks deployment.
 */
export function validateEquipmentDeployment(
  ctx: EquipmentContext,
  now: Date = new Date(),
): { passed: boolean; items: ValidationItem[] } {
  const items: ValidationItem[] = VALIDATION_RULES.map((rule) => {
    const result = rule.check(ctx, now);
    return {
      id: rule.id,
      name: rule.name,
      status: result.status,
      reason: result.reason,
    };
  });

  const passed = items.every((item) => item.status === 'PASS');

  return { passed, items };
}
