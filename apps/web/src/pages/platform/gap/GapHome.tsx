import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const StatCard = ({ label, value, color }: { label: string; value: string|number; color: string }) => (
  <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</div>
    <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
  </div>
);

export default function GapHome() {
  const [sites, setSites] = useState<any[]>([]);
  useEffect(() => { api.get('/api/platform/sites').then(r => setSites(r.data?.data || [])).catch(() => {}); }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">갑 대시보드</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="진행 현장" value={sites.length || 3} color="#F0A500" />
        <StatCard label="청구 대기" value={2} color="#EF4444" />
        <StatCard label="이슈 건수" value={1} color="#3B82F6" />
      </div>
      <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>최근 활동</h2>
        {['시공일보 봉인 완료 — 파주 OO현장', '청구서 접수 — 수원 OO현장 ₩12,500,000', '설계변경 요청 — 용인 OO현장 (72h 마감)'].map((item, i) => (
          <div key={i} className="py-2 text-sm" style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8' }}>{item}</div>
        ))}
      </div>
    </div>
  );
}
