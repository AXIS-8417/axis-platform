import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function GapSites() {
  const [sites, setSites] = useState<any[]>([]);
  useEffect(() => { api.get('/api/platform/sites').then(r => setSites(r.data?.data || [])).catch(() => {
    setSites([
      { siteId: 'SITE-001', siteName: '파주 OO아파트 가설울타리', address: '경기도 파주시', status: '진행', budget: 24000000, spent: 17280000, progress: 72, workers: 8, panel: 'RPP', len: 160 },
      { siteId: 'SITE-002', siteName: '수원 OO현장', address: '경기도 수원시', status: '진행', budget: 36000000, spent: 16200000, progress: 45, workers: 12, panel: 'CLP', len: 240 },
      { siteId: 'SITE-003', siteName: '인천 OO현장', address: '인천광역시', status: '완료', budget: 12000000, spent: 12000000, progress: 100, workers: 0, panel: 'SNB', len: 80 },
    ]);
  }); }, []);

  const statusColor = (s: string) => s === '진행' ? '#22C55E' : s === '완료' ? '#64748B' : '#EF4444';
  const fmtKRW = (n: number) => (n / 10000).toLocaleString() + '만';

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">현장 관리</h1>
      <div className="space-y-3">
        {sites.map(s => (
          <div key={s.siteId} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{s.siteName}</div>
                <div className="text-xs mt-1" style={{ color: '#64748B' }}>{s.address} · {s.siteId}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ background: statusColor(s.status) + '20', color: statusColor(s.status) }}>{s.status}</span>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-xs" style={{ color: '#64748B' }}>패널 / 연장</div>
                <div className="text-sm font-mono font-semibold" style={{ color: '#00D9CC' }}>{s.panel} · {s.len}m</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: '#64748B' }}>예산 / 집행</div>
                <div className="text-sm font-mono" style={{ color: '#F1F5F9' }}>{fmtKRW(s.spent)} / {fmtKRW(s.budget)}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: '#64748B' }}>투입인력</div>
                <div className="text-sm font-mono font-semibold" style={{ color: '#F0A500' }}>{s.workers}명</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: '#64748B' }}>진행률</div>
                <div className="text-sm font-mono font-semibold" style={{ color: s.progress === 100 ? '#64748B' : '#22C55E' }}>{s.progress}%</div>
              </div>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: '#1E293B' }}>
              <div className="h-2 rounded-full transition-all" style={{
                width: `${s.progress}%`,
                background: s.progress === 100 ? '#64748B' : s.progress >= 70 ? '#22C55E' : '#F0A500',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
