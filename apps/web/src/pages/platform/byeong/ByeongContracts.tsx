import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function ByeongContracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/platform/contracts');
        setContracts(res.data?.items || []);
        setError(null);
      } catch (e: any) {
        if (e?.response?.status === 403) {
          setError('갑 역할은 근로계약 정보를 조회할 수 없습니다.');
        } else {
          setContracts([]);
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const statusColor = (s: string) => {
    if (s === '서명완료') return '#22C55E';
    if (s === '생성' || s === '링크전송') return '#F0A500';
    return '#64748B';
  };

  return (
    <div className="p-4 md:p-8" style={{ background:'#070C12', minHeight:'100vh', color:'#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-4">근로계약</h1>
      <div className="mb-6 p-4 rounded-lg" style={{ background:'#3B82F615', border:'1px solid #3B82F640', color:'#3B82F6' }}>
        <div className="text-sm font-semibold">본 근로계약 내용은 을·병 당사자만 열람 가능합니다.</div>
        <div className="text-xs mt-1 opacity-80">갑(발주자)에게는 제공되지 않습니다.</div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg" style={{ background:'#EF444420', border:'1px solid #EF4444', color:'#EF4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>로딩 중...</div>
      ) : contracts.length === 0 && !error ? (
        <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>근로계약 내역이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {contracts.map((c: any) => (
            <div key={c.contractId} style={{ background:'#0C1520', border:`1px solid ${c.sealId ? '#8B5CF6' : '#1E293B'}` }} className="rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">
                    {c.sealId ? '🔒 ' : ''}{c.contractId} · {c.contractType || '-'} · {c.signRoute || '-'}
                  </div>
                  <div className="text-xs mt-1" style={{ color:'#64748B' }}>
                    {c.workerName || '-'} · {c.startDate?.slice(0,10) || '-'} · {c.amount?.toLocaleString() || '-'}원
                  </div>
                  <div className="text-xs mt-1" style={{ color:'#94A3B8' }}>
                    서명방법: {c.signMethod || c.workerSignMethod || '-'} · 상태: <span style={{ color: statusColor(c.status) }}>{c.status || '-'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {c.sealId && <span className="text-xs px-2 py-1 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>🔒 봉인</span>}
                  {c.copyDelivered && <span className="text-xs" style={{ color:'#22C55E' }}>사본교부 ✓</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
