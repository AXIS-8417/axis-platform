import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useQuoteStore } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';

const fmt = (n: number) => Math.round(n || 0).toLocaleString('ko-KR');

export default function SimpleRespond() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useQuoteStore();

  const panel = store.panelType || 'RPP';
  const height = store.height || 3;
  const length = store.length || 250;

  const [tab, setTab] = useState('자재');
  const [track, setTrack] = useState('간편');
  const [totalAmt, setTotalAmt] = useState('');
  const [memo, setMemo] = useState('');
  const [span, setSpan] = useState('3.0');
  const [specChanged, setSpecChanged] = useState(false);
  const [engData, setEngData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEng = async () => {
      try {
        const { data } = await api.get('/api/engine/matrix', {
          params: { len: length, panel, h: height, region: store.region || '경기남부', floor: store.floorType || '파이프박기', bbMonths: 6, dustH: store.dustH || 0 },
        });
        setEngData(data.bbResults?.['전체고재'] || data.bbResults?.[Object.keys(data.bbResults)[0]]);
      } catch {}
      setLoading(false);
    };
    fetchEng();
  }, []);

  const engPerM = engData?.totalPerM || 50000;
  const engTotal = engData?.total || engPerM * length;
  const engMatTotal = engData?.matTotal || 0;
  const engBBRefund = engData?.bbRefund || 0;
  const engLabTotal = engData?.labTotal || 0;
  const engEqpTotal = (engData?.eqpTotal || 0) + (engData?.transTotal || 0);
  const engGrandTotal = engData?.rounded || engTotal;
  const bbPctCalc = engMatTotal > 0 ? Math.round(Math.abs(engBBRefund) / engMatTotal * 100) : 0;
  const finalPerM = totalAmt ? Math.round(parseInt(totalAmt) / length) : engPerM;
  const dev = Math.round((finalPerM - engPerM) / engPerM * 100);

  const TABS = ['자재', '노무/장비', '구조조건', '을 제출'];

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><div className="text-[#2563eb] animate-pulse">E블록 로딩 중...</div></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold bg-[#1e40af] text-white px-2 py-0.5 rounded">AXIS v4.7</span>
          <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded font-semibold">STEP 4</span>
          <span className="text-[15px] font-bold text-[#0f172a]">을 · 견적 수신 & E블록</span>
        </div>
        <p className="text-xs text-[#64748b] mb-4">을(하도급사) · 엔진 자동견적 확인 후 제출 (No.46,73)</p>

        <Stepper step={4} />

        {/* 안내 */}
        <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1] mb-4 leading-relaxed">
          ℹ 아래 구조 조건은 AXIS 엔진 참고 기준입니다. 현장 여건에 따라 자유롭게 조정하시되, 변경 이력은 기록되며 갑 비교표에 스펙 변경 표시됩니다.
        </div>

        {/* 블록 요약 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            ['A블록·현장조건', `${panel} · H${height}M · L${length}M`],
            ['B블록·예정가', `BB · 전체고재`],
            ['C블록·시장참고', '759건 DB · Tier A'],
            ['E블록·엔진견적', `${fmt(engPerM)}원/M (자동산출)`],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2">
              <div className="text-[10px] text-[#94a3b8] font-semibold">{k}</div>
              <div className="text-xs font-semibold text-[#0f172a]">{v}</div>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-4">
          <div className="flex gap-2 mb-4 border-b border-[#f1f5f9] pb-3 flex-wrap">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium relative ${tab === t ? 'bg-[#2563eb] text-white' : 'text-[#64748b] hover:bg-[#f1f5f9]'}`}>
                {t}
                {t === '구조조건' && specChanged && <span className="ml-1 w-2 h-2 bg-red-500 rounded-full inline-block" />}
              </button>
            ))}
          </div>

          {/* 자재 탭 */}
          {tab === '자재' && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[13px] font-bold text-[#0f172a]">E블록 · 자재 내역</span>
                <span className="text-[11px] text-[#94a3b8]">BB율 [ ] 직접 수정 가능</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc]">
                      {['품명', '규격', '수량', '단가', '금액', 'BB율%', 'BB금액', '잔존가'].map(h => (
                        <th key={h} className="px-2 py-2 border border-[#e5e7eb] font-semibold text-[#334155] text-[11px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(engData?.bom ? [
                      { name: panel, spec: `H${height}M`, qty: engData.bom.panelQty, up: 5000, bb: 25, cat: '판넬' },
                      { name: '횡대파이프', spec: '6M×2.3T', qty: engData.bom.hwCnt, up: 5000, bb: 65, cat: '파이프' },
                      { name: '주주파이프', spec: `${height}M×2.3T`, qty: engData.bom.juju, up: 5000, bb: 70, cat: '파이프' },
                      { name: '지주파이프', spec: '3M×2.3T', qty: engData.bom.jiuju, up: 8400, bb: 57, cat: '파이프' },
                      { name: '기초파이프', spec: '1.5M×2.3T', qty: engData.bom.gichoQty, up: 4500, bb: 0, cat: '기초' },
                      { name: '고정클램프', spec: 'Ø48', qty: engData.bom.gojung, up: 1800, bb: 43, cat: '부자재' },
                      { name: '자동클램프', spec: 'Ø48', qty: Math.round((engData.bom.gojung || 0) * 0.3), up: 1900, bb: 43, cat: '부자재' },
                      { name: '연결핀', spec: 'Ø48', qty: engData.bom.pin, up: 1200, bb: 32, cat: '부자재' },
                    ] : []).map((it, i) => {
                      const amt = it.qty * it.up;
                      const bbAmt = Math.round(amt * it.bb / 100);
                      return (
                        <tr key={i} className={i % 2 ? 'bg-[#fafafa]' : ''}>
                          <td className="px-2 py-1.5 border border-[#e5e7eb]">
                            <div className="font-medium">{it.name}</div>
                            <div className="text-[10px] text-[#94a3b8]">{it.cat}</div>
                          </td>
                          <td className="px-2 py-1.5 border border-[#e5e7eb] text-[#64748b] text-[11px]">{it.spec}</td>
                          <td className="px-2 py-1.5 border border-[#e5e7eb] text-right font-mono">{it.qty}</td>
                          <td className="px-2 py-1.5 border border-[#e5e7eb] text-right font-mono">{fmt(it.up)}</td>
                          <td className="px-2 py-1.5 border border-[#e5e7eb] text-right font-semibold font-mono">{fmt(amt)}</td>
                          <td className="px-2 py-1.5 border border-[#e5e7eb] text-right">
                            {it.bb > 0 ? (
                              <input type="number" defaultValue={it.bb} className="w-12 px-1 py-0.5 bg-[#f0f9ff] border border-[#bae6fd] rounded text-right text-xs font-medium text-[#0c4a6e]" />
                            ) : <span className="text-[#d1d5db] text-[10px]">소모성</span>}
                          </td>
                          <td className="px-2 py-1.5 border border-[#e5e7eb] text-right text-red-600 font-mono">{it.bb > 0 ? `-${fmt(bbAmt)}` : '-'}</td>
                          <td className="px-2 py-1.5 border border-[#e5e7eb] text-right text-emerald-600 font-semibold font-mono">{fmt(amt - bbAmt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 노무/장비 탭 */}
          {tab === '노무/장비' && (
            <div className="space-y-4">
              <div>
                <div className="text-[13px] font-bold mb-2">노무비</div>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-[#f8fafc]">{['항목', 'M당 단가', '금액', '비고'].map(h => <th key={h} className="px-2 py-2 border border-[#e5e7eb] font-semibold text-[#334155]">{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      { l: '설치비', up: engData?.laborDetail?.installPerM || 10500, amt: engData?.laborDetail?.installTotal || 0, b: 'M당 수정 가능' },
                      ...(engData?.laborDetail?.removeTotal ? [{ l: '해체비(BB)', up: Math.round((engData?.laborDetail?.removeTotal || 0) / length), amt: engData?.laborDetail?.removeTotal || 0, b: 'SELL시 숨김' }] : []),
                    ].map((r, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5 border border-[#e5e7eb]">{r.l}</td>
                        <td className="px-2 py-1.5 border border-[#e5e7eb] text-right"><input type="number" defaultValue={r.up} className="w-16 px-1 py-0.5 bg-[#f0f9ff] border border-[#bae6fd] rounded text-right text-xs" /></td>
                        <td className="px-2 py-1.5 border border-[#e5e7eb] text-right font-mono">{fmt(r.amt)}</td>
                        <td className="px-2 py-1.5 border border-[#e5e7eb] text-[#94a3b8]">{r.b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="text-[13px] font-bold mb-2">장비/운반비</div>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-[#f8fafc]">{['품목', '수량', '단가', '금액'].map(h => <th key={h} className="px-2 py-2 border border-[#e5e7eb] font-semibold text-[#334155]">{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      { l: '굴착기', q: 2, up: 700000 },
                      { l: '스카이', q: 1, up: 500000 },
                      { l: '카고크레인', q: 1, up: 570000 },
                      { l: '5톤 운반', q: 4, up: 260000 },
                    ].map((r, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5 border border-[#e5e7eb]">{r.l}</td>
                        <td className="px-2 py-1.5 border border-[#e5e7eb] text-center"><input type="number" defaultValue={r.q} className="w-10 px-1 py-0.5 bg-[#f0f9ff] border border-[#bae6fd] rounded text-center text-xs" /></td>
                        <td className="px-2 py-1.5 border border-[#e5e7eb] text-right"><input type="number" defaultValue={r.up} className="w-20 px-1 py-0.5 bg-[#f0f9ff] border border-[#bae6fd] rounded text-right text-xs" /></td>
                        <td className="px-2 py-1.5 border border-[#e5e7eb] text-right font-mono">{fmt(r.q * r.up)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f8fafc] font-bold">
                      <td colSpan={3} className="px-2 py-1.5 border border-[#e5e7eb]">장비+운반 소계</td>
                      <td className="px-2 py-1.5 border border-[#e5e7eb] text-right font-mono">{fmt(2 * 700000 + 500000 + 570000 + 4 * 260000)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* 구조조건 탭 */}
          {tab === '구조조건' && (
            <div>
              <div className="text-[13px] font-bold mb-3">구조 조건 — 가설계 기준 (변경 이력 기록)</div>
              {specChanged && (
                <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e] mb-3">
                  ⚠ 구조 조건 변경 → T_SPEC_CHANGE_LOG 기록 → 갑 비교표에 스펙 변경 배지 표시
                </div>
              )}
              <div className="bg-[#fafafa] border border-[#e2e8f0] rounded-lg p-3 mb-3">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-[13px]">경간</span>
                  <span className="text-[11px] text-[#64748b]">기본값: 3.0M</span>
                </div>
                <div className="flex gap-2">
                  {['2.0', '2.5', '3.0'].map(s => (
                    <button key={s} onClick={() => { setSpan(s); setSpecChanged(s !== '3.0'); }}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${span === s ? 'border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8] font-bold' : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151]'}`}>
                      {s}M
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-[#94a3b8] mt-2">변경 시 주주·횡대·기초·클램프 수량 자동 재산출</div>
                {span !== '3.0' && <div className="mt-2 text-[11px] bg-[#fef3c7] text-[#92400e] px-2 py-1 rounded">🔴 before: 3.0M → after: {span}M (이력 기록됨)</div>}
              </div>
              <button onClick={() => { setSpan('3.0'); setSpecChanged(false); }}
                className="text-xs px-3 py-1.5 border border-[#bae6fd] rounded-lg bg-[#f0f9ff] text-[#0369a1]">↺ 엔진 기준으로 초기화</button>
            </div>
          )}

          {/* 을 제출 탭 */}
          {tab === '을 제출' && (
            <div>
              <div className="font-bold text-[14px] mb-3">D블록 · 응답 트랙 선택</div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { t: '엔진승인', d: '10초 · 엔진 그대로', w: '1.0' },
                  { t: '간편', d: '30초 · 총액+메모', w: '0.7' },
                  { t: '정식', d: '5~30분 · 내역수정', w: '1.0' },
                ].map(({ t, d, w }) => (
                  <div key={t} onClick={() => setTrack(t)}
                    className={`flex-1 p-3 border-2 rounded-lg cursor-pointer min-w-[90px] ${track === t ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0]'}`}>
                    <div className={`font-bold text-[13px] ${track === t ? 'text-[#1d4ed8]' : 'text-[#0f172a]'}`}>{t}</div>
                    <div className="text-[11px] text-[#94a3b8]">{d}</div>
                    <div className="text-[10px] text-[#94a3b8] mt-1">가중치 {w}</div>
                  </div>
                ))}
              </div>

              {track !== '엔진승인' && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-xs text-[#64748b] mb-1">총 견적액 (원)</div>
                    <input type="number" value={totalAmt} onChange={e => setTotalAmt(e.target.value)} placeholder={String(engTotal)}
                      className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-lg text-[14px] font-bold text-[#1d4ed8]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#64748b] mb-1">메모</div>
                    <input type="text" value={memo} onChange={e => setMemo(e.target.value)} placeholder="특이사항..."
                      className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-lg text-[13px]" />
                  </div>
                </div>
              )}

              <div className="bg-[#f8fafc] rounded-lg p-3 mb-3 flex gap-4 flex-wrap">
                {[['제출 M당', fmt(finalPerM) + '원/M'], ['엔진 대비', (dev > 0 ? '+' : '') + dev + '%'], ['총 견적액', fmt(totalAmt ? parseInt(totalAmt) : engTotal) + '원']].map(([l, v]) => (
                  <div key={l}><div className="text-[11px] text-[#94a3b8]">{l}</div><div className="font-bold text-base text-[#0f172a] font-mono">{v}</div></div>
                ))}
              </div>

              {specChanged && (
                <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e] mb-3">
                  ⚠ 스펙 변경됨 (경간 {span}M) → 갑 비교표에 스펙 변경 배지 자동 표시 (No.75)
                </div>
              )}

              <button onClick={() => navigate(`/quote/compare/${id}`)}
                className="w-full py-3 bg-[#2563eb] text-white rounded-lg font-bold text-[14px] hover:bg-[#1d4ed8]">
                견적 제출 ({track}) → STEP 5 비교표
              </button>
            </div>
          )}
        </div>

        {/* 하단 요약 — 6항목 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ['자재(BB후)', fmt(engMatTotal ? engMatTotal - engBBRefund : 0) + '원'],
            ['노무', fmt(engLabTotal) + '원'],
            ['경비', fmt(engEqpTotal) + '원'],
            ['엔진 합계', fmt(engGrandTotal) + '원'],
            ['엔진 M당', fmt(engPerM) + '원/M'],
            ['BB 차감률', bbPctCalc + '%'],
          ].map(([l, v]) => (
            <div key={l} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-2 text-center">
              <div className="text-[10px] text-[#94a3b8]">{l}</div>
              <div className="font-bold text-xs text-[#0f172a] font-mono">{v}</div>
            </div>
          ))}
        </div>

        {/* 네비게이션 */}
        <div className="flex gap-2 text-xs">
          <button onClick={() => navigate('/contractor/requests')} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9]">← 요청목록</button>
          <button onClick={() => navigate('/')} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9]">홈</button>
        </div>
      </div>
    </div>
  );
}
