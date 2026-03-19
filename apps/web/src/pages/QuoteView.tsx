import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

function fmt(n: number): string { return n?.toLocaleString('ko-KR') ?? '-'; }

const DISCLAIMER = `※ 본 검토 결과는 AXIS 엔진의 자동 산출값으로, `
  + `실제 시공에 적용하기 위한 법적 구조검토서를 대체하지 않습니다. `
  + `현장 조건(지반, 풍하중, 하중조건 등)에 따라 결과가 달라질 수 있으므로, `
  + `정밀 시공 시에는 반드시 전문 구조기술사의 검토를 받으시기 바랍니다. `
  + `본 자료는 견적 참고용이며, AXIS 및 제공자는 본 결과의 활용으로 인한 `
  + `어떠한 손해에 대해서도 책임을 지지 않습니다.`;

export default function QuoteView() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/quotes/view/${id}`);
        setData(res.data);
      } catch { setError('견적을 찾을 수 없습니다.'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#070C12' }}><div style={{ color: '#00D9CC' }} className="font-mono animate-pulse">불러오는 중...</div></div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#070C12' }}><div style={{ color: '#EF4444' }}>{error}</div></div>;

  const r = data.result;
  const inp = data.input;

  return (
    <div className="min-h-screen" style={{ background: '#070C12', color: '#F1F5F9' }}>
      {/* Header */}
      <div style={{ background: '#0C1520', borderBottom: '1px solid #1E293B' }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <span style={{ color: '#00D9CC' }} className="font-mono font-bold text-xl">AXIS</span>
          <span style={{ color: '#64748B' }}>견적서</span>
          {data.projectName && <span style={{ color: '#F0A500' }} className="text-sm font-semibold">— {data.projectName}</span>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 블록 1: 재노경 M당 단가표 */}
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>1. 가설울타리공사</h2>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th className="text-left py-2" style={{ color: '#64748B' }}>명칭</th>
                <th className="text-right py-2" style={{ color: '#64748B' }}>단위</th>
                <th className="text-right py-2" style={{ color: '#64748B' }}>수량</th>
                <th className="text-right py-2" style={{ color: '#64748B' }}>재료비/M</th>
                <th className="text-right py-2" style={{ color: '#64748B' }}>노무비/M</th>
                <th className="text-right py-2" style={{ color: '#64748B' }}>경비/M</th>
                <th className="text-right py-2" style={{ color: '#00D9CC' }}>합계/M</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #1E293B' }}>
                <td className="py-2">견적 통합</td>
                <td className="text-right font-mono">M</td>
                <td className="text-right font-mono">{inp.length}</td>
                <td className="text-right font-mono">{fmt(r.matPerM)}</td>
                <td className="text-right font-mono">{fmt(r.labPerM)}</td>
                <td className="text-right font-mono">{fmt(r.expPerM)}</td>
                <td className="text-right font-mono font-semibold" style={{ color: '#00D9CC' }}>{fmt(r.totalPerM)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 flex justify-between text-sm" style={{ color: '#94A3B8' }}>
            <span>총공급가액</span>
            <span className="font-mono font-semibold" style={{ color: '#F1F5F9' }}>{fmt(r.finalTotal)}원</span>
          </div>
          {r.bbTotal !== 0 && (
            <div className="flex justify-between text-sm" style={{ color: '#EF4444' }}>
              <span>BB차감</span>
              <span className="font-mono">{fmt(r.bbTotal)}원</span>
            </div>
          )}
        </div>

        {/* 블록 2: 설계 코멘트 */}
        {data.designComments?.length > 0 && (
          <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#F0A500' }}>설계 조건</h2>
            {data.designComments.map((c: string, i: number) => (
              <div key={i} className="text-sm mb-1" style={{ color: '#94A3B8' }}>· {c}</div>
            ))}
          </div>
        )}

        {/* 블록 3: 면책 */}
        <div style={{ background: '#111B2A', border: '1px solid #1E293B' }} className="rounded-lg p-5 mb-8">
          <p style={{ color: '#475569' }} className="text-xs leading-relaxed">{DISCLAIMER}</p>
        </div>

        {/* CTA 배너 */}
        <div style={{ background: 'linear-gradient(135deg, #0C1520 0%, #111B2A 100%)', border: '1px solid #00D9CC' }}
          className="rounded-lg p-6 text-center">
          <p className="text-lg font-semibold mb-2">이 견적이 적정한지 직접 확인하세요</p>
          <p style={{ color: '#94A3B8' }} className="text-sm mb-5">AXIS 엔진으로 759건의 시공 데이터 기반 검증</p>
          <div className="flex gap-3 justify-center">
            <Link to="/quote/new"
              style={{ background: '#00D9CC', color: '#070C12' }}
              className="px-6 py-3 rounded-lg font-semibold hover:opacity-90">
              AXIS로 무료 견적 검증하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
