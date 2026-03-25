import { useState, useEffect } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import {
  makeDesign, calcBOM, calcLabor, calcEstimate,
  CalcStructSpec, generateStructComment, PIPE, HBEAM,
  calcScaffoldStress, calcHBeamStress,
  type QuoteInput, type CalcOpts, type Design,
} from '@axis/engine';

const getDustTier = (d: number) => d <= 0 ? 0 : d <= 1.5 ? 1 : d <= 2.5 ? 2 : 3;
const fmt = (n: number) => n.toLocaleString('ko-KR');

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-[#1e293b] border-b-2 border-[#2563eb] pb-1 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[11px] font-semibold text-[#64748b] bg-[#f1f5f9] px-2 py-1.5 border border-[#e2e8f0]">{children}</th>;
}
function TD({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <td className={`text-[12px] px-2 py-1.5 border border-[#e2e8f0] font-mono ${right ? 'text-right' : ''}`}>{children}</td>;
}

function DesignReport({ label, design, result, bom, labor, struct, color }: {
  label: string; design: Design; result: any; bom: any; labor: any; struct: any; color: string;
}) {
  return (
    <div className="flex-1 min-w-[340px]">
      <h2 className="text-base font-bold mb-4 px-2 py-1 rounded" style={{ background: color, color: '#fff' }}>{label}</h2>

      {/* 설계조건 */}
      <Section title="설계 조건">
        <table className="w-full text-[12px]">
          <tbody>
            {[
              ['경간', design.span + 'M'],
              ['횡대', design.hwangdae + '단'],
              ['지주간격', design.jiju],
              ['보조지주', design.bojo],
              ['기초', design.found],
              ['기초파이프', (design.gichoLength ?? '-') + 'M'],
              ['구조타입', design.structType || '-'],
              ['H빔 여부', design.isHBeam ? 'Y' : 'N'],
            ].map(([k, v]) => (
              <tr key={k} className="border-b border-[#f1f5f9]">
                <td className="py-1 text-[#64748b] w-[120px]">{k}</td>
                <td className="py-1 font-mono font-semibold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* BOM 상세 */}
      <Section title="자재 BOM 상세">
        <table className="w-full">
          <thead>
            <tr><TH>품목</TH><TH>수량</TH><TH>단가</TH><TH>금액</TH></tr>
          </thead>
          <tbody>
            {result.items?.map((it: any, i: number) => (
              <tr key={i} className={it.qty === 0 ? 'opacity-30' : ''}>
                <TD>{it.name}</TD>
                <TD right>{fmt(it.qty)}</TD>
                <TD right>{fmt(it.price)}</TD>
                <TD right>{fmt(it.qty * it.price)}</TD>
              </tr>
            ))}
            <tr className="font-bold bg-[#f8fafc]">
              <TD>자재 합계</TD><TD right></TD><TD right></TD>
              <TD right>{fmt(result.matTotal)}</TD>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* 노무비 */}
      <Section title="노무비 상세">
        <table className="w-full">
          <thead>
            <tr><TH>항목</TH><TH>일수</TH><TH>금액</TH></tr>
          </thead>
          <tbody>
            {labor && (
              <>
                <tr><TD>설치 노무</TD><TD right>{labor.installDays?.toFixed(1) ?? '-'}일</TD><TD right>{fmt(labor.installCost ?? 0)}</TD></tr>
                <tr><TD>해체 노무</TD><TD right>{labor.demoDays?.toFixed(1) ?? '-'}일</TD><TD right>{fmt(labor.demoCost ?? 0)}</TD></tr>
                {labor.hbeamInstall > 0 && <tr><TD>H빔 설치추가</TD><TD right>-</TD><TD right>{fmt(labor.hbeamInstall)}</TD></tr>}
                {labor.hbeamDemo > 0 && <tr><TD>H빔 해체추가</TD><TD right>-</TD><TD right>{fmt(labor.hbeamDemo)}</TD></tr>}
              </>
            )}
            <tr className="font-bold bg-[#f8fafc]">
              <TD>노무 합계</TD><TD right></TD>
              <TD right>{fmt(result.laborTotal)}</TD>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* 경비 (장비+운반) */}
      <Section title="경비 상세 (장비 + 운반)">
        <table className="w-full">
          <thead><tr><TH>항목</TH><TH>수량</TH><TH>단가</TH><TH>금액</TH></tr></thead>
          <tbody>
            {result.equipItems?.map((eq: any, i: number) => (
              <tr key={i}>
                <TD>{eq.name}</TD>
                <TD right>{eq.qty}대</TD>
                <TD right>{fmt(eq.unitPrice)}</TD>
                <TD right>{fmt(eq.total)}</TD>
              </tr>
            ))}
            {result.transportItems?.map((tr2: any, i: number) => (
              <tr key={'t' + i}>
                <TD>{tr2.name}</TD>
                <TD right>{tr2.qty}대</TD>
                <TD right>{fmt(tr2.unitPrice)}</TD>
                <TD right>{fmt(tr2.total)}</TD>
              </tr>
            ))}
            <tr className="font-bold bg-[#f8fafc]">
              <TD>경비 합계</TD><TD right></TD><TD right></TD>
              <TD right>{fmt(result.expenseTotal)}</TD>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* BB차감 */}
      {result.bbRefund > 0 && (
        <Section title="BB 차감 상세">
          <table className="w-full">
            <thead><tr><TH>품목</TH><TH>원가</TH><TH>차감률</TH><TH>차감액</TH></tr></thead>
            <tbody>
              {result.items?.filter((it: any) => it.bbDeduct > 0).map((it: any, i: number) => (
                <tr key={i}>
                  <TD>{it.name}</TD>
                  <TD right>{fmt(it.qty * it.price)}</TD>
                  <TD right>{(it.bbRate * 100).toFixed(1)}%</TD>
                  <TD right>-{fmt(it.bbDeduct)}</TD>
                </tr>
              ))}
              <tr className="font-bold bg-[#fef3c7]">
                <TD>BB차감 합계</TD><TD right></TD><TD right></TD>
                <TD right>-{fmt(result.bbRefund)}</TD>
              </tr>
            </tbody>
          </table>
        </Section>
      )}

      {/* 구조판정 */}
      {struct && (
        <Section title="구조 판정">
          <div className="text-[12px] space-y-1">
            {struct.map((line: string, i: number) => (
              <div key={i} className="font-mono text-[11px] text-[#334155]">{line}</div>
            ))}
          </div>
        </Section>
      )}

      {/* 총합 */}
      <Section title="총합">
        <table className="w-full">
          <tbody>
            {[
              ['자재비', result.matTotal],
              ['노무비', result.laborTotal],
              ['경비', result.expenseTotal],
              ['BB차감', -(result.bbRefund || 0)],
              ['총액', result.total],
              ['M당 단가', Math.round(result.total / (result.len || 100))],
            ].map(([k, v]) => (
              <tr key={k as string} className="border-b border-[#f1f5f9]">
                <td className="py-1.5 text-[12px] text-[#64748b]">{k}</td>
                <td className="py-1.5 text-right font-mono font-bold text-[13px]">
                  {(v as number) < 0 ? '-' : ''}{fmt(Math.abs(v as number))}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

export default function AdminReport() {
  const store = useQuoteStore();
  const [practical, setPractical] = useState<any>(null);
  const [standard, setStandard] = useState<any>(null);

  const h = store.height || 6;
  const panel = store.panelType || 'RPP';
  const len = store.length || 250;
  const floor = store.floorType || '파이프박기';
  const addr = store.address || '';
  const dH = store.dustH || 0;
  const dustN = getDustTier(dH);
  const bbMonths = store.bbMonths || 6;
  const isHBeam = store.constructionType === 'H빔식' || (store.constructionType === '자동' && h >= 7);

  useEffect(() => {
    try {
      const input: QuoteInput = {
        region: addr, len, panel, h, floor,
        asset: '전체고재' as any, contract: '바이백',
      };
      const opts: CalcOpts = { bbMonths, gate: '없음', doorGrade: '신재', doorW: 4, doorMesh: false, dustH: dH };

      // 실전형
      const dJ = makeDesign(h, floor, panel, false, dustN);
      const rJ = calcEstimate(input, dJ, opts);
      const bomJ = calcBOM(len, h, panel, dJ, dustN);
      const labJ = calcLabor(len, h, panel, dJ.span, true, dH, dJ.isHBeam ?? false);

      // 구조형
      const dP = makeDesign(h, floor, panel, true, dustN);
      const rP = calcEstimate(input, dP, opts);
      const bomP = calcBOM(len, h, panel, dP, dustN);
      const labP = calcLabor(len, h, panel, dP.span, true, dH, dP.isHBeam ?? false);

      // 구조 코멘트
      const sido = addr.includes('서울') ? '서울특별시'
        : addr.includes('경기') ? '경기도' : addr.includes('인천') ? '인천광역시'
        : addr.includes('부산') ? '부산광역시' : '서울특별시';
      const sigungu = addr.replace(/.*?(시|도)\s*/, '').replace(/(구|군|시).*/, '$1') || '';
      const sInput = {
        location: { sido, sigungu }, panel: panel === 'RPP' ? 'RPP방음판' : panel === 'EGI' ? 'EGI휀스' : '스틸방음판',
        height: h, dustH: dH, dustN, length: len, foundation: floor as any,
        constructionType: store.constructionType as any,
      };
      const specJ = CalcStructSpec(sInput);
      const structJ = generateStructComment(sInput, specJ);
      const structP = generateStructComment(sInput, CalcStructSpec(sInput));

      setPractical({ design: dJ, result: rJ, bom: bomJ, labor: labJ, struct: structJ });
      setStandard({ design: dP, result: rP, bom: bomP, labor: labP, struct: structP });
    } catch (e) {
      console.error('Report calc error:', e);
    }
  }, [h, panel, len, floor, addr, dH, bbMonths]);

  if (!practical || !standard) return <div className="p-8 text-center">계산 중...</div>;

  return (
    <div className="max-w-[1200px] mx-auto p-6 bg-white">
      {/* 헤더 */}
      <div className="border-b-2 border-[#1e293b] pb-4 mb-6">
        <h1 className="text-xl font-bold text-[#1e293b]">AXIS 견적 상세 보고서 — 관리자 확인용</h1>
        <div className="text-[12px] text-[#64748b] mt-1 space-x-4">
          <span>현장: {addr || '미입력'}</span>
          <span>판넬: {panel}</span>
          <span>높이: {h}M</span>
          <span>연장: {len}M</span>
          <span>기초: {floor}</span>
          <span>BB: {bbMonths}개월</span>
          <span>시공방식: {store.constructionType || '자동'}</span>
          <span>분진망: {dH > 0 ? dH + 'M' : '없음'}</span>
        </div>
        <div className="text-[10px] text-[#94a3b8] mt-1">
          생성일시: {new Date().toLocaleString('ko-KR')} | AXIS Engine v76.5
        </div>
      </div>

      {/* 2단 비교 */}
      <div className="flex gap-6 flex-wrap">
        <DesignReport
          label="실전형 (기본)"
          design={practical.design}
          result={practical.result}
          bom={practical.bom}
          labor={practical.labor}
          struct={practical.struct}
          color="#2563eb"
        />
        <DesignReport
          label="구조형 (구조보강)"
          design={standard.design}
          result={standard.result}
          bom={standard.bom}
          labor={standard.labor}
          struct={standard.struct}
          color="#d97706"
        />
      </div>

      {/* 면책 */}
      <div className="mt-8 border-t pt-4 text-[10px] text-[#94a3b8] leading-5">
        ※ 본 견적의 구조 조건은 AXIS 엔진이 현장 풍속·높이 기반으로 산출한 참고값이며,
        법적 구조검토서를 대체하지 않습니다.
        풍하중 계수(Kzr=0.81, Kzt=1.0, Iw=0.6, ρ=1.25)는 표준값을 적용하였고,
        지반 조건은 표준값(SPT=15, φ=30°)을 가정하였으며,
        실제 시공 시 현장 여건에 따라 전문 구조기술사의 검토를 받으시기 바랍니다.
      </div>
    </div>
  );
}
