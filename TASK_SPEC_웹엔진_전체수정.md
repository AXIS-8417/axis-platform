# AXIS 웹 플랫폼 전체 수정 지시서
> 작성일: 2026-03-21
> 대상: axis-platform 모노레포 (packages/engine + apps/web + apps/api)

---

## 작업 1: 엔진 — 횡대(표준형) 룩업 테이블 교체

### 현재 문제
`packages/engine/src/index.ts`의 `getFinalHwangdae()`:
```typescript
const structBonus = (isStd && h >= 4) ? 1 : 0;
return base + structBonus + dustN;
```
이 단순 공식은 **6M에서 틀림** (5단이어야 하는데 6단으로 계산).
프론트엔드 XBAR에서 **3M일 때 표준형 4단**으로 잘못 표시되는 문제도 있음.

### 확정 규칙 (사용자 확인 완료 — 절대 변경 불가)

| 높이 | 실전형(기본) | 스틸예외 | 표준형(구조보강) |
|------|------------|---------|---------------|
| 1M | 2 | — | 2 |
| 2M | 2 | — | 2 |
| 3M | 3 | — | 3 |
| 4M | 3 | 4(스틸) | 4 |
| 5M | 4 | — | 5 |
| 6M | 5 | — | **5** (보너스 없음!) |
| 7M | 6 | — | 7 |
| 8M | 7 | — | 8 |

> 9M, 10M은 미확정 → 기존값 유지, 건드리지 말 것

### 수정 방법

#### 1-1. `getFinalHwangdae()` 수정
```typescript
const STD_HWANGDAE: Record<number, number> = {
  1: 2, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5, 7: 7, 8: 8,
};

export function getFinalHwangdae(h: number, panel: string, isStd: boolean, dustN: number): number {
  if (isStd) {
    const hKey = Math.floor(h);
    // 확정 테이블에 있으면 사용, 없으면(9M+) 기존 로직 폴백
    const stdBase = STD_HWANGDAE[hKey];
    if (stdBase !== undefined) {
      return stdBase + dustN;
    }
    // 9M 이상 폴백: 기존 base + 1
    const base = getBaseHwangdae(h, panel);
    return base + 1 + dustN;
  }
  const base = getBaseHwangdae(h, panel);
  return base + dustN;
}
```

#### 1-2. 프론트엔드 XBAR 수정
높이 선택 페이지에서 `횡대(표준형)` 값을 표시하는 부분을 찾아서:
- 엔진의 `getFinalHwangdae(h, panel, true, dustN)`을 호출하도록 통일
- 별도 하드코딩이나 다른 공식이 있다면 제거
- 높이 버튼(1M~10M) 아래 표시되는 단수도 엔진과 일치하는지 확인

#### 1-3. 검증
수정 후 1M~8M 전 구간에서 실전형/표준형 값이 위 테이블과 일치하는지 테스트:
```typescript
for (const h of [1,2,3,4,5,6,7,8]) {
  const std = getFinalHwangdae(h, 'RPP', true, 0);
  const base = getFinalHwangdae(h, 'RPP', false, 0);
  console.log(`${h}M: 실전형=${base} 표준형=${std}`);
}
```

---

## 작업 2: 엔진 — 기한후월대여료 품목별 차등 적용

### 현재 문제
`calcEstimate()` 안에서:
```typescript
monthlyRent: Math.round(matTotal * 0.017)  // ← 전체 자재비에 일괄 1.7%
```
엑셀 엔진은 품목별 차등 요율을 적용함.

### 수정 내용
> ★ 이미 수정 완료되어 있음. 확인만 할 것.

`packages/engine/src/index.ts`에 이미 추가된 내용:
- `RENT_RATE` 룩업 테이블 (주주 1.6%, 횡대 1.7%, 지주 1.9%, 클램프 2.0%, 분진망/기초 0%)
- `getRentRate()` export 함수
- `calcEstimate()` 내 `rentTotal` 품목별 합산 → `monthlyRent: Math.round(rentTotal)`

