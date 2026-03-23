/**
 * AXIS 견적출력시트 Excel 생성기
 * ─────────────────────────────────────────
 * - 외부 의존성 없음 (순수 XML SpreadsheetML)
 * - Excel에서 완벽히 열림 (.xls 확장자)
 * - 견적1~4 각각 별도 A4 워크시트 (각 1페이지)
 * - PDF 출력 시 FitToPage로 딱 맞게
 * - 기한후월사용료 행 포함 (소계 직전)
 */

// ══════════════════════════════════════════
// 타입 — API 응답 기반 (엔진 직접 import 없음)
// ══════════════════════════════════════════
export interface ExportRow {
  name: string;
  spec: string;
  unit: string;
  qty: number;
  price: number;
  amount: number;
  bbAmount?: number;     // 음수(차감) 또는 undefined
  finalAmount: number;
  assetType: string;     // '고재' | '신재' | ''
  basis: string;
  category: 'mat' | 'gate' | 'labor' | 'equip' | 'trans' | 'rent';
}

export interface QuoteSlotData {
  label: string;              // "견적1" 등
  panel: string;              // 'RPP' | 'EGI' | '스틸'
  height: number;
  length: number;
  asset: string;              // '전체고재' 등
  contract: string;           // '바이백' | '구매'
  mode: string;               // '실전형' | '표준형'
  span: number;               // 2.0 | 3.0
  bbMonths: number;
  // 합계
  matTotal: number;
  labTotal: number;
  eqpTotal: number;
  transTotal: number;
  gateTotal: number;
  bbRefund: number;
  total: number;
  totalPerM: number;
  monthlyRent: number;
  dailyRent: number;
  // 상세 행
  rows: ExportRow[];
}

// ══════════════════════════════════════════
// XML 유틸
// ══════════════════════════════════════════
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function numCell(v: number, styleId: string = 's_num'): string {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${v}</Data></Cell>`;
}

function strCell(v: string, styleId: string = 's_text'): string {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${esc(v)}</Data></Cell>`;
}

function mergedCell(v: string, across: number, styleId: string = 's_header'): string {
  return `<Cell ss:MergeAcross="${across}" ss:StyleID="${styleId}"><Data ss:Type="String">${esc(v)}</Data></Cell>`;
}

