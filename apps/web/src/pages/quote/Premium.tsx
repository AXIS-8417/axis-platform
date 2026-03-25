import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuoteStore } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';
import { exportQuotesToExcel, type QuoteSlotData, type ExportRow } from '../../lib/quoteExcelExport';
import {
  makeDesign, calcEstimate, getDustTier,
  REGION_DB as ENGINE_REGION_DB,
  CalcStructSpec, generateStructComment,
  type QuoteInput, type CalcOpts, type StructSpecInput,
} from '@axis/engine';

const REGION_DB: Record<string, {Vo:number}> = {
  서울:{Vo:26},경기북부:{Vo:26},경기남부:{Vo:26},경기서해안:{Vo:28},인천:{Vo:28},
  강원내륙:{Vo:24},강원해안:{Vo:34},충청:{Vo:28},충남서해:{Vo:34},전라:{Vo:30},
  경상:{Vo:30},부산:{Vo:38},제주:{Vo:42},
};

function fmt(n: number) { return n?.toLocaleString('ko-KR') ?? '-'; }

// 구조판정 계산 — v76.5 엔진 기반
function calcStructure(
  h: number, panel: string, address: string,
  span: number, embedM: number,
  constructionType?: '자동' | '비계식' | 'H빔식',
  dustH = 0, dustN = 0,
) {
  // 주소에서 시도/시군구 추출
  const sido = address.includes('서울') ? '서울특별시'
    : address.includes('부산') ? '부산광역시' : address.includes('인천') ? '인천광역시'
    : address.includes('대구') ? '대구광역시' : address.includes('대전') ? '대전광역시'
    : address.includes('경기') ? '경기도' : address.includes('강원') ? '강원도'
    : address.includes('제주') ? '제주특별자치도' : '서울특별시';
  const sigungu = address.replace(/.*?(시|도)\s*/, '').replace(/(구|군|시).*/, '$1') || '';

  const sInput: StructSpecInput = {
    location: { sido, sigungu },
    panel: panel === 'RPP' ? 'RPP방음판' : panel === 'EGI' ? 'EGI휀스' : '스틸방음판',
    height: h, dustH, dustN, length: 100,
    foundation: '기초파이프',
    constructionType,
  };

  try {
    const spec = CalcStructSpec(sInput);
    const b = spec.basis;

    // CalcStructSpec 결과를 직접 사용 (이전: 임의 재계산으로 오류 발생)
    const stressRatio = b.stressRatio;
    const horiRatio = b.horiStressRatio;
    const fsVal = b.Fs;

    // BK_03: 말뚝 축력 검토 (VBA: P_axial / (2 * phi_Pn))
    const pf_N = b.pf_kN * 1000;
    const totalH = h + dustH;
    const P_axial = pf_N * span * totalH * 0.5;  // kN→N 축력근사
    const phi_Pn = 0.85 * 235 * 334.5;            // φPn = φ×Fy×A (파이프)
    const axialRatio = spec.structType === 'H빔식' ? 0 : P_axial / (2 * phi_Pn);

    const grade = (v: number, lo: number, hi: number) => v >= hi ? 'NG' : v >= lo ? 'WARN' : 'PASS';
    const checks = [
      { name: 'BK_01 횡대 합성응력', val: +horiRatio.toFixed(3), status: grade(horiRatio, 0.85, 1.0), max: 1.5 },
      { name: spec.structType === 'H빔식' ? 'BK_02 H빔 응력비' : 'BK_02 지주 응력비',
        val: +stressRatio.toFixed(3), status: grade(stressRatio, 0.75, 0.90), max: 1.2 },
      { name: 'BK_03 말뚝 응력비', val: +axialRatio.toFixed(3), status: grade(axialRatio, 0.75, 0.90), max: 1.2 },
      { name: 'BK_04 인발 안전율', val: +(fsVal < 900 ? fsVal : spec.embedDepth > 0 ? fsVal : 999).toFixed(1),
        status: fsVal >= 3.0 ? 'PASS' : fsVal >= 1.5 ? 'WARN' : 'NG', max: 4.0 },
    ];
    const ngCount = checks.filter(c => c.status === 'NG').length;
    const warnCount = checks.filter(c => c.status === 'WARN').length;
    const overall = ngCount >= 1 ? 'F(부적합)' : warnCount >= 2 ? 'D(위험경계)' : warnCount === 1 ? 'C(경계)' : 'A(안전)';
    return { checks, overall, basis: spec.basis };
  } catch {
    return { checks: [], overall: '계산 불가', basis: null };
  }
}

