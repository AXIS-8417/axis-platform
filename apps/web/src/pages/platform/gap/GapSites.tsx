import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function GapSites() {
  const [sites, setSites] = useState<any[]>([]);
  useEffect(() => { api.get('/api/platform/sites').then(r => setSites(r.data?.data || [])).catch(() => {
    setSites([
      { siteId: 'SITE-001', siteName: '파주 OO아파트 가설울타리', address: '경기도 파주시', status: '진행' },
      { siteId: 'SITE-002', siteName: '수원 OO현장', address: '경기도 수원시', status: '진행' },
      { siteId: 'SITE-003', siteName: '인천 OO현장', address: '인천광역시', status: '완료' },
    ]);
  }); }, []);

  const statusColor = (s: string) => s === '진행' ? '#22C55E' : s === '완료' ? '#64748B' : '#EF4444';

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">현장 관리</h1>
      <div className="space-y-3">
        {sites.map(s => (
          <div key={s.siteId} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{s.siteName}</div>
              <div className="text-xs mt-1" style={{ color: '#64748B' }}>{s.address} · {s.siteId}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ background: statusColor(s.status) + '20', color: statusColor(s.status) }}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
