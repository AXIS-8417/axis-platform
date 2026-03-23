// AXIS 단가규칙 3단계 파이프라인 — modPriceRule_단가규칙엔진.bas 이식
// Stage 1: 기본단가 (단가_자동)
// Stage 2: 규칙 매칭 (대분류/품명/규격/단위/재질, 우선순위 정렬)
// Stage 3: 개별 오버라이드 (CaseID+ItemKey, 와일드카드)

// ══════════════════════════════════════════
// 타입 정의
// ══════════════════════════════════════════
export interface QuoteItem {
  caseId: string;
  itemKey: string;
  category: string;      // 대분류
  name: string;          // 품명
  spec: string;          // 규격
  unit: string;          // 단위
  material: string;      // 재질
  autoQty: number;       // 수량_자동
  autoPrice: number;     // 단가_자동
  autoAmount: number;    // 금액_자동
  manualPrice?: number;  // 단가_수동 (오버라이드)
  manualQty?: number;    // 수량_수동
}

export interface PriceRule {
  id: string;
  priority: number;      // 숫자 작을수록 우선
  category?: string;     // 대분류 (빈값 = 전체)
  nameKeyword?: string;  // 품명 키워드 (contains 매칭)
  specKeyword?: string;  // 규격 키워드
  unitFilter?: string;   // 단위 필터
  materialFilter?: string; // 재질 필터
  correction: CorrectionMode;
  value: number;         // 가산값/배수/강제값
}

export interface PriceOverride {
  caseId: string;        // CaseID ('' = 와일드카드)
  itemKey: string;       // ItemKey ('' = 와일드카드)
  correction: CorrectionMode;
  value: number;
}

export type CorrectionMode = '가산' | '배수' | '강제';

export interface PriceRuleResult {
  finalPrice: number;
  finalAmount: number;
  appliedRule?: string;
  appliedOverride?: string;
  stage: number;         // 1=기본, 2=규칙, 3=오버라이드
}

// ══════════════════════════════════════════
// Stage 2: 규칙 매칭
// ══════════════════════════════════════════
function matchesRule(item: QuoteItem, rule: PriceRule): boolean {
  if (rule.category && rule.category !== '' && rule.category !== item.category) return false;
  if (rule.nameKeyword && rule.nameKeyword !== '' && !item.name.includes(rule.nameKeyword)) return false;
  if (rule.specKeyword && rule.specKeyword !== '' && !item.spec.includes(rule.specKeyword)) return false;
  if (rule.unitFilter && rule.unitFilter !== '' && rule.unitFilter !== item.unit) return false;
  if (rule.materialFilter && rule.materialFilter !== '' && rule.materialFilter !== item.material) return false;
  return true;
}

function applyCorrection(basePrice: number, mode: CorrectionMode, value: number): number {
  switch (mode) {
    case '가산': return basePrice + value;
    case '배수': return Math.round(basePrice * value);
    case '강제': return value;
    default: return basePrice;
  }
}

// ══════════════════════════════════════════
// Stage 3: 오버라이드 매칭
// ══════════════════════════════════════════
function matchesOverride(item: QuoteItem, ov: PriceOverride): boolean {
  if (ov.caseId !== '' && ov.caseId !== item.caseId) return false;
  if (ov.itemKey !== '' && ov.itemKey !== item.itemKey) return false;
  return true;
}

// ══════════════════════════════════════════
// 메인: 3단계 단가 파이프라인
// ══════════════════════════════════════════
export function applyPriceRules(
  item: QuoteItem,
  rules: PriceRule[],
  overrides: PriceOverride[],
): PriceRuleResult {
  // Stage 1: 기본 단가
  let finalPrice = item.autoPrice;
  let stage = 1;
  let appliedRule: string | undefined;
  let appliedOverride: string | undefined;

  // Stage 2: 규칙 매칭 (우선순위순)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  for (const rule of sortedRules) {
    if (matchesRule(item, rule)) {
      finalPrice = applyCorrection(finalPrice, rule.correction, rule.value);
      appliedRule = rule.id;
      stage = 2;
      break; // 첫 매칭 규칙만 적용 (VBA 원본 동일)
    }
  }

  // Stage 3: 개별 오버라이드
  for (const ov of overrides) {
    if (matchesOverride(item, ov)) {
      finalPrice = applyCorrection(finalPrice, ov.correction, ov.value);
      appliedOverride = `${ov.caseId}:${ov.itemKey}`;
      stage = 3;
      break;
    }
  }

  // 수동 오버라이드가 있으면 최우선
  if (item.manualPrice !== undefined && item.manualPrice > 0) {
    finalPrice = item.manualPrice;
    stage = 3;
    appliedOverride = 'MANUAL';
  }

  const qty = item.manualQty !== undefined && item.manualQty > 0 ? item.manualQty : item.autoQty;
  const finalAmount = finalPrice * qty;

  return { finalPrice, finalAmount, appliedRule, appliedOverride, stage };
}

// ══════════════════════════════════════════
// 배치 처리: 전체 아이템에 규칙 적용
// ══════════════════════════════════════════
export function applyPriceRulesToAll(
  items: QuoteItem[],
  rules: PriceRule[],
  overrides: PriceOverride[],
): { results: PriceRuleResult[]; totalAmount: number } {
  const results = items.map((item) => applyPriceRules(item, rules, overrides));
  const totalAmount = results.reduce((sum, r) => sum + r.finalAmount, 0);
  return { results, totalAmount };
}