// 환경판정 계산
function calcEnvironment(panel: string, h: number, mode: string, found: string, embedM: number) {
  const noiseDB: Record<string, number> = { '스틸': 38, RPP: 33, EGI: 22 };
  const dustBase: Record<string, number> = { '스틸': 86, RPP: 79, EGI: 62 };
  const noise = noiseDB[panel] || 33;
  const dust = Math.min(98, (dustBase[panel] || 79) + (h >= 5 ? 10 : h >= 4 ? 5 : 0));
  const vibBase = found === '앵커볼트' ? 84 : embedM >= 2 ? 78 : 70;
  const vib = Math.min(98, vibBase + (panel === '스틸' ? 5 : 0));
  const wind = mode === '구조형' ? 89 : 80;
  const total = (noise / 40) * 35 + (dust / 100) * 30 + (vib / 100) * 20 + (wind / 100) * 15;
  const grade = total >= 85 ? 'A(우수)' : total >= 70 ? 'B(양호)' : total >= 55 ? 'C(보통)' : 'D(개선필요)';
  return { items: [
    { name: '소음차단', val: noise, unit: 'dB', pct: noise / 40 * 100 },
    { name: '분진차단율', val: dust, unit: '%', pct: dust },
    { name: '진동억제', val: vib, unit: '%', pct: vib },
    { name: '내풍안전도', val: wind, unit: '%', pct: wind },
  ], total: Math.round(total), grade };
}

