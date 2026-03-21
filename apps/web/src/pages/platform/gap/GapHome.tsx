import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api';

const fmt = (n: number) => n?.toLocaleString('ko-KR') ?? '-';

export default function GapHome() {
  const [sites, setSites] = useState<any[]>([]);
  const [billings, setBillings] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/platform/sites').then(r => setSites(r.data?.data || [])).catch(() => setSites([
        { siteId:'SITE-001', siteName:'파주 OO아파트 가설울타리', status:'진행', address:'경기도 파주시' },
        { siteId:'SITE-002', siteName:'수원 OO현장', status:'진행', address:'경기도 수원시' },
        { siteId:'SITE-003', siteName:'인천 OO현장', status:'완료', address:'인천광역시' },
      ])),
      api.get('/api/platform/billings').then(r => setBillings(r.data?.data || [])).catch(() => setBillings([
        { billingId:'BL-001', amount:12500000, status:'청구생성' },
        { billingId:'BL-002', amount:8700000, status:'결제완료' },
      ])),
      api.get('/api/quotes?year=2026').then(r => setQuotes(r.data?.records || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const activeSites = sites.filter(s => s.status === '진행').length;
  const pendingBillings = billings.filter(b => b.status === '청구생성');
  const totalBillingAmt = pendingBillings.reduce((s: number, b: any) => s + (b.amount || 0), 0);

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">갑 대시보드</h1>
        <span className="text-xs" style={{ color: '#64748B' }}>{new Date().toLocaleDateString('ko-KR')}</span>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '진행 현장', value: activeSites, color: '#F0A500', link: '/platform/gap/sites' },
          { label: '청구 대기', value: `${pendingBillings.length}건`, color: '#EF4444', link: '/platform/gap/billing' },
          { label: '대기 금액', value: `${fmt(totalBillingAmt)}원`, color: '#EF4444', link: '/platform/gap/billing' },
          { label: '저장 견적', value: `${quotes.length}건`, color: '#3B82F6', link: '/quotes' },
        ].map(s => (
          <Link key={s.label} to={s.link} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5 hover:opacity-80 transition-opacity">
            <div className="text-xs mb-1" style={{ color: '#64748B' }}>{s.label}</div>
            <div className="text-2xl font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
          </Link>
        ))}
      </div>

      {/* 최근 현장 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#F0A500' }}>현장 현황</h2>
            <Link to="/platform/gap/sites" className="text-xs hover:underline" style={{ color: '#00D9CC' }}>전체보기</Link>
          </div>
          {sites.slice(0, 4).map(s => (
            <div key={s.siteId} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #1E293B' }}>
              <div>
                <div className="text-sm">{s.siteName}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>{s.address}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: s.status === '진행' ? '#22C55E20' : '#64748B20', color: s.status === '진행' ? '#22C55E' : '#64748B' }}>{s.status}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#F0A500' }}>최근 견적</h2>
            <Link to="/quotes" className="text-xs hover:underline" style={{ color: '#00D9CC' }}>전체보기</Link>
          </div>
          {quotes.length > 0 ? quotes.slice(0, 4).map((q: any) => (
            <div key={q.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #1E293B' }}>
              <div>
                <div className="text-sm">{q.projectName || `${q.input?.panel} H${q.input?.height}M ${q.input?.length}M`}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>{new Date(q.createdAt).toLocaleDateString('ko-KR')}</div>
              </div>
              <span className="text-sm font-mono" style={{ color: '#00D9CC' }}>{fmt(q.result?.finalTotal)}원</span>
            </div>
          )) : (
            <div className="py-4 text-center">
              <p className="text-sm mb-2" style={{ color: '#64748B' }}>아직 저장된 견적이 없습니다</p>
              <Link to="/quote/new" className="text-xs px-4 py-2 rounded inline-block" style={{ background: '#00D9CC', color: '#070C12' }}>견적 시작하기</Link>
            </div>
          )}
        </div>
      </div>

      {/* 빠른 작업 */}
      <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>빠른 작업</h2>
        <div className="flex gap-3">
          <Link to="/quote/new" className="px-4 py-2 rounded text-sm font-semibold" style={{ background: '#00D9CC', color: '#070C12' }}>📐 새 견적</Link>
          <Link to="/platform/gap/records" className="px-4 py-2 rounded text-sm" style={{ border: '1px solid #334155', color: '#94A3B8' }}>📋 작업기록</Link>
          <Link to="/platform/gap/documents" className="px-4 py-2 rounded text-sm" style={{ border: '1px solid #334155', color: '#94A3B8' }}>📁 서류조회</Link>
          <Link to="/platform/gap/billing" className="px-4 py-2 rounded text-sm" style={{ border: '1px solid #334155', color: '#94A3B8' }}>💰 청구확인</Link>
        </div>
      </div>
    </div>
  );
}
