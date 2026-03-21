import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useQuoteStore } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';

const REGION_DB: Record<string, {Vo:number}> = {
  서울:{Vo:26},경기북부:{Vo:26},경기남부:{Vo:26},경기서해안:{Vo:28},인천:{Vo:28},
  강원내륙:{Vo:24},강원해안:{Vo:34},충청:{Vo:28},충남서해:{Vo:34},전라:{Vo:30},
  경상:{Vo:30},부산:{Vo:38},제주:{Vo:42},
};

function fmt(n: number) { return n?.toLocaleString('ko-KR') ?? '-'; }

// 구조판정 계산
function calcStructure(Vo: number, h: number, span: number, embedM: number, panel: string) {
  const pf = 0.5 * 0.122 * Math.pow(Vo / 10, 2) * 2.2;
  const pw: Record<string, number> = { RPP: 0.45, EGI: 0.35, '스틸': 0.55 };
  const p = pw[panel] || 0.45;
  const bk01 = pf * span * span * 0.5 / (p * 8 * 0.28);
  const bk02 = pf * h * span / (p * 14);
  const bk03 = pf * h * span / (embedM * embedM * 16);
  const bk04 = embedM >= 2.0 ? 2.6 : 2.1;
  const grade = (v: number, lo: number, hi: number) => v >= hi ? 'NG' : v >= lo ? 'WARN' : 'PASS';
  const checks = [
    { name: 'BK_01 횡대 합성응력', val: bk01, status: grade(bk01, 0.85, 1.0), max: 1.5 },
    { name: 'BK_02 지주 응력비', val: bk02, status: grade(bk02, 0.75, 0.90), max: 1.2 },
    { name: 'BK_03 말뚝 응력비', val: bk03, status: grade(bk03, 0.75, 0.90), max: 1.2 },
    { name: 'BK_04 인발 안전율', val: bk04, status: bk04 >= 3.0 ? 'NG' : bk04 >= 1.5 ? 'PASS' : 'WARN', max: 4.0 },
  ];
  const ngCount = checks.filter(c => c.status === 'NG').length;
  const warnCount = checks.filter(c => c.status === 'WARN').length;
  const overall = ngCount >= 1 ? 'F(부적합)' : warnCount >= 2 ? 'D(위험경계)' : warnCount === 1 ? 'C(경계)' : 'A(안전)';
  return { checks, overall };
}

