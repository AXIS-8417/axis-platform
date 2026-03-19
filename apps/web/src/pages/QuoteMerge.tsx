import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';

function fmt(n: number): string { return n?.toLocaleString('ko-KR') ?? '-'; }

export default function QuoteMerge() {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  const [merged, setMerged] = useState<any>(null);
  const [memos, setMemos] = useState<string[]>(ids.map(() => ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMerge = async () => {
    if (ids.length < 1) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/quotes/merge', { sourceIds: ids, memos });
      setMerged(data);
    } catch (e: any) { setError(e.response?.data?.error || '합산에 실패했습니다.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (ids.length > 0) handleMerge(); }, []);

  if (!ids.length) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#070C12', color: '#94A3B8' }}>
      선택된 견적이 없습니다. <Link to="/quotes" style={{ color: '#00D9CC' }} className="ml-2 hover:underline">돌아가기</Link>
    </div>
  );

  const r = merged?.mergedResult;

  return (
    <div className="min-h-screen" style={{ background: '#070C12', color: '#F1F5F9' }}>
      <div style={{ background: '#0C1520', borderBottom: '1px solid #1E293B' }} className="px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" style={{ color: '#00D9CC' }} className="font-mono font-bold text-xl">AXIS</Link>
          <span style={{ color: '#64748B' }}>/</span>
          <h1 className="text-lg font-semibold">합산 견적서</h1>
          <span style={{ color: '#64748B' }} className="text-sm">{ids.length}건 합산</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading && <div className="text-center py-20 font-mono animate-pulse" style={{ color: '#00D9CC' }}>합산 계산 중...</div>}
        {error && <div className="text-center py-20" style={{ color: '#EF4444' }}>{error}</div>}

        {r && (
          <>
            {/* 1. 가설울타리공사 */}
            <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-4">
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>1. 가설울타리공사</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th className="text-left py-2" style={{ color: '#64748B' }}>명칭</th>
                    <th className="text-left py-2" style={{ color: '#64748B' }}>메모</th>
                    <th className="text-right py-2" style={{ color: '#64748B' }}>단위</th>
                    <th className="text-right py-2" style={{ color: '#64748B' }}>수량</th>
                    <th className="text-right py-2" style={{ color: '#64748B' }}>재료비/M</th>
                    <th className="text-right py-2" style={{ color: '#64748B' }}>노무비/M</th>
                    <th className="text-right py-2" style={{ color: '#64748B' }}>경비/M</th>
                    <th className="text-right py-2" style={{ color: '#00D9CC' }}>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {r.items?.map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td className="py-2 text-sm">{item.label}{item.projectName ? ` (${item.projectName})` : ''}</td>
                      <td className="py-2">
                        <input type="text" value={memos[i] || item.memo || ''} onChange={e => { const m = [...memos]; m[i] = e.target.value; setMemos(m); }}
                          placeholder="구간 메모" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }}
                          className="px-2 py-1 rounded text-xs w-28" />
                      </td>
                      <td className="text-right font-mono">{item.unit}</td>
                      <td className="text-right font-mono">{item.qty}</td>
                      <td className="text-right font-mono">{fmt(item.matPrice)}</td>
                      <td className="text-right font-mono">{fmt(item.labPrice)}</td>
                      <td className="text-right font-mono">{fmt(item.expPrice)}</td>
                      <td className="text-right font-mono font-semibold" style={{ color: '#00D9CC' }}>{fmt(item.totalAmt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. 출입문공사 */}
            {r.doors?.length > 0 && (
              <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-4">
                <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>2. 출입문공사</h2>
                {r.doors.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1" style={{ borderBottom: '1px solid #1E293B' }}>
                    <span>{d.label}</span>
                    <span className="font-mono">{fmt(d.totalAmt)}원</span>
                  </div>
                ))}
              </div>
            )}

            {/* 소계 */}
            <div style={{ background: '#111B2A', border: '1px solid #334155' }} className="rounded-lg p-6">
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>소 계</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: '#94A3B8' }}>총연장</span><span className="font-mono font-semibold">{fmt(r.totalLength)}M</span></div>
                <div></div>
                <div className="flex justify-between"><span style={{ color: '#94A3B8' }}>재료비</span><span className="font-mono">{fmt(r.matTotal)}원</span></div>
                <div className="flex justify-between"><span style={{ color: '#94A3B8' }}>노무비</span><span className="font-mono">{fmt(r.labTotal)}원</span></div>
                <div className="flex justify-between"><span style={{ color: '#94A3B8' }}>경비</span><span className="font-mono">{fmt(r.equipTotal + r.transTotal)}원</span></div>
                {r.doorTotal > 0 && <div className="flex justify-between"><span style={{ color: '#94A3B8' }}>도어비</span><span className="font-mono">{fmt(r.doorTotal)}원</span></div>}
                <div className="flex justify-between col-span-2 pt-2" style={{ borderTop: '1px solid #334155' }}>
                  <span style={{ color: '#94A3B8' }}>총공급가액</span><span className="font-mono font-semibold">{fmt(r.grandTotal)}원</span>
                </div>
                {r.bbTotal !== 0 && (
                  <div className="flex justify-between col-span-2" style={{ color: '#EF4444' }}>
                    <span>BB차감</span><span className="font-mono">{fmt(r.bbTotal)}원</span>
                  </div>
                )}
                <div className="flex justify-between col-span-2 pt-2" style={{ borderTop: '1px solid #334155' }}>
                  <span className="font-semibold text-lg">최종금액</span>
                  <span className="font-mono font-bold text-lg" style={{ color: '#00D9CC' }}>{fmt(r.finalTotal)}원</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Link to="/quotes" className="px-6 py-3 rounded-lg text-sm" style={{ border: '1px solid #334155', color: '#94A3B8' }}>
                돌아가기
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