export default function Premium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useQuoteStore();

  const [tab, setTab] = useState<'price' | 'design' | 'struct' | 'env'>('price');
  const [bbMonths, setBbMonths] = useState(6);
  const [gyeongbiOpen, setGyeongbiOpen] = useState(false);
  const [practical, setPractical] = useState<any>(null);
  const [standard, setStandard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const h = store.height || 3;
  const panel = store.panelType || 'RPP';
  const region = store.region || '경기남부';
  const len = store.length || 160;
  const floor = store.floorType || '파이프박기';

  // 엔진 직접 계산 (API 불필요)
  useEffect(() => {
    setLoading(true);
    try {
      const dH = store.dustH || 0;
      const dustN = getDustTier(dH);
      const input: QuoteInput = { region, len, panel, h, floor, asset: '전체고재' as any, contract: '바이백' };
      const opts: CalcOpts = { bbMonths, gate: '없음', doorGrade: '신재', doorW: 4, doorMesh: false, dustH: dH };
      const dJ = makeDesign(h, floor, panel, false, dustN);
      const dP = makeDesign(h, floor, panel, true, dustN);
      setPractical({ design: dJ, result: calcEstimate(input, dJ, opts) });
      setStandard({ design: dP, result: calcEstimate(input, dP, opts) });
    } catch (e) { console.error('엔진 계산 오류:', e); }
    finally { setLoading(false); }
  }, [bbMonths, h, panel, region, len, floor]);

  const regionData = REGION_DB[region] || { Vo: 26 };

  const addr = store.address || '';
  const cType = store.constructionType as '자동' | '비계식' | 'H빔식' | undefined;
  const dH = store.dustH || 0;
  const dN = getDustTier(dH);
  const structP = practical?.design ? calcStructure(h, panel, addr, practical.design.span, practical.design.gichoLength ?? 1.5, cType, dH, dN) : null;
  const structS = standard?.design ? calcStructure(h, panel, addr, standard.design.span, standard.design.gichoLength ?? 2.0, cType, dH, dN) : null;
  const envP = practical?.design ? calcEnvironment(panel, h, '실전형', practical.design.found, practical.design.gichoLength ?? 1.5) : null;
  const envS = standard?.design ? calcEnvironment(panel, h, '구조형', standard.design.found, standard.design.gichoLength ?? 2.0) : null;

  const statusColor = (s: string) => s === 'PASS' ? 'text-[#10b981]' : s === 'WARN' ? 'text-[#d97706]' : 'text-[#ef4444]';
  const barColor = (s: string) => s === 'PASS' ? 'bg-[#10b981]' : s === 'WARN' ? 'bg-[#d97706]' : 'bg-[#ef4444]';

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><div className="text-[#2563eb] font-mono animate-pulse">정밀 계산 중...</div></div>;

  const TABS = [
    { key: 'price', label: '단가비교' }, { key: 'design', label: '설계조건' },
    { key: 'struct', label: '구조판정' }, { key: 'env', label: '환경판정' },
  ];

  const Card = ({ title, data, color }: { title: string; data: any; color: string }) => {
    if (!data) return null;
    const r = data.result;
    const d = data.design;
    return (
      <div className={`flex-1 bg-[#ffffff] border rounded-lg p-5 ${color}`}>
        <h3 className="font-mono font-bold text-lg mb-3">{title}</h3>
        <div className="font-mono text-2xl mb-2">{fmt(r?.totalPerM)}원<span className="text-xs text-[#94a3b8]">/M</span></div>
        <div className="text-sm space-y-1 text-[#0f172a]">
          <div>총액: {fmt(r?.rounded)}원</div>
          <div>BB차감: -{fmt(r?.bbRefund)}원 ({((r?.bbRate||0)*100).toFixed(1)}%)</div>
          <div>범위: {fmt(r?.minVal)} ~ {fmt(r?.maxVal)}</div>
        </div>
        <div className="mt-3 text-xs text-[#94a3b8]">경간 {d?.span}M · 횡대 {d?.hwangdae}단 · 기초파이프 {d?.gichoLength ?? '앵커볼트'}M{store.dustH && store.dustH > 0 ? ` · 분진망 ${store.dustH}M` : ' · 분진망 없음'}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold bg-[#1e40af] text-white px-2 py-0.5 rounded">AXIS v4.7</span>
          <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded font-semibold">STEP 2+</span>
          <span className="text-[15px] font-bold text-[#0f172a]">정밀견적</span>
        </div>
        <p className="text-sm text-[#64748b] mb-4">{panel} · H{h}M · L{len}M · {floor} · {region}{(store.dustH && store.dustH > 0) ? ` · 분진망 H:${store.dustH}M` : ''}</p>
        <Stepper step={2} />

        {/* BB 슬라이더 */}
        <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2"><span className="text-sm text-[#94a3b8]">바이백</span><span className="text-[#2563eb] font-mono font-bold">{bbMonths}개월</span></div>
          <input type="range" min={1} max={36} value={bbMonths} onChange={e=>setBbMonths(Number(e.target.value))} className="w-full accent-[#2563eb]"/>
        </div>

        {/* 실전형 vs 구조형 */}
        <div className="flex gap-4 mb-6">
          <Card title="실전형 (기본)" data={practical} color="border-[#2563eb]/50" />
          <Card title="구조형 (구조보강)" data={standard} color="border-[#d97706]/50" />
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2 rounded-lg text-sm font-mono ${tab===t.key?'bg-[#2563eb]/20 text-[#2563eb] border border-[#2563eb]':'bg-[#f9fafb] text-[#94a3b8] border border-[#e5e7eb]'}`}>{t.label}</button>)}
        </div>

        {/* 탭 내용 */}
        <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-lg p-6 mb-6">
          {tab === 'price' && practical?.result && standard?.result && (() => {
            const pR = practical.result;
            const sR = standard.result;
            const pGyeongbi = (pR.eqpTotal || 0) + (pR.transTotal || 0);
            const sGyeongbi = (sR.eqpTotal || 0) + (sR.transTotal || 0);
            const pTrans = pR.transDetail || {};
            const sTrans = sR.transDetail || {};
            const isBB = true; // Premium 페이지는 항상 바이백 기준 (contract: '바이백')

            return (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#e5e7eb]"><th className="text-left py-2 text-[#94a3b8]">항목</th><th className="text-right py-2 text-[#2563eb]">실전형</th><th className="text-right py-2 text-[#d97706]">구조형</th></tr></thead>
                <tbody>
                  {[
                    ['자재비/M', pR.matM, sR.matM],
                    ['노무비/M', pR.labM, sR.labM],
                    ['경비/M', len > 0 ? Math.round(pGyeongbi / len) : 0, len > 0 ? Math.round(sGyeongbi / len) : 0],
                    ['자재 합계', pR.matTotal, sR.matTotal],
                    ['노무 합계', pR.labTotal, sR.labTotal],
                  ].map(([label, p, s], i) => (
                    <tr key={i} className="border-b border-[#e5e7eb]/30"><td className="py-2">{label as string}</td><td className="text-right font-mono">{fmt(p as number)}원</td><td className="text-right font-mono">{fmt(s as number)}원</td></tr>
                  ))}
                  {/* 경비 통합 행 (자재→노무 바로 다음) */}
                  <tr className="border-b border-[#e5e7eb]/30 cursor-pointer hover:bg-[#f8fafc]" onClick={() => setGyeongbiOpen(!gyeongbiOpen)}>
                    <td className="py-2 font-semibold">
                      경비 합계 <span className="text-[10px] text-[#94a3b8] ml-1">{gyeongbiOpen ? '▲ 접기' : '▼ 상세보기'}</span>
                    </td>
                    <td className="text-right font-mono font-semibold">{fmt(pGyeongbi)}원</td>
                    <td className="text-right font-mono font-semibold">{fmt(sGyeongbi)}원</td>
                  </tr>
                  {gyeongbiOpen && (
                    <>
                      {/* 장비 상세 (eqpDetail.items) */}
                      {(pR.eqpDetail?.items || [{ name: '굴착기', qty: 1, amount: pR.eqpTotal || 0 }]).map((eq: any, ei: number) => {
                        const sEq = (sR.eqpDetail?.items || [])[ei];
                        return (
                          <tr key={`eq${ei}`} className="border-b border-[#e5e7eb]/10 bg-[#f8fafc]">
                            <td className="py-1.5 pl-4 text-xs text-[#64748b]">├ {eq.name} {eq.qty}대 × {fmt(eq.price || 0)}원</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(eq.amount)}원</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(sEq?.amount || eq.amount)}원</td>
                          </tr>
                        );
                      })}
                      {/* 운반 상세 (transDetail) */}
                      {pTrans.trucks > 0 && (
                        <>
                          <tr className="border-b border-[#e5e7eb]/10 bg-[#f8fafc]">
                            <td className="py-1.5 pl-4 text-xs text-[#64748b]">├ {pTrans.vehicle || '5톤'} {pTrans.trucks}대 × {fmt(pTrans.perTruck)}원 × {pTrans.trips || 1}회 ({isBB ? '왕복-BB' : '편도'})</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(pTrans.total)}원</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(sTrans.total || pTrans.total)}원</td>
                          </tr>
                        </>
                      )}
                    </>
                  )}
                  {[
                    ['BB차감', -pR.bbRefund, -sR.bbRefund],
                    ['총액', pR.rounded, sR.rounded],
                  ].map(([label, p, s], i) => (
                    <tr key={`b${i}`} className={`border-b border-[#e5e7eb]/30 ${(label as string) === '총액' ? 'font-bold' : ''}`}><td className="py-2">{label as string}</td><td className="text-right font-mono">{fmt(p as number)}원</td><td className="text-right font-mono">{fmt(s as number)}원</td></tr>
                  ))}
                  {/* 기한후 월/일사용료 */}
                  {(pR.monthlyRent > 0 || sR.monthlyRent > 0) && (
                    <>
                      <tr className="border-b border-[#e5e7eb]/30">
                        <td className="py-2 text-[#0066CC]">기한후 월사용료</td>
                        <td className="text-right font-mono text-[#0066CC]">{fmt(pR.monthlyRent)}원/월</td>
                        <td className="text-right font-mono text-[#0066CC]">{fmt(sR.monthlyRent)}원/월</td>
                      </tr>
                      <tr className="border-b border-[#e5e7eb]/30">
                        <td className="py-2 text-[#0066CC]">기한후 일사용료</td>
                        <td className="text-right font-mono text-[#0066CC]">{fmt(pR.dailyRent)}원/일</td>
                        <td className="text-right font-mono text-[#0066CC]">{fmt(sR.dailyRent)}원/일</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            );
          })()}
          {tab === 'design' && practical?.design && standard?.design && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#e5e7eb]"><th className="text-left py-2 text-[#94a3b8]">조건</th><th className="text-right text-[#2563eb]">실전형</th><th className="text-right text-[#d97706]">구조형</th></tr></thead>
              <tbody>
                {(() => {
                  const isHBeam = practical.design.structType?.includes('H빔') || standard.design.structType?.includes('H빔');
                  const rows: [string,string,string][] = [
                    ['경간', practical.design.span+'M', standard.design.span+'M'],
                    ...(!isHBeam ? [
                      ['지주간격', practical.design.jiju, standard.design.jiju] as [string,string,string],
                      ['보조지주', practical.design.bojo, standard.design.bojo] as [string,string,string],
                    ] : []),
                    ['횡대', practical.design.hwangdae+'단', standard.design.hwangdae+'단'],
                    ['기초', practical.design.found, standard.design.found],
                    ['기초파이프', (practical.design.gichoLength??'-')+'M', (standard.design.gichoLength??'-')+'M'],
                    ['구조타입', practical.design.structType, standard.design.structType],
                    ...(isHBeam ? [
                      ['지주파이프', '없음 (H빔 대체)', '없음 (H빔 대체)'] as [string,string,string],
                      ['보조지주', '없음 (H빔 자립)', '없음 (H빔 자립)'] as [string,string,string],
                    ] : []),
                  ];
                  return rows.map(([label,p,s],i) => (
                    <tr key={i} className="border-b border-[#e5e7eb]/30"><td className="py-2">{label}</td><td className="text-right font-mono">{p}</td><td className="text-right font-mono">{s}</td></tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
          {tab === 'struct' && structP && structS && (() => {
            const pD = practical.design;
            const sD = standard.design;
            const wind = (structS?.basis || {}) as any;
            const isBK05 = h >= 6 && pD?.structType !== 'H빔식';
            // 스펙 차이 요약
            const diffs: string[] = [];
            if (pD.span !== sD.span) diffs.push(`경간 ${pD.span}M→${sD.span}M`);
            if ((pD.gichoLength||0) !== (sD.gichoLength||0)) diffs.push(`기초 ${pD.gichoLength||'-'}M→${sD.gichoLength||'-'}M`);
            if (pD.bojo !== sD.bojo) diffs.push(`보조지주 ${pD.bojo}→${sD.bojo}`);
            if (pD.hwangdae !== sD.hwangdae) diffs.push(`횡대 ${pD.hwangdae}단→${sD.hwangdae}단`);

            return (
              <div>
                {/* ④ 스펙 차이 요약 */}
                {diffs.length > 0 && (
                  <div className="bg-[#fffbeb] border border-[#fbbf24] rounded-lg p-3 mb-4 text-[12px]">
                    <span className="font-bold text-[#92400e]">구조형 차이:</span>{' '}
                    <span className="text-[#78350f]">{diffs.join(' · ')}</span>
                  </div>
                )}

                {/* ① BK_05 표시 (H≥6m 비계식) */}
                {isBK05 && (
                  <div className="bg-[#fef2f2] border-l-[3px] border-[#ef4444] rounded-r-lg px-3 py-2 mb-4 text-[12px] text-[#991b1b]">
                    <span className="font-bold">BK_05</span> 비계 H≥6m 보조지주 필수 — 보조지주 없으면 자동 N.G. (Rmax≈8.3, 구조적 불가)
                  </div>
                )}

                {/* 기존 바 차트 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {[{title:'실전형',data:structP,color:'#2563eb',design:pD},{title:'구조형',data:structS,color:'#d97706',design:sD}].map(({title,data,color,design})=>(
                    <div key={title}>
                      <h4 className="font-mono font-bold mb-1" style={{color}}>{title} — {data.overall}</h4>
                      {/* ② 근거 한 줄 */}
                      <p className="text-[11px] text-[#64748b] mb-3">
                        풍속 {wind.Vo || 28}m/s | 풍압 {wind.pf_kN?.toFixed(2) || '0.31'}kN/m² | 경간 {design.span}M | 기초 {design.gichoLength || '-'}M
                      </p>
                      {data.checks.map((ck: any)=>(
                        <div key={ck.name} className="mb-3">
                          <div className="flex justify-between text-xs mb-1"><span>{ck.name}</span><span className={statusColor(ck.status)}>{ck.val.toFixed(3)} {ck.status}</span></div>
                          <div className="h-2 bg-[#e5e7eb] rounded"><div className={`h-2 rounded ${barColor(ck.status)}`} style={{width:`${Math.min(100,ck.val/ck.max*100)}%`}}/></div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* ③ 면책 문구 (접힘) */}
                <details className="text-[11px] text-[#94a3b8] border-t border-[#e5e7eb] pt-2">
                  <summary className="cursor-pointer hover:text-[#64748b]">구조 면책 안내</summary>
                  <p className="mt-2 leading-5">
                    ※ 본 견적의 구조 조건은 AXIS 엔진이 현장 풍속·높이 기반으로 산출한 참고값이며,
                    법적 구조검토서를 대체하지 않습니다.
                    풍하중 계수(Kzr=0.81, Kzt=1.0, Iw=0.6, ρ=1.25)는 표준값을 적용하였고,
                    지반 조건은 표준값(SPT=15, φ=30°)을 가정하였으며,
                    실제 시공 시 현장 여건에 따라 전문 구조기술사의 검토를 받으시기 바랍니다.
                  </p>
                </details>
              </div>
            );
          })()}
          {tab === 'env' && envP && envS && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{title:'실전형',data:envP,color:'#2563eb'},{title:'구조형',data:envS,color:'#d97706'}].map(({title,data,color})=>(
                <div key={title}>
                  <h4 className="font-mono font-bold mb-1" style={{color}}>{title} — {data.grade}</h4>
                  <div className="font-mono text-2xl mb-3" style={{color}}>{data.total}점</div>
                  {data.items.map((it: any)=>(
                    <div key={it.name} className="mb-3">
                      <div className="flex justify-between text-xs mb-1"><span>{it.name}</span><span className="text-[#0f172a]">{it.val}{it.unit}</span></div>
                      <div className="h-2 bg-[#e5e7eb] rounded"><div className="h-2 rounded bg-[#3b82f6]" style={{width:`${Math.min(100,it.pct)}%`}}/></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 선택 버튼 */}
        <div className="flex gap-4 mb-6">
          <button onClick={()=>navigate(`/quote/level/${id}`)} className="flex-1 py-3 rounded-lg bg-[#2563eb] text-[#f8fafc] font-bold hover:bg-[#2563eb]/80">실전형 선택</button>
          <button onClick={()=>navigate(`/quote/level/${id}`)} className="flex-1 py-3 rounded-lg border border-[#d97706] text-[#d97706] font-bold hover:bg-[#d97706]/10">구조형 선택</button>
        </div>

        {/* Excel 다운로드 */}
        {practical?.result && standard?.result && (
          <button
            onClick={() => {
              const buildRows = (data: any): ExportRow[] => {
                const r = data.result;
                const d = data.design;
                const rows: ExportRow[] = [];
                // 자재 BOM
                if (r.bom) {
                  const bomEntries = [
                    { name: panel + '방음판', qty: r.bom.panelQty, cat: 'mat' as const },
                    { name: '주주파이프', qty: r.bom.juju, cat: 'mat' as const },
                    { name: '횡대파이프', qty: r.bom.hwCnt, cat: 'mat' as const },
                    { name: '지주파이프', qty: r.bom.jiuju, cat: 'mat' as const },
                    { name: '기초파이프', qty: r.bom.gichoQty, cat: 'mat' as const },
                    { name: '고정클램프', qty: r.bom.gojung, cat: 'mat' as const },
                    { name: '자동클램프', qty: r.bom.jadong, cat: 'mat' as const },
                    { name: '연결핀', qty: r.bom.pin, cat: 'mat' as const },
                  ].filter(b => b.qty > 0);
                  for (const b of bomEntries) {
                    rows.push({ name: b.name, spec: '', unit: 'EA', qty: b.qty, price: 0, amount: 0, finalAmount: 0, assetType: '', basis: '', category: b.cat });
                  }
                }
                // 노무비
                if (r.laborDetail) {
                  if (r.laborDetail.installTotal > 0) rows.push({ name: '설치비', spec: '', unit: '식', qty: 1, price: r.laborDetail.installTotal, amount: r.laborDetail.installTotal, finalAmount: r.laborDetail.installTotal, assetType: '', basis: `${len}m`, category: 'labor' });
                  if (r.laborDetail.removeTotal > 0) rows.push({ name: '해체비', spec: '', unit: '식', qty: 1, price: r.laborDetail.removeTotal, amount: r.laborDetail.removeTotal, finalAmount: r.laborDetail.removeTotal, assetType: '', basis: `${len}m`, category: 'labor' });
                }
                // 장비
                for (const eq of (r.eqpDetail?.items || [{ name: '굴착기', qty: 1, price: r.eqpTotal, amount: r.eqpTotal }])) {
                  rows.push({ name: eq.name, spec: '', unit: '대', qty: eq.qty, price: eq.price, amount: eq.amount, finalAmount: eq.amount, assetType: '', basis: '', category: 'equip' });
                }
                // 운반
                if (r.transDetail?.trucks > 0) {
                  rows.push({ name: `${r.transDetail.vehicle || '5톤'} 카고트럭`, spec: '', unit: '대', qty: r.transDetail.trucks, price: r.transDetail.perTruck, amount: r.transTotal, finalAmount: r.transTotal, assetType: '', basis: `${r.transDetail.trips}회`, category: 'trans' });
                }
                // 기한후 월사용료
                if (r.monthlyRent > 0) {
                  rows.push({ name: '기한후 월사용료', spec: '계약만료 후', unit: '월', qty: 1, price: r.monthlyRent, amount: r.monthlyRent, finalAmount: r.monthlyRent, assetType: '', basis: '품목별 월대여료율', category: 'rent' });
                }
                return rows;
              };

              const makeSlot = (label: string, data: any, mode: string): QuoteSlotData => ({
                label, panel, height: h, length: len, asset: '전체고재', contract: '바이백',
                mode, span: data.design?.span || 3, bbMonths,
                matTotal: data.result.matTotal, labTotal: data.result.labTotal,
                eqpTotal: data.result.eqpTotal, transTotal: data.result.transTotal,
                gateTotal: data.result.gateTotal || 0, bbRefund: data.result.bbRefund,
                total: data.result.total, totalPerM: data.result.totalPerM,
                monthlyRent: data.result.monthlyRent || 0, dailyRent: data.result.dailyRent || 0,
                rows: buildRows(data),
              });

              exportQuotesToExcel([
                makeSlot('견적1-실전형', practical, '실전형'),
                makeSlot('견적2-구조형', standard, '구조형'),
              ], '', new Date().toISOString().slice(0, 10));
            }}
            className="w-full py-3 rounded-lg border border-[#334155] text-[#94A3B8] font-bold hover:bg-[#111B2A] mb-6">
            📥 Excel 내역서 다운로드
          </button>
        )}

        <div className="text-xs text-[#94a3b8] bg-[#ffffff] rounded-lg p-4 border border-[#e5e7eb] leading-relaxed">⚠ 본 견적은 과거 시공 데이터 기반 예상 범위이며, 구조설계 도서가 아닙니다. 구조 조건(경간/횡대/근입 등)은 참고용이며, 실제 시공 시 현장 여건에 따라 시공업체가 조정합니다. AXIS는 구조안전 설계를 제공하지 않으며, 시공 결과에 대한 설계 책임을 지지 않습니다. 정밀 구조검토가 필요한 경우 별도의 구조설계 전문업체에 의뢰하시기 바랍니다.</div>
      </div>
    </div>
  );
}
