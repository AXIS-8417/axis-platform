import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const MOCK_BILLINGS = [
  { billingId: 'BIL-MOCK01', workId: 'WO-001', amount: 2500000, status: '청구생성', siteId: 'SITE-001', createdAt: '2026-03-18' },
  { billingId: 'BIL-MOCK02', workId: 'WO-002', amount: 1800000, status: '결제완료', siteId: 'SITE-002', createdAt: '2026-03-15', paidAt: '2026-03-17' },
];

const BILLING_STEPS = ['시공완료', '봉인', '청구생성', '결제요청', '결제완료', '수령확인'] as const;

const stepStatusMap: Record<string, number> = {
  '시공완료': 0,
  '봉인': 1,
  '청구생성': 2,
  '결제요청': 3,
  '결제완료': 4,
  '수령확인': 5,
};

export default function EulSettlement() {
  const [billings, setBillings] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  // Form state
  const [formWorkId, setFormWorkId] = useState('');
  const [formSiteId, setFormSiteId] = useState('');
  const [formGapPartyId, setFormGapPartyId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNote, setFormNote] = useState('');

  const loadBillings = () => {
    api.get('/api/platform/billings').then(r => setBillings(r.data?.items || r.data?.data || []))
      .catch(() => setBillings(MOCK_BILLINGS));
  };

  useEffect(() => {
    loadBillings();
    api.get('/api/platform/work-orders').then(r => setWorkOrders(r.data?.items || r.data?.data || []))
      .catch(() => setWorkOrders([{ workId: 'WO-001', siteId: 'SITE-001' }]));
  }, []);

  const handleCreate = async () => {
    if (!formWorkId || !formAmount) { alert('작업지시와 금액은 필수입니다.'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/platform/billings', {
        workId: formWorkId,
        siteId: formSiteId,
        gapPartyId: formGapPartyId,
        amount: Number(formAmount),
        note: formNote,
      });
      setShowCreate(false);
      setFormWorkId(''); setFormAmount(''); setFormNote(''); setFormSiteId(''); setFormGapPartyId('');
      loadBillings();
    } catch (e: any) {
      alert(e?.response?.data?.error || '청구 생성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' };

  return (
    <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">정산</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#00D9CC', color: '#070C12' }}>
          {showCreate ? '취소' : '+ 청구 생성'}
        </button>
      </div>

      {/* 6-step flow */}
      <div className="mb-8 p-4 rounded-lg" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
        <div className="text-xs mb-3 font-semibold" style={{ color: '#64748B' }}>정산 6단계 흐름</div>
        <div className="flex items-center gap-2">
          {BILLING_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#00D9CC20', color: '#00D9CC', border: '1px solid #00D9CC' }}>
                {i + 1}
              </div>
              <span className="text-xs" style={{ color: '#00D9CC' }}>{s}</span>
              {i < BILLING_STEPS.length - 1 && <div className="w-8 h-0.5" style={{ background: '#334155' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Creation form */}
      {showCreate && (
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#00D9CC' }}>새 청구 생성</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>작업지시</label>
              <select value={formWorkId} onChange={e => { setFormWorkId(e.target.value); const wo = workOrders.find((w: any) => w.workId === e.target.value); if (wo) setFormSiteId(wo.siteId || ''); }}
                className="w-full px-3 py-2 rounded" style={inputStyle}>
                <option value="">선택</option>
                {workOrders.map((w: any) => <option key={w.workId} value={w.workId}>{w.workId}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>현장ID</label>
              <input value={formSiteId} onChange={e => setFormSiteId(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>갑 PartyID</label>
              <input value={formGapPartyId} onChange={e => setFormGapPartyId(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="예: PARTY-001" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>금액 (원)</label>
              <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>비고</label>
              <textarea value={formNote} onChange={e => setFormNote(e.target.value)} rows={2} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={submitting} className="mt-4 px-6 py-2 rounded text-sm font-bold"
            style={{ background: '#00D9CC', color: '#070C12', opacity: submitting ? 0.5 : 1 }}>
            {submitting ? '생성중...' : '청구 생성'}
          </button>
        </div>
      )}

      {/* Billing list */}
      <div className="space-y-3">
        {billings.map(b => {
          const currentStep = stepStatusMap[b.status] ?? 2;
          const statusColor = b.status === '결제완료' ? '#22C55E' : b.status === '청구생성' ? '#F0A500' : '#00D9CC';
          return (
            <div key={b.billingId} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-sm">{b.billingId}</div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {b.workId} | {b.siteId || '-'} | {b.amount ? `${Number(b.amount).toLocaleString()}원` : '-'}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded font-mono" style={{ background: statusColor + '20', color: statusColor }}>{b.status}</span>
              </div>
              {/* Mini step progress */}
              <div className="flex items-center gap-0.5">
                {BILLING_STEPS.map((_, i) => (
                  <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= currentStep ? '#00D9CC' : '#1E293B' }} />
                ))}
              </div>
              <div className="text-xs mt-2" style={{ color: '#64748B' }}>
                현재: {BILLING_STEPS[currentStep] || b.status}
                {b.paidAt ? ` | 결제일: ${new Date(b.paidAt).toLocaleDateString()}` : ''}
              </div>
            </div>
          );
        })}
        {billings.length === 0 && <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>청구 내역이 없습니다.</div>}
      </div>
    </div>
  );
}
