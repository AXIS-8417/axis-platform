// AXIS 도어 견적 엔진 — 설계서 v4.8 §7.2.6 Table 19-20
// 양개도어 + 홀딩도어 + 수직포망 (W M당 단가 방식)

// ══════════════════════════════════════════
// 도어 타입 정의
// ══════════════════════════════════════════
export type DoorType = '양개도어' | '홀딩도어' | '없음';
export type DoorGrade = '고재' | '신재';
export type DoorStructure = '비계식' | 'H빔식';

// ══════════════════════════════════════════
// 양개도어 단가 (Table 20)
// H 고정 2.4M, W 3M+, 1M 단위
// ══════════════════════════════════════════
const YANGAE_PRICE: Record<DoorStructure, Record<DoorGrade, number>> = {
  '비계식': { '고재': 100_000, '신재': 130_000 },
  'H빔식':  { '고재': 675_000, '신재': 878_000 },
};

// ══════════════════════════════════════════
// 홀딩도어 단가 (Table 19)
// H 고정 6.0M, W 6M+, 1M 단위
// ══════════════════════════════════════════
const HOLDING_PRICE: Record<DoorGrade, number> = {
  '고재': 270_000,
  '신재': 350_000,
};

// 수직포망 (정밀견적 전용, No.71)
const VERTICAL_MESH_PRICE = 25_000; // 원/장 (2.4M×1M)
const VERTICAL_MESH_PREMIUM_REGIONS = ['강남', '서초', '송파', '마포', '용산'];

// ══════════════════════════════════════════
// 입력/출력 인터페이스
// ══════════════════════════════════════════
export interface DoorInput {
  doorType: DoorType;
  grade: DoorGrade;
  widthM: number;              // 도어 너비 (M)
  structure: DoorStructure;    // 양개도어에만 영향
  sideDoorDirection?: '좌측' | '우측';  // 홀딩도어 쪽문 방향
  verticalMesh?: boolean;      // 수직포망 설치 여부 (정밀견적)
  region?: string;             // 강남권 자동 추천용
}

export interface DoorResult {
  doorType: DoorType;
  grade: DoorGrade;
  widthM: number;
  heightM: number;             // 양개 2.4M / 홀딩 6.0M
  unitPrice: number;           // W M당 단가
  bodyCost: number;            // 도어 본체 금액
  meshQty: number;             // 수직포망 수량
  meshCost: number;            // 수직포망 금액
  totalCost: number;           // 합계
  sideDoor: boolean;           // 쪽문 포함 여부
  sideDoorDirection: string;
  meshRecommended: boolean;    // 강남권 수직포망 자동추천
  breakdown: string;           // 산출근거
  warnings: string[];
}

// ══════════════════════════════════════════
// 메인: 도어 견적 계산
// ══════════════════════════════════════════
export function calcDoorEstimate(input: DoorInput): DoorResult {
  const warnings: string[] = [];

  if (input.doorType === '없음') {
    return {
      doorType: '없음', grade: input.grade, widthM: 0, heightM: 0,
      unitPrice: 0, bodyCost: 0, meshQty: 0, meshCost: 0, totalCost: 0,
      sideDoor: false, sideDoorDirection: '', meshRecommended: false,
      breakdown: '도어 없음', warnings: [],
    };
  }

  let heightM: number;
  let unitPrice: number;
  let minW: number;
  let sideDoor = false;

  if (input.doorType === '홀딩도어') {
    heightM = 6.0;
    minW = 6;
    unitPrice = HOLDING_PRICE[input.grade];
    sideDoor = true; // 홀딩은 쪽문 기본 포함
  } else {
    // 양개도어
    heightM = 2.4;
    minW = 3;
    unitPrice = YANGAE_PRICE[input.structure]?.[input.grade] ?? YANGAE_PRICE['비계식'][input.grade];
  }

  // 너비 검증
  const w = Math.max(minW, Math.ceil(input.widthM));
  if (input.widthM < minW) {
    warnings.push(`최소 너비 ${minW}M 적용 (입력: ${input.widthM}M)`);
  }

  const bodyCost = w * unitPrice;

  // 수직포망 (정밀견적 전용, 홀딩도어만)
  let meshQty = 0;
  let meshCost = 0;
  let meshRecommended = false;

  if (input.doorType === '홀딩도어') {
    // 강남권 자동추천
    if (input.region && VERTICAL_MESH_PREMIUM_REGIONS.some(d => input.region!.includes(d))) {
      meshRecommended = true;
      if (!input.verticalMesh) {
        warnings.push('프리미엄 지역: 수직포망 설치 권장');
      }
    }

    if (input.verticalMesh) {
      meshQty = w; // W(M) = 장 수
      meshCost = meshQty * VERTICAL_MESH_PRICE;
    }
  }

  const totalCost = bodyCost + meshCost;

  // 산출근거
  const parts: string[] = [];
  parts.push(`${input.doorType} ${input.grade} W${w}M × @${unitPrice.toLocaleString()}원/M = ${bodyCost.toLocaleString()}원`);
  if (meshCost > 0) {
    parts.push(`수직포망 ${meshQty}장 × @${VERTICAL_MESH_PRICE.toLocaleString()}원 = ${meshCost.toLocaleString()}원`);
  }
  if (sideDoor) {
    parts.push(`쪽문 포함 (${input.sideDoorDirection ?? '좌측'})`);
  }

  return {
    doorType: input.doorType,
    grade: input.grade,
    widthM: w,
    heightM,
    unitPrice,
    bodyCost,
    meshQty,
    meshCost,
    totalCost,
    sideDoor,
    sideDoorDirection: input.sideDoorDirection ?? '좌측',
    meshRecommended,
    breakdown: parts.join(' + '),
    warnings,
  };
}

// ══════════════════════════════════════════
// 도어 BB 차감 (도어도 자재이므로 BB 적용)
// ══════════════════════════════════════════
export function calcDoorBBDeduct(
  doorResult: DoorResult,
  bbDeductRate: number,
): { deductAmount: number; netCost: number } {
  // 수직포망은 소모품 → BB 미적용, 도어 본체만 적용
  const deductAmount = Math.round(doorResult.bodyCost * bbDeductRate);
  return {
    deductAmount,
    netCost: doorResult.totalCost - deductAmount,
  };
}