### 검증
```typescript
// 예상 결과: RPP 3M 100M 전체고재 바이백6개월
// monthlyRent = 58,803원 (구 방식 59,784원과 981원 차이)
```

---

## 작업 3: 경비 통합 (장비비 + 운반비 → 경비)

### 현재 문제
단가비교 탭에서 `장비/기초`와 `운반비`가 따로 표시됨.
운반비가 높게 나와도 내역이 안 보여서 검증이 안 됨.

### 수정 내용

#### 3-1. 단가비교 탭 UI (`apps/web/src/pages/quote/Compare.tsx`)

현재:
```
장비/기초    715,000원
운반비     1,023,000원
```

변경:
```
경비      1,738,000원  [▼ 상세]
```

클릭 시 펼침:
```
경비      1,738,000원  [▲]
  ├ 굴착기 (0.4m³) 1대         715,000원
  ├ 5t카고 3대 × 170,500원     511,500원  (편도)
  └ 5t카고 3대 × 170,500원     511,500원  (복로-바이백)
```

- 구매(판매)이면 편도만 표시
- 바이백이면 편도+복로 구분 표시
- 거리 기반 단가 계산근거도 표시: `거리 45km → 대당 170,500원`

#### 3-2. 경비 상세 데이터
엔진 `calcTransport()`와 `MISC_PRICE.굴착기`에서 가져올 값:
- 트럭 대수, 대당 단가, 왕복 여부
- 굴착기 대수, 단가

API 응답에 이 상세 정보가 포함되어야 함. 현재 `EstimateResult`에 `transTotal`만 있으면 안 되고, `laborDetail`처럼 `transportDetail`도 필요:
```typescript
// EstimateResult에 추가
transportDetail: { trucks: number; perTruck: number; trips: number; total: number };
```

#### 3-3. 운반비/장비비 계산 검증
엑셀 VBA 모듈 `modTransport_v3_patch.bas`와 대조:
- 현재 웹 공식: `perTruck = 130,000 + dist × 900`
- 엑셀에서는 `운반요율` 시트에서 거리별 요율을 VLOOKUP
- 단순 선형 공식이 엑셀과 일치하는지 확인 (VBA 코드는 `C:\Users\n-squ\Downloads\VBA_ALL_MODULES.txt`에서 `modTransport` 검색)

---

## 작업 4: Excel 견적출력시트 다운로드 연결

### 현재 상태
`apps/web/src/lib/quoteExcelExport.ts` 파일이 이미 생성되어 있음:
- `exportQuotesToExcel(slots, projectName, date)` 함수
- 외부 의존성 없음 (순수 XML SpreadsheetML)
- 견적1~4 각각 별도 워크시트 = A4 한 장씩
- 기한후 월사용료 행 포함 (소계 직전, 파란색 배경)

### 해야 할 것: UI에 다운로드 버튼 추가

#### 4-1. 다운로드 버튼 위치
견적 결과를 보여주는 페이지에 버튼 추가:
```tsx
<button onClick={handleExcelDownload}>
  📥 Excel 내역서 다운로드
</button>
```

#### 4-2. 데이터 연결
`exportQuotesToExcel()`에 넘길 `QuoteSlotData[]`를 API 응답으로부터 조립:

```typescript
import { exportQuotesToExcel, type QuoteSlotData, type ExportRow } from '../lib/quoteExcelExport';

function handleExcelDownload() {
  // API 응답 데이터(result)로부터 QuoteSlotData 조립
  const slot: QuoteSlotData = {
    label: '견적1',
    panel: input.panel,        // 'RPP' | 'EGI' | '스틸'
    height: input.height,
    length: input.length,
    asset: input.asset,        // '전체고재' 등
    contract: input.contract,  // '바이백' | '구매'
    mode: result.design.mode,  // '실전형' | '표준형'
    span: result.design.span,
    bbMonths: opts.bbMonths,
    matTotal: result.matTotal,
    labTotal: result.labTotal,
    eqpTotal: result.eqpTotal,
    transTotal: result.transTotal,
    gateTotal: result.gateTotal,
    bbRefund: result.bbRefund,
    total: result.total,
    totalPerM: result.totalPerM,
    monthlyRent: result.monthlyRent,
    dailyRent: result.dailyRent,
    rows: buildExportRows(result),  // 아래 함수
  };

  exportQuotesToExcel([slot], projectName);
}
```

