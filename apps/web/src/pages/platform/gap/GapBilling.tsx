import { useState, useEffect } from 'react';
import api from '../../../lib/api';
const fmt = (n: number) => n?.toLocaleString('ko-KR') ?? '-';

export default function GapBilling() {
  const [billings, setBillings] = useState<any[]>([]);
  useEffect(() => { api.get('/api/platform/billings').then(r => setBillings(r.data?.data || [])).catch(() => {
    setBillings([
      { billingId: 'BL-001', amount: 12500000, billingDate: '2026-03-15', status: '청구생성', eulPartyId: '을사A' },
      { billingId: 'BL-002', amount: 8700000, billingDate: '2026-03-10', status: '결제완료', eulPartyId: '을사B' },
    ]);
  }); }, []);

  const handlePay = async (id: string) => {
    try { await api.patch(`/api/platform/billings/${id}/pay`); setBillings(prev => prev.map(b => b.billingId === id ? { ...b, status: '결제완료' } : b)); } catch {}
  };

  const statusColor = (s: string) => s === '청구생성' ? '#F0A500' : s === '결제완료' ? '#22C55E' : '#64748B';

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl font-bold mb-6">청구·결제</h1>
      <div className="space-y-3">
        {billings.map(b => (
          <div key={b.billingId} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold font-mono">{fmt(b.amount)}원</div>
              <div className="text-xs mt-1" style={{ color: '#64748B' }}>{b.billingId} · {b.billingDate} · {b.eulPartyId}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded" style={{ background: statusColor(b.status) + '20', color: statusColor(b.status) }}>{b.status}</span>
              {b.status === '청구생성' && (
                <button onClick={() => handlePay(b.billingId)} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background: '#F0A500', color: '#070C12' }}>확인</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