// ══════════════════════════════════════════
// 워크시트 1장 = A4 1페이지
// ══════════════════════════════════════════
function buildWorksheet(slot: QuoteSlotData, projectName: string, date: string): string {
  const rows = slot.rows;

  // A4 가로 210mm → 열 너비 합 ~665pt
  // A:품명 B:규격 C:단위 D:수량 E:단가 F:금액 G:BB금액 H:최종금액 I:자산 J:산출근거
  const colWidths = [115, 68, 32, 42, 62, 72, 62, 75, 38, 99];

  let xml = `<Worksheet ss:Name="${esc(slot.label)}">`;
  xml += `<Table ss:DefaultRowHeight="13.5">`;

  for (const w of colWidths) {
    xml += `<Column ss:Width="${w}"/>`;
  }

  // ── Row 1: 타이틀 ──
  xml += `<Row ss:Height="26">${mergedCell('내 역 서', 9, 's_title')}</Row>`;

  // ── Row 2: 공사명 / 작성일 ──
  xml += `<Row ss:Height="15">`;
  xml += strCell('공사명:', 's_label');
  xml += mergedCell(projectName || '-', 4, 's_text');
  xml += strCell('', 's_text');
  xml += strCell('작성일:', 's_label');
  xml += mergedCell(date, 2, 's_text');
  xml += `</Row>`;

  // ── Row 3: 조건 요약 ──
  xml += `<Row ss:Height="15">`;
  xml += strCell(slot.label, 's_label');
  xml += strCell(slot.panel, 's_text');
  xml += strCell(`${slot.height}M`, 's_text');
  xml += strCell(`${slot.length}M`, 's_text');
  xml += strCell(slot.asset, 's_text');
  xml += strCell(slot.contract, 's_text');
  xml += strCell(`경간 ${slot.span}M`, 's_text');
  xml += strCell(slot.mode, 's_text');
  xml += strCell('', 's_text');
  xml += strCell('', 's_text');
  xml += `</Row>`;

  // ── Row 4: spacer ──
  xml += `<Row ss:Height="5"><Cell ss:StyleID="s_text"/></Row>`;

  // ── Row 5: 절사규칙 ──
  xml += `<Row ss:Height="12">${mergedCell('※ 단가: 원 미만 절사 / 금액: 천원 미만 절사', 9, 's_note')}</Row>`;

  // ── Row 6: spacer ──
  xml += `<Row ss:Height="3"><Cell ss:StyleID="s_text"/></Row>`;

  // ── Row 7: 컬럼 헤더 ──
  xml += `<Row ss:Height="17">`;
  for (const h of ['품명', '규격', '단위', '수량', '단가', '금액', 'BUY-BACK', '최종금액', '자산', '산출근거']) {
    xml += strCell(h, 's_colhdr');
  }
  xml += `</Row>`;

  // ── 데이터 행 ──
  let prevCat = '';
  const catLabels: Record<string, string> = {
    mat: '── 자재 ──', gate: '── 도어 ──', labor: '── 노무비 ──',
    equip: '── 장비 ──', trans: '── 운반 ──',
  };

  for (const row of rows) {
    // 카테고리 구분 헤더
    if (row.category !== prevCat && row.category !== 'rent') {
      prevCat = row.category;
      if (catLabels[row.category]) {
        xml += `<Row ss:Height="13">${mergedCell(catLabels[row.category], 9, 's_catsep')}</Row>`;
      }
    }

    const isRent = row.category === 'rent';
    const ds = isRent ? 's_rent' : 's_data';
    const ns = isRent ? 's_rent_num' : 's_num';

    xml += `<Row ss:Height="13">`;
    xml += strCell(row.name, ds);
    xml += strCell(row.spec, ds);
    xml += strCell(row.unit, ds);
    xml += numCell(row.qty, ns);
    xml += numCell(row.price, ns);
    xml += numCell(row.amount, ns);
    xml += row.bbAmount != null ? numCell(row.bbAmount, 's_bb') : strCell('', ds);
    xml += numCell(row.finalAmount, isRent ? 's_rent_num' : 's_num_bold');
    xml += strCell(row.assetType, ds);
    xml += strCell(row.basis, ds);
    xml += `</Row>`;
  }

  // ── 소계 행 ──
  const gt = slot.matTotal + slot.labTotal + slot.eqpTotal + slot.transTotal + slot.gateTotal;
  xml += `<Row ss:Height="19">`;
  xml += mergedCell('소 계', 2, 's_subtotal');
  xml += strCell('', 's_subtotal');
  xml += strCell('총금액:', 's_subtotal');
  xml += strCell('', 's_subtotal');
  xml += numCell(Math.floor(gt / 1000) * 1000, 's_sub_num');
  xml += slot.bbRefund > 0 ? numCell(-slot.bbRefund, 's_sub_bb') : strCell('', 's_subtotal');
  xml += numCell(Math.floor(slot.total / 1000) * 1000, 's_sub_final');
  xml += strCell('', 's_subtotal');
  xml += strCell('', 's_subtotal');
  xml += `</Row>`;

  // ── M당 단가 ──
  xml += `<Row ss:Height="15">`;
  xml += mergedCell('M당 단가', 2, 's_perM');
  xml += strCell('', 's_perM');
  xml += strCell(`${slot.length}M`, 's_perM');
  xml += strCell('', 's_perM');
  xml += numCell(slot.totalPerM, 's_perM_num');
  xml += strCell('', 's_perM');
  xml += strCell('', 's_perM');
  xml += strCell('', 's_perM');
  xml += strCell('', 's_perM');
  xml += `</Row>`;

  // ── 바이백 정보 ──
  if (slot.bbRefund > 0) {
    xml += `<Row ss:Height="13">`;
    xml += mergedCell(`BUY-BACK ${slot.bbMonths}개월 차감`, 4, 's_bb_info');
    xml += strCell('', 's_bb_info');
    xml += numCell(-slot.bbRefund, 's_bb');
    xml += strCell('실질비용:', 's_bb_info');
    xml += numCell(Math.floor(slot.total / 1000) * 1000, 's_num_bold');
    xml += strCell('', 's_text');
    xml += strCell('', 's_text');
    xml += `</Row>`;
  }

  // ── 기한후 월/일사용료 안내 ──
  if (slot.monthlyRent > 0) {
    const mFmt = slot.monthlyRent.toLocaleString('ko-KR');
    const dFmt = slot.dailyRent.toLocaleString('ko-KR');
    xml += `<Row ss:Height="13">`;
    xml += mergedCell(`기한후 월사용료: ${mFmt}원/월  |  일사용료: ${dFmt}원/일`, 9, 's_rent_info');
    xml += `</Row>`;
  }

  // ── 면책조항 ──
  xml += `<Row ss:Height="5"><Cell ss:StyleID="s_text"/></Row>`;
  xml += `<Row ss:Height="12">`;
  xml += mergedCell('※ 본 견적은 과거 시공 데이터 기반 예상 범위이며 구조설계 도서가 아닙니다.', 9, 's_disclaimer');
  xml += `</Row>`;

  xml += `</Table>`;

  // ── A4 인쇄 설정 ──
  xml += `<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">`;
  xml += `<PageSetup>`;
  xml += `<Layout x:Orientation="Portrait"/>`;
  xml += `<Header x:Margin="0.3"/>`;
  xml += `<Footer x:Margin="0.3"/>`;
  xml += `<PageMargins x:Bottom="0.5" x:Left="0.5" x:Right="0.5" x:Top="0.5"/>`;
  xml += `</PageSetup>`;
  xml += `<FitToPage/>`;
  xml += `<Print>`;
  xml += `<FitWidth>1</FitWidth>`;
  xml += `<FitHeight>1</FitHeight>`;
  xml += `<ValidPrinterInfo/>`;
  xml += `<PaperSizeIndex>9</PaperSizeIndex>`; // A4
  xml += `</Print>`;
  xml += `<ProtectObjects>False</ProtectObjects>`;
  xml += `<ProtectScenarios>False</ProtectScenarios>`;
  xml += `</WorksheetOptions>`;

  xml += `</Worksheet>`;
  return xml;
}