// 환경판정 계산
function calcEnvironment(panel: string, h: number, mode: string, found: string, embedM: number) {
  const noiseDB: Record<string, number> = { '스틸': 38, RPP: 33, EGI: 22 };
  const dustBase: Record<string, number> = { '스틸': 86, RPP: 79, EGI: 62 };
  const noise = noiseDB[panel] || 33;
  const dust = Math.min(98, (dustBase[panel] || 79) + (h >= 5 ? 10 : h >= 4 ? 5 : 0));
  const vibBase = found === '앵커볼트' ? 84 : embedM >= 2 ? 78 : 70;
  const vib = Math.min(98, vibBase + (panel === '스틸' ? 5 : 0));
  const wind = mode === '표준형' ? 89 : 80;
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

  const fetchPremium = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/engine/premium', {
        params: { len, panel, h, region, floor, bbMonths, asset: '전체고재', contract: '바이백', dustH: store.dustH || 0 },
      });
      setPractical(data['실전형']); setStandard(data['표준형']);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPremium(); }, [bbMonths]);

  const regionData = REGION_DB[region] || { Vo: 26 };

  const structP = practical?.design ? calcStructure(regionData.Vo, h, practical.design.span, practical.design.embedM, panel) : null;
  const structS = standard?.design ? calcStructure(regionData.Vo, h, standard.design.span, standard.design.embedM, panel) : null;
  const envP = practical?.design ? calcEnvironment(panel, h, '실전형', practical.design.found, practical.design.embedM) : null;
  const envS = standard?.design ? calcEnvironment(panel, h, '표준형', standard.design.found, standard.design.embedM) : null;

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

        {/* 실전형 vs 표준형 */}
        <div className="flex gap-4 mb-6">
          <Card title="실전형 (기본)" data={practical} color="border-[#2563eb]/50" />
          <Card title="표준형 (구조보강)" data={standard} color="border-[#d97706]/50" />
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
            const isBB = store.selectedCellKey?.includes('BB') || store.selectedCellKey?.includes('바이백');

            return (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#e5e7eb]"><th className="text-left py-2 text-[#94a3b8]">항목</th><th className="text-right py-2 text-[#2563eb]">실전형</th><th className="text-right py-2 text-[#d97706]">표준형</th></tr></thead>
                <tbody>
                  {[
                    ['자재비/M', pR.matM, sR.matM],
                    ['노무비/M', pR.labM, sR.labM],
                    ['자재 합계', pR.matTotal, sR.matTotal],
                    ['노무 합계', pR.labTotal, sR.labTotal],
                  ].map(([label, p, s], i) => (
                    <tr key={i} className="border-b border-[#e5e7eb]/30"><td className="py-2">{label as string}</td><td className="text-right font-mono">{fmt(p as number)}원</td><td className="text-right font-mono">{fmt(s as number)}원</td></tr>
                  ))}
                  {/* 경비 통합 행 */}
                  <tr className="border-b border-[#e5e7eb]/30 cursor-pointer hover:bg-[#f8fafc]" onClick={() => setGyeongbiOpen(!gyeongbiOpen)}>
                    <td className="py-2 font-semibold">
                      경비 <span className="text-[10px] text-[#94a3b8] ml-1">{gyeongbiOpen ? '▲ 접기' : '▼ 상세보기'}</span>
                    </td>
                    <td className="text-right font-mono font-semibold">{fmt(pGyeongbi)}원</td>
                    <td className="text-right font-mono font-semibold">{fmt(sGyeongbi)}원</td>
                  </tr>
                  {gyeongbiOpen && (
                    <>
                      <tr className="border-b border-[#e5e7eb]/10 bg-[#f8fafc]">
                        <td className="py-1.5 pl-4 text-xs text-[#64748b]">├ 굴착기(0.4m³) 1대</td>
                        <td className="text-right font-mono text-xs text-[#64748b]">{fmt(pR.eqpTotal || 0)}원</td>
                        <td className="text-right font-mono text-xs text-[#64748b]">{fmt(sR.eqpTotal || 0)}원</td>
                      </tr>
                      {pTrans.trucks > 0 && (
                        <>
                          <tr className="border-b border-[#e5e7eb]/10 bg-[#f8fafc]">
                            <td className="py-1.5 pl-4 text-xs text-[#64748b]">├ 5t카고 {pTrans.trucks}대 × {fmt(pTrans.perTruck)}원 (편도)</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(pTrans.trucks * pTrans.perTruck)}원</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt((sTrans.trucks || pTrans.trucks) * (sTrans.perTruck || pTrans.perTruck))}원</td>
                          </tr>
                          {isBB && (
                            <tr className="border-b border-[#e5e7eb]/10 bg-[#f8fafc]">
                              <td className="py-1.5 pl-4 text-xs text-[#64748b]">└ 5t카고 {pTrans.trucks}대 × {fmt(pTrans.perTruck)}원 (복로-바이백)</td>
                              <td className="text-right font-mono text-xs text-[#64748b]">{fmt(pTrans.trucks * pTrans.perTruck)}원</td>
                              <td className="text-right font-mono text-xs text-[#64748b]">{fmt((sTrans.trucks || pTrans.trucks) * (sTrans.perTruck || pTrans.perTruck))}원</td>
                            </tr>
                          )}
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
                </tbody>
              </table>
            );
          })()}
          {tab === 'design' && practical?.design && standard?.design && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#e5e7eb]"><th className="text-left py-2 text-[#94a3b8]">조건</th><th className="text-right text-[#2563eb]">실전형</th><th className="text-right text-[#d97706]">표준형</th></tr></thead>
              <tbody>
                {[['경간',practical.design.span+'M',standard.design.span+'M'],['지주간격',practical.design.jiju,standard.design.jiju],['보조지주',practical.design.bojo,standard.design.bojo],['횡대',practical.design.hwangdae+'단',standard.design.hwangdae+'단'],['기초',practical.design.found,standard.design.found],['기초파이프',(practical.design.gichoLength??'-')+'M',(standard.design.gichoLength??'-')+'M'],['구조타입',practical.design.structType,standard.design.structType]].map(([label,p,s],i)=>(
                  <tr key={i} className="border-b border-[#e5e7eb]/30"><td className="py-2">{label as string}</td><td className="text-right font-mono">{p as string}</td><td className="text-right font-mono">{s as string}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'struct' && structP && structS && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{title:'실전형',data:structP,color:'#2563eb'},{title:'표준형',data:structS,color:'#d97706'}].map(({title,data,color})=>(
                <div key={title}>
                  <h4 className="font-mono font-bold mb-3" style={{color}}>{title} — {data.overall}</h4>
                  {data.checks.map((ck: any)=>(
                    <div key={ck.name} className="mb-3">
                      <div className="flex justify-between text-xs mb-1"><span>{ck.name}</span><span className={statusColor(ck.status)}>{ck.val.toFixed(3)} {ck.status}</span></div>
                      <div className="h-2 bg-[#e5e7eb] rounded"><div className={`h-2 rounded ${barColor(ck.status)}`} style={{width:`${Math.min(100,ck.val/ck.max*100)}%`}}/></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {tab === 'env' && envP && envS && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{title:'실전형',data:envP,color:'#2563eb'},{title:'표준형',data:envS,color:'#d97706'}].map(({title,data,color})=>(
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
          <button onClick={()=>navigate(`/quote/level/${id}`)} className="flex-1 py-3 rounded-lg border border-[#d97706] text-[#d97706] font-bold hover:bg-[#d97706]/10">표준형 선택</button>
        </div>

        <div className="text-xs text-[#94a3b8] bg-[#ffffff] rounded-lg p-4 border border-[#e5e7eb]">⚠ 구조판정/환경판정은 참고용이며 실제 구조설계가 아닙니다.</div>
      </div>
    </div>
  );
}
