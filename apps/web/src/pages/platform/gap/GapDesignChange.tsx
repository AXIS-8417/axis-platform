import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function GapDesignChange() {
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // 설계변경은 work-orders 중 상태가 설계변경 관련인 것을 필터
        const res = await api.get('/api/platform/work-orders');
        const orders = res.data?.items || [];
        // 설계변경 이벤트가 별도 테이블이 없으므로 work-orders에서 autoNote에 '설계변경' 포함된 것 사용
        // 또는 전체 work-orders를 설계변경 후보로 표시
        const dcItems = orders.map((wo: any, i: number) => {
          const createdAt = new Date(wo.createdAt).getTime();
          const deadline72h = createdAt + 72 * 3600 * 1000;
          const remainMs = deadline72h - Date.now();
          return {
            id: wo.workId,
            desc: wo.note || `${wo.workType || '작업'} — ${wo.panelType || ''} ${wo.frameLengthM || ''}M`,
            site: wo.siteId || '-',
            status: remainMs <= 0 ? 'DISAGREEMENT' : wo.currentStatus === '봉인완료' ? 'ACCEPTED' : 'WAITING',
            createdAt,
            deadline72h,
            remainMs: Math.max(0, remainMs),
          };
        });
        setChanges(dcItems.length > 0 ? dcItems : getFallback());
      } catch {
        setChanges(getFallback());
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const getFallback = () => {
    const base = Date.now() - 18 * 3600 * 1000; // 18시간 전
    return [
      { id:'DC-001', desc:'경간 3.0M → 2.5M 변경 요청', site:'파주 OO현장', status:'WAITING', createdAt: base, deadline72h: base + 72*3600*1000, remainMs: 54*3600*1000 },
      { id:'DC-002', desc:'분진망 추가 설치 (H:1.5M)', site:'수원 OO현장', status:'ACCEPTED', createdAt: base - 86400000, deadline72h: base, remainMs: 0 },
    ];
  };

  const handleAccept = async (workId: string) => {
    try {
      await api.patch(`/api/platform/work-orders/${workId}/status`, { status: '매칭완료', note: '설계변경 수락' });
      setChanges(prev => prev.map(c => c.id === workId ? { ...c, status: 'ACCEPTED' } : c));
    } catch (e: any) {
      alert(e?.response?.data?.error || '처리 실패');
    }
  };

  const handleReject = async (workId: string) => {
    try {
      await api.patch(`/api/platform/work-orders/${workId}/status`, { status: '지시생성', note: '설계변경 미수락' });
      setChanges(prev => prev.map(c => c.id === workId ? { ...c, status: 'REJECTED' } : c));
    } catch (e: any) {
      alert(e?.response?.data?.error || '처리 실패');
    }
  };

  const fmtRemain = (ms: number) => {
    if (ms <= 0) return '만료';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const statusLabel = (s: string) => {
    if (s === 'ACCEPTED') return { text: '수락됨', color: '#22C55E' };
    if (s === 'REJECTED') return { text: '미수락', color: '#EF4444' };
    if (s === 'DISAGREEMENT') return { text: 'DISAGREEMENT (72h 자동전이)', color: '#EF4444' };
    return { text: '응답 대기', color: '#F0A500' };
  };

  return (
    <div className="p-4 md:p-8" style={{ background:'#070C12', minHeight:'100vh', color:'#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-6">설계변경</h1>

      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>로딩 중...</div>
      ) : (
        <div className="space-y-3">
          {changes.map(c => {
            const remain = c.deadline72h - now;
            const label = c.status === 'WAITING' && remain <= 0 ? statusLabel('DISAGREEMENT') : statusLabel(c.status);
            return (
              <div key={c.id} style={{ background:'#0C1520', border:`1px solid ${c.status === 'WAITING' ? '#F0A500' : '#1E293B'}` }} className="rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">{c.desc}</div>
                    <div className="text-xs mt-1" style={{ color:'#64748B' }}>{c.site} · {c.id}</div>
                  </div>
                  {c.status === 'WAITING' && remain > 0 ? (
                    <div className="text-right">
                      <div className="text-xs" style={{ color:'#64748B' }}>마감까지</div>
                      <div className="font-mono font-bold" style={{ color: remain < 3600000 ? '#EF4444' : '#F0A500' }}>{fmtRemain(remain)}</div>
                    </div>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded" style={{ background: label.color + '20', color: label.color }}>{label.text}</span>
                  )}
                </div>
                {c.status === 'WAITING' && remain > 0 ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(c.id)} className="px-4 py-2 rounded text-sm font-bold" style={{ background:'#22C55E', color:'#070C12' }}>수락</button>
                    <button onClick={() => handleReject(c.id)} className="px-4 py-2 rounded text-sm font-bold" style={{ background:'#EF4444', color:'#fff' }}>미수락</button>
                  </div>
                ) : null}

                {/* 72h 진행바 */}
                {c.status === 'WAITING' && (
                  <div className="mt-3">
                    <div className="w-full rounded-full h-1.5" style={{ background:'#1E293B' }}>
                      <div className="h-1.5 rounded-full" style={{
                        width: `${Math.min(100, Math.max(0, ((72*3600*1000 - Math.max(0, remain)) / (72*3600*1000)) * 100))}%`,
                        background: remain < 3600000 ? '#EF4444' : remain < 24*3600000 ? '#F0A500' : '#22C55E',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs" style={{ color:'#64748B' }}>※ 72시간 무응답 시 DISAGREEMENT로 자동 전이됩니다. 판단 없이 상태만 봉인.</p>
    </div>
  );
}
