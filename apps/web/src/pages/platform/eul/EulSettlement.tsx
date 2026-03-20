import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };
const inputStyle = { background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' };

const MOCK_BILLINGS = [
  { billingId: 'BIL-MOCK01', workId: 'WO-001', amount: 2500000, status: '\uccad\uad6c\uc0dd\uc131', siteId: 'SITE-001', createdAt: '2026-03-18' },
  { billingId: 'BIL-MOCK02', workId: 'WO-002', amount: 1800000, status: '\uacb0\uc81c\uc644\ub8cc', siteId: 'SITE-002', createdAt: '2026-03-15', paidAt: '2026-03-17' },
];

const BILLING_STEPS = ['\uc2dc\uacf5\uc644\ub8cc', '\ubd09\uc778', '\uccad\uad6c\uc0dd\uc131', '\uacb0\uc81c\uc694\uccad', '\uacb0\uc81c\uc644\ub8cc', '\uc218\ub839\ud655\uc778'] as const;

const stepStatusMap: Record<string, number> = {
  '\uc2dc\uacf5\uc644\ub8cc': 0,
  '\ubd09\uc778': 1,
  '\uccad\uad6c\uc0dd\uc131': 2,
  '\uacb0\uc81c\uc694\uccad': 3,
  '\uacb0\uc81c\uc644\ub8cc': 4,
  '\uc218\ub839\ud655\uc778': 5,
};

interface BuybackRecord {
  buybackId: string;
  materialType: string;
  quantity: number;
  unit: string;
  originalCost: number;
  estimatedRefund: number;
  usageMonths: number;
  status: '\uc0b0\uc815\uc911' | '\ud655\uc815' | '\ud68c\uc218\uc644\ub8cc';
}

const MOCK_BUYBACKS: BuybackRecord[] = [
  { buybackId: 'BB-001', materialType: 'RPP \ud328\ub110 (1200x2400)', quantity: 40, unit: '\uc7a5', originalCost: 12000000, estimatedRefund: 7200000, usageMonths: 6, status: '\ud655\uc815' },
  { buybackId: 'BB-002', materialType: 'CLP \ud074\ub7a8\ud504', quantity: 120, unit: '\uac1c', originalCost: 3600000, estimatedRefund: 1800000, usageMonths: 8, status: '\uc0b0\uc815\uc911' },
  { buybackId: 'BB-003', materialType: 'SNB \ubc29\uc74c\ud328\ub110 (600x1800)', quantity: 25, unit: '\uc7a5', originalCost: 5000000, estimatedRefund: 3500000, usageMonths: 3, status: '\ud68c\uc218\uc644\ub8cc' },
];

interface MonthlyRentalRecord {
  rentalId: string;
  gateInfo: string;
  site: string;
  monthlyRental: number;
  startDate: string;
  status: '\uc784\ub300\uc911' | '\ubc18\ub0a9\uc644\ub8cc' | '\uc5f0\uccb4';
}

const MOCK_RENTALS: MonthlyRentalRecord[] = [
  { rentalId: 'MR-001', gateInfo: 'GATE-A (\uc815\ubb38)', site: '\ud30c\uc8fc OO\uc544\ud30c\ud2b8', monthlyRental: 450000, startDate: '2026-01-15', status: '\uc784\ub300\uc911' },
  { rentalId: 'MR-002', gateInfo: 'GATE-B (\ud6c4\ubb38)', site: '\ud30c\uc8fc OO\uc544\ud30c\ud2b8', monthlyRental: 350000, startDate: '2026-02-01', status: '\uc784\ub300\uc911' },
  { rentalId: 'MR-003', gateInfo: 'GATE-C (\uc790\uc7ac\ubc18\uc785)', site: '\uc218\uc6d0 OO\ud604\uc7a5', monthlyRental: 500000, startDate: '2025-11-01', status: '\ubc18\ub0a9\uc644\ub8cc' },
];

const buybackStatusColor = (s: string) => s === '\ud68c\uc218\uc644\ub8cc' ? '#22C55E' : s === '\ud655\uc815' ? '#00D9CC' : '#F0A500';
const rentalStatusColor = (s: string) => s === '\ubc18\ub0a9\uc644\ub8cc' ? '#22C55E' : s === '\uc5f0\uccb4' ? '#EF4444' : '#00D9CC';

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
    if (!formWorkId || !formAmount) { alert('\uc791\uc5c5\uc9c0\uc2dc\uc640 \uae08\uc561\uc740 \ud544\uc218\uc785\ub2c8\ub2e4.'); return; }
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
      alert(e?.response?.data?.error || '\uccad\uad6c \uc0dd\uc131 \uc2e4\ud328');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">\uc815\uc0b0</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#00D9CC', color: '#070C12' }}>
          {showCreate ? '\ucde8\uc18c' : '+ \uccad\uad6c \uc0dd\uc131'}
        </button>
      </div>

      {/* 6-step flow */}
      <div className="mb-8 p-4 rounded-lg" style={card}>
        <div className="text-xs mb-3 font-semibold" style={{ color: '#64748B' }}>\uc815\uc0b0 6\ub2e8\uacc4 \ud750\ub984</div>
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
        <div style={card} className="rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#00D9CC' }}>\uc0c8 \uccad\uad6c \uc0dd\uc131</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\uc791\uc5c5\uc9c0\uc2dc</label>
              <select value={formWorkId} onChange={e => { setFormWorkId(e.target.value); const wo = workOrders.find((w: any) => w.workId === e.target.value); if (wo) setFormSiteId(wo.siteId || ''); }}
                className="w-full px-3 py-2 rounded" style={inputStyle}>
                <option value="">\uc120\ud0dd</option>
                {workOrders.map((w: any) => <option key={w.workId} value={w.workId}>{w.workId}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\ud604\uc7a5ID</label>
              <input value={formSiteId} onChange={e => setFormSiteId(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\uac11 PartyID</label>
              <input value={formGapPartyId} onChange={e => setFormGapPartyId(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="\uc608: PARTY-001" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\uae08\uc561 (\uc6d0)</label>
              <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\ube44\uace0</label>
              <textarea value={formNote} onChange={e => setFormNote(e.target.value)} rows={2} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={submitting} className="mt-4 px-6 py-2 rounded text-sm font-bold"
            style={{ background: '#00D9CC', color: '#070C12', opacity: submitting ? 0.5 : 1 }}>
            {submitting ? '\uc0dd\uc131\uc911...' : '\uccad\uad6c \uc0dd\uc131'}
          </button>
        </div>
      )}

      {/* Billing list */}
      <div className="space-y-3 mb-10">
        {billings.map(b => {
          const currentStep = stepStatusMap[b.status] ?? 2;
          const statusColor = b.status === '\uacb0\uc81c\uc644\ub8cc' ? '#22C55E' : b.status === '\uccad\uad6c\uc0dd\uc131' ? '#F0A500' : '#00D9CC';
          return (
            <div key={b.billingId} style={card} className="rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-sm">{b.billingId}</div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {b.workId} | {b.siteId || '-'} | {b.amount ? `${Number(b.amount).toLocaleString()}\uc6d0` : '-'}
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
                \ud604\uc7ac: {BILLING_STEPS[currentStep] || b.status}
                {b.paidAt ? ` | \uacb0\uc81c\uc77c: ${new Date(b.paidAt).toLocaleDateString()}` : ''}
              </div>
            </div>
          );
        })}
        {billings.length === 0 && <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>\uccad\uad6c \ub0b4\uc5ed\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>}
      </div>

      {/* Buyback Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#8B5CF6' }}>\ubc14\uc774\ubc31 \ud604\ud669</h2>
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#8B5CF620', color: '#8B5CF6', border: '1px solid #8B5CF640' }}>42_\ubc14\uc774\ubc31</span>
        </div>

        <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: '#8B5CF610', border: '1px solid #8B5CF630', color: '#8B5CF6' }}>
          \ubc14\uc774\ubc31 \ud310\ub2e8 \ube44\uac1c\uc785 \uc6d0\uce59: \ud50c\ub7ab\ud3fc\uc740 \ubc14\uc774\ubc31 \uac00\uce58\ub97c \ud310\ub2e8\ud558\uc9c0 \uc54a\uc73c\uba70, \uac11\xb7\uc744 \ud569\uc758 \uae08\uc561\uc744 \uae30\ub85d\ub9cc \ud569\ub2c8\ub2e4. \uc0b0\uc815 \uacfc\uc815\uc740 \ub2f9\uc0ac\uc790 \uac04 \ud611\uc758 \uc601\uc5ed\uc785\ub2c8\ub2e4.
        </div>

        <div className="overflow-x-auto" style={card}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B' }}>
                {['ID', '\uc790\uc7ac \uc885\ub958', '\uc218\ub7c9', '\uc6d0\uac00', '\ucd94\uc815 \ud658\ubd88\uac00', '\uc0ac\uc6a9 \uac1c\uc6d4', '\uc0c1\ud0dc'].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-semibold" style={{ color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_BUYBACKS.map(bb => (
                <tr key={bb.buybackId} style={{ borderBottom: '1px solid #1E293B10' }}>
                  <td className="py-3 px-4 font-mono" style={{ color: '#F1F5F9' }}>{bb.buybackId}</td>
                  <td className="py-3 px-4" style={{ color: '#94A3B8' }}>{bb.materialType}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: '#F1F5F9' }}>{bb.quantity} {bb.unit}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: '#94A3B8' }}>{bb.originalCost.toLocaleString()}\uc6d0</td>
                  <td className="py-3 px-4 font-mono font-bold" style={{ color: '#22C55E' }}>{bb.estimatedRefund.toLocaleString()}\uc6d0</td>
                  <td className="py-3 px-4 font-mono" style={{ color: '#64748B' }}>{bb.usageMonths}\uac1c\uc6d4</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-bold" style={{ background: buybackStatusColor(bb.status) + '20', color: buybackStatusColor(bb.status) }}>
                      {bb.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Rental Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#14B8A6' }}>\uc6d4\uc784\ub300</h2>
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#14B8A620', color: '#14B8A6', border: '1px solid #14B8A640' }}>43_\uc6d4\uc784\ub300</span>
        </div>

        <div className="space-y-3">
          {MOCK_RENTALS.map(r => {
            const sColor = rentalStatusColor(r.status);
            return (
              <div key={r.rentalId} style={card} className="rounded-lg p-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-mono font-semibold" style={{ color: '#F1F5F9' }}>{r.rentalId}</div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {r.gateInfo} | {r.site}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#475569' }}>
                    \uc2dc\uc791\uc77c: {r.startDate} | \uc6d4\uc784\ub300\ub8cc: <span className="font-bold" style={{ color: '#00D9CC' }}>{r.monthlyRental.toLocaleString()}\uc6d0</span>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded font-bold"
                  style={{ background: sColor + '20', color: sColor, border: `1px solid ${sColor}40` }}>
                  {r.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