// ══════════════════════════════════════════
// 스타일
// ══════════════════════════════════════════
function buildStyles(): string {
  return `<Styles>
  <Style ss:ID="Default">
    <Font ss:FontName="맑은 고딕" ss:Size="9"/>
  </Style>
  <Style ss:ID="s_title">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="맑은 고딕" ss:Size="14" ss:Bold="1"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="2"/></Borders>
  </Style>
  <Style ss:ID="s_label">
    <Font ss:FontName="맑은 고딕" ss:Size="9" ss:Bold="1"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="s_text">
    <Font ss:FontName="맑은 고딕" ss:Size="9"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="s_note">
    <Font ss:FontName="맑은 고딕" ss:Size="7.5" ss:Color="#888888"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="s_colhdr">
    <Font ss:FontName="맑은 고딕" ss:Size="8" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#2B579A" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4472C4"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4472C4"/>
    </Borders>
  </Style>
  <Style ss:ID="s_catsep">
    <Font ss:FontName="맑은 고딕" ss:Size="7.5" ss:Bold="1" ss:Color="#2B579A"/>
    <Interior ss:Color="#D6E4F0" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B4C6E7"/>
    </Borders>
  </Style>
  <Style ss:ID="s_data">
    <Font ss:FontName="맑은 고딕" ss:Size="8"/>
    <Alignment ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    </Borders>
  </Style>
  <Style ss:ID="s_num">
    <Font ss:FontName="맑은 고딕" ss:Size="8"/>
    <NumberFormat ss:Format="#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    </Borders>
  </Style>
  <Style ss:ID="s_num_bold">
    <Font ss:FontName="맑은 고딕" ss:Size="8" ss:Bold="1"/>
    <NumberFormat ss:Format="#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    </Borders>
  </Style>
  <Style ss:ID="s_bb">
    <Font ss:FontName="맑은 고딕" ss:Size="8" ss:Color="#CC0000"/>
    <NumberFormat ss:Format="#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    </Borders>
  </Style>
  <Style ss:ID="s_rent">
    <Font ss:FontName="맑은 고딕" ss:Size="8" ss:Color="#0066CC"/>
    <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B4C6E7"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B4C6E7"/>
    </Borders>
  </Style>
  <Style ss:ID="s_rent_num">
    <Font ss:FontName="맑은 고딕" ss:Size="8" ss:Color="#0066CC"/>
    <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B4C6E7"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B4C6E7"/>
    </Borders>
  </Style>
  <Style ss:ID="s_rent_info">
    <Font ss:FontName="맑은 고딕" ss:Size="7.5" ss:Color="#0066CC" ss:Italic="1"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="s_subtotal">
    <Font ss:FontName="맑은 고딕" ss:Size="9" ss:Bold="1"/>
    <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Double" ss:Weight="2"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
    </Borders>
  </Style>
  <Style ss:ID="s_sub_num">
    <Font ss:FontName="맑은 고딕" ss:Size="9" ss:Bold="1"/>
    <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Double" ss:Weight="2"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
    </Borders>
  </Style>
  <Style ss:ID="s_sub_bb">
    <Font ss:FontName="맑은 고딕" ss:Size="9" ss:Bold="1" ss:Color="#CC0000"/>
    <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Double" ss:Weight="2"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
    </Borders>
  </Style>
  <Style ss:ID="s_sub_final">
    <Font ss:FontName="맑은 고딕" ss:Size="10" ss:Bold="1" ss:Color="#2B579A"/>
    <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Double" ss:Weight="2"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
    </Borders>
  </Style>
  <Style ss:ID="s_perM">
    <Font ss:FontName="맑은 고딕" ss:Size="8" ss:Bold="1" ss:Color="#666666"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="s_perM_num">
    <Font ss:FontName="맑은 고딕" ss:Size="8" ss:Bold="1" ss:Color="#666666"/>
    <NumberFormat ss:Format="#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="s_bb_info">
    <Font ss:FontName="맑은 고딕" ss:Size="8" ss:Color="#CC0000"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="s_disclaimer">
    <Font ss:FontName="맑은 고딕" ss:Size="7" ss:Color="#999999" ss:Italic="1"/>
    <Alignment ss:Vertical="Center" ss:WrapText="1"/>
  </Style>
  <Style ss:ID="s_header">
    <Font ss:FontName="맑은 고딕" ss:Size="9"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
</Styles>`;
}

