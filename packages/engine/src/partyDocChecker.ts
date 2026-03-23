// AXIS 주체 서류 완결성 체크 — 마스터 v2.9 시트 03, 26
// 갑/을/병별 필수서류 충족 여부 판정

export type PartyRole = '갑' | '을' | '병';
export type DocStatus = '미제출' | '심사중' | '승인' | '반려' | '만료';

export interface DocRequirement {
  docCategory: string;
  isRequired: boolean;
  description: string;
  legalBasis?: string;
}

export const DEFAULT_REQUIREMENTS: Record<PartyRole, DocRequirement[]> = {
  '갑': [
    { docCategory: '사업자등록증', isRequired: true, description: '발주처 사업자등록증' },
    { docCategory: '보험', isRequired: false, description: '발주처 보험증권 (선택)' },
  ],
  '을': [
    { docCategory: '사업자등록증', isRequired: true, description: '하도급사 사업자등록증' },
    { docCategory: '보험', isRequired: true, description: '시공보험 증권', legalBasis: '건설산업기본법' },
    { docCategory: '등록증', isRequired: true, description: '건설업 등록증' },
    { docCategory: '등록원부', isRequired: true, description: '건설업 등록원부' },
    { docCategory: '면허', isRequired: false, description: '관련 면허 (해당시)' },
    { docCategory: '교육확인서', isRequired: false, description: '안전교육 확인서' },
  ],
  '병': [
    { docCategory: '면허', isRequired: true, description: '조종사면허/기능사 자격증', legalBasis: '건설기계관리법' },
    { docCategory: '교육확인서', isRequired: true, description: '기초안전보건교육 이수증', legalBasis: '산안법§31' },
    { docCategory: '보험', isRequired: true, description: '산재보험 가입증명', legalBasis: '산재보험법' },
    { docCategory: '등록증', isRequired: false, description: '건설기계 등록증 (장비보유시)' },
  ],
};

export interface PartyDoc {
  docCategory: string;
  status: DocStatus;
  expiryDate?: string;
}

export interface DocCheckResult {
  partyRole: PartyRole;
  totalRequired: number;
  totalSubmitted: number;
  totalApproved: number;
  totalExpired: number;
  isComplete: boolean;
  missingDocs: string[];
  pendingDocs: string[];
  expiredDocs: string[];
  completionPct: number;
  axisReady: boolean;
}

export function checkPartyDocs(
  role: PartyRole, docs: PartyDoc[], now: string = new Date().toISOString(),
  requirements?: DocRequirement[],
): DocCheckResult {
  const reqs = requirements || DEFAULT_REQUIREMENTS[role];
  const requiredReqs = reqs.filter(r => r.isRequired);
  const nowDate = new Date(now);
  const missingDocs: string[] = [], pendingDocs: string[] = [], expiredDocs: string[] = [];
  let approvedCount = 0, submittedCount = 0, expiredCount = 0;

  for (const req of requiredReqs) {
    const doc = docs.find(d => d.docCategory === req.docCategory);
    if (!doc || doc.status === '미제출') { missingDocs.push(req.docCategory); continue; }
    submittedCount++;
    if (doc.status === '승인') {
      if (doc.expiryDate && new Date(doc.expiryDate) < nowDate) { expiredDocs.push(req.docCategory); expiredCount++; }
      else approvedCount++;
    } else if (doc.status === '심사중') pendingDocs.push(req.docCategory);
    else if (doc.status === '반려') missingDocs.push(req.docCategory);
    else if (doc.status === '만료') { expiredDocs.push(req.docCategory); expiredCount++; }
  }

  const totalRequired = requiredReqs.length;
  const isComplete = missingDocs.length === 0 && pendingDocs.length === 0 && expiredDocs.length === 0;
  const completionPct = totalRequired > 0 ? Math.round((approvedCount / totalRequired) * 100) : 100;

  return {
    partyRole: role, totalRequired, totalSubmitted: submittedCount, totalApproved: approvedCount,
    totalExpired: expiredCount, isComplete, missingDocs, pendingDocs, expiredDocs, completionPct,
    axisReady: isComplete && expiredCount === 0,
  };
}