#### 4-3. ExportRow 빌더
API 응답의 BOM/노무/장비/운반 데이터를 `ExportRow[]`로 변환하는 함수 필요:

```typescript
function buildExportRows(result: any): ExportRow[] {
  const rows: ExportRow[] = [];

  // 자재 행: result.bom의 각 품목
  // 도어 행: result.gateTotal > 0이면
  // 노무 행: 설치비, 해체비
  // 장비 행: 굴착기
  // 운반 행: 5t 카고트럭
  // 기한후 월사용료 행: result.monthlyRent > 0이면

  return rows;
}
```

이 함수의 구현은 `quoteExcelExport.ts`의 `ExportRow` 인터페이스 참조.
각 행의 `category` 필드: `'mat'` | `'gate'` | `'labor'` | `'equip'` | `'trans'` | `'rent'`

#### 4-4. Excel 출력 사양
- 파일명: `AXIS_견적내역서_{공사명}_{날짜}.xls`
- A4 세로 방향, FitToPage
- 견적1~4 각각 별도 시트(탭) = 각 1페이지
- 열 10개: 품명, 규격, 단위, 수량, 단가, 금액, BUY-BACK, 최종금액, 자산, 산출근거
- 소계 행: 이중선 테두리, 총금액/BB차감/최종금액
- 기한후 월사용료: 소계 직전, 파란 배경(#EFF6FF)
- BB차감 금액: 빨간색(#CC0000)
- 면책조항: 맨 아래 회색 이탤릭

---

## 작업 5: 기한후 월사용료 — 단가비교 탭에도 표시

### 현재 문제
엔진이 `monthlyRent`/`dailyRent`를 계산하지만, 단가비교 탭 UI에 표시가 안 됨.

### 수정 내용
단가비교 탭 하단(총액 아래)에 추가:

```
BB차감        -4,463,779원
총액          11,670,000원
─────────────────────────
기한후 월사용료    198,500원/월
기한후 일사용료      6,617원/일
```

- 바이백일 때만 표시
- `result.monthlyRent`, `result.dailyRent` 값 사용
- 파란색 텍스트(#0066CC)로 구분

---

## 작업 순서 (권장)

1. **작업 1** (횡대 룩업 테이블) — 엔진 핵심 규칙, 최우선
2. **작업 2** (기한후월대여료) — 이미 완료, 확인만
3. **작업 3** (경비 통합) — UI + API 응답 수정
4. **작업 5** (월사용료 UI 표시) — 간단한 UI 추가
5. **작업 4** (Excel 다운로드 연결) — 마지막, 데이터 흐름 확정 후

---

## 참조 파일

| 파일 | 용도 |
|------|------|
| `packages/engine/src/index.ts` | 견적 엔진 (핵심 계산) |
| `apps/web/src/lib/quoteExcelExport.ts` | Excel 출력 모듈 (이미 생성됨) |
| `apps/web/src/pages/quote/Compare.tsx` | 단가비교 탭 |
| `apps/web/src/pages/quote/LevelSelect.tsx` | 높이 선택 + XBAR 표시 |
| `apps/web/src/store/quoteStore.ts` | 견적 상태 관리 |
| `C:\Users\n-squ\Downloads\VBA_ALL_MODULES.txt` | 엑셀 VBA 전체 (참조용) |
| `.claude/projects/.../memory/project_hwangdae_rule.md` | 횡대 확정 규칙 메모리 |

## 주의사항
- 9M, 10M 횡대 표준형은 미확정 → 수정 금지
- `RENT_RATE` 테이블은 이미 엔진에 추가됨 → 중복 추가 금지
- Excel 출력 모듈(`quoteExcelExport.ts`)은 외부 패키지 없이 동작 → exceljs 등 설치 불필요
