// ============================================================
// AXIS Platform - Education Compliance Engine
// Based on 58_안전교육의무시간기준
// ============================================================

export interface EducationRequirement {
  workerType: string;
  eduType: string;
  requiredMinutes: number;
  cycle: string;
}

export interface CompletedEducation {
  eduType: string;
  completedMinutes: number;
}

export interface EducationGap {
  eduType: string;
  required: number;
  completed: number;
}

export interface ComplianceResult {
  status: '충족' | '미충족';
  gaps: EducationGap[];
}

/** 14 preset education requirements per worker type */
export const EDUCATION_REQUIREMENTS: EducationRequirement[] = [
  // 신규채용자
  { workerType: '신규채용자', eduType: '기초안전보건교육', requiredMinutes: 240, cycle: '1회성' },
  { workerType: '신규채용자', eduType: '채용시교육', requiredMinutes: 480, cycle: '1회성' },

  // 일용근로자
  { workerType: '일용근로자', eduType: '채용시교육', requiredMinutes: 60, cycle: '매일' },
  { workerType: '일용근로자', eduType: '기초안전보건교육', requiredMinutes: 240, cycle: '1회성' },

  // 관리감독자
  { workerType: '관리감독자', eduType: '정기교육', requiredMinutes: 960, cycle: '연간' },
  { workerType: '관리감독자', eduType: '채용시교육', requiredMinutes: 480, cycle: '1회성' },

  // 건설기계조종사
  { workerType: '건설기계조종사', eduType: '기초안전보건교육', requiredMinutes: 240, cycle: '1회성' },
  { workerType: '건설기계조종사', eduType: '건설기계조종사안전교육', requiredMinutes: 180, cycle: '매반기' },
  { workerType: '건설기계조종사', eduType: '특별교육', requiredMinutes: 960, cycle: '1회성' },

  // 특수형태근로종사자
  { workerType: '특수형태근로종사자', eduType: '특수형태교육', requiredMinutes: 120, cycle: '1회성' },
  { workerType: '특수형태근로종사자', eduType: '기초안전보건교육', requiredMinutes: 240, cycle: '1회성' },

  // 작업내용변경자
  { workerType: '작업내용변경자', eduType: '작업내용변경시교육', requiredMinutes: 120, cycle: '변경시' },

  // 유해위험작업자
  { workerType: '유해위험작업자', eduType: '특별교육', requiredMinutes: 960, cycle: '1회성' },
  { workerType: '유해위험작업자', eduType: '특별교육_단기', requiredMinutes: 120, cycle: '변경시' },
];

/**
 * Check whether a worker meets all education compliance requirements
 * for their worker type.
 *
 * @param workerType - The type of worker (e.g. '신규채용자', '일용근로자')
 * @param completedEducations - List of completed education records
 * @returns Compliance result with status and any gaps
 */
export function checkEducationCompliance(
  workerType: string,
  completedEducations: CompletedEducation[],
): ComplianceResult {
  // Find all requirements for this worker type
  const requirements = EDUCATION_REQUIREMENTS.filter(
    (r) => r.workerType === workerType,
  );

  // If no requirements found for the worker type, they are compliant
  if (requirements.length === 0) {
    return { status: '충족', gaps: [] };
  }

  // Build a lookup of completed minutes by education type
  const completedMap = new Map<string, number>();
  for (const edu of completedEducations) {
    const current = completedMap.get(edu.eduType) ?? 0;
    completedMap.set(edu.eduType, current + edu.completedMinutes);
  }

  const gaps: EducationGap[] = [];

  for (const req of requirements) {
    const completed = completedMap.get(req.eduType) ?? 0;
    if (completed < req.requiredMinutes) {
      gaps.push({
        eduType: req.eduType,
        required: req.requiredMinutes,
        completed,
      });
    }
  }

  return {
    status: gaps.length === 0 ? '충족' : '미충족',
    gaps,
  };
}
