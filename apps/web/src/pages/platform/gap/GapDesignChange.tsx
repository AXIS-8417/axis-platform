import { useState, useEffect } from 'react';

export default function GapDesignChange() {
  const [remaining, setRemaining] = useState(Math.floor(72 * 3600 - 18 * 3600));
  useEffect(() => { const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000); return () => clearInterval(t); }, []);
  const h = Math.floor(remaining / 3600); const m = Math.floor((remaining % 3600) / 60); const s = remaining % 60;

  const changes = [
    { id: 'DC-001', desc: '경간 3.0M → 2.5M 변경 요청', site: '파주 OO현장', status: 'WAITING', deadline: `${h}h ${m}m ${s}s` },
    { id: 'DC-002', desc: '분진망 추가 설치 (H:1.5M)', site: '수원 OO현장', status: 'ACCEPTED', deadline: '완료' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">설계변경</h1>
      <div className="space-y-3">
        {changes.map(c => (
          <div key={c.id} style={{ background: '#0C1520', border: `1px solid ${c.status === 'WAITING' ? '#F0A500' : '#1E293B'}` }} className="rounded-lg p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold">{c.desc}</div>
                <div className="text-xs mt-1" style={{ color: '#64748B' }}>{c.site} · {c.id}</div>
              </div>
              {c.status === 'WAITING' && (
                <div className="text-right">
                  <div className="text-xs" style={{ color: '#64748B' }}>마감까지</div>
                  <div className="font-mono font-bold" style={{ color: '#EF4444' }}>{c.deadline}</div>
                </div>
              )}
            </div>
            {c.status === 'WAITING' ? (
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded text-sm font-bold" style={{ background: '#22C55E', color: '#070C12' }}>수락</button>
                <button className="px-4 py-2 rounded text-sm font-bold" style={{ background: '#EF4444', color: '#fff' }}>미수락</button>
              </div>
            ) : (
              <span className="text-xs px-2 py-1 rounded" style={{ background: '#22C55E20', color: '#22C55E' }}>{c.status === 'ACCEPTED' ? '수락됨' : c.status}</span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: '#64748B' }}>※ 72시간 무응답 시 DISAGREEMENT로 자동 전이됩니다.</p>
    </div>
  );
}