// ══════════════════════════════════════════
// 메인: 견적 슬롯 배열 → Excel XML 다운로드
// ══════════════════════════════════════════
export function exportQuotesToExcel(
  slots: QuoteSlotData[],
  projectName: string = '',
  date?: string,
) {
  const d = date || new Date().toISOString().slice(0, 10);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<?mso-application progid="Excel.Sheet"?>`;
  xml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"`;
  xml += ` xmlns:o="urn:schemas-microsoft-com:office:office"`;
  xml += ` xmlns:x="urn:schemas-microsoft-com:office:excel"`;
  xml += ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`;

  xml += `<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">`;
  xml += `<Title>AXIS 견적 내역서</Title>`;
  xml += `<Author>AXIS Platform</Author>`;
  xml += `<Created>${new Date().toISOString()}</Created>`;
  xml += `</DocumentProperties>`;

  xml += `<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">`;
  xml += `<WindowHeight>12000</WindowHeight>`;
  xml += `<WindowWidth>18000</WindowWidth>`;
  xml += `</ExcelWorkbook>`;

  xml += buildStyles();

  for (const slot of slots) {
    xml += buildWorksheet(slot, projectName, d);
  }

  xml += `</Workbook>`;

  // Blob → 다운로드
  const blob = new Blob(['\uFEFF' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AXIS_견적내역서_${projectName || '견적'}_${d}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
