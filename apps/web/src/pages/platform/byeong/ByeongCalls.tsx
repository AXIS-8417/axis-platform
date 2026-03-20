import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const MOCK_CALLS = [
  { callId: 'CL-010', workId: 'INST-005', workType: '설치', targetCrewId: 'TEAM-A', callStatus: '호출중', createdAt: '2026-03-20T09:00:00Z' },
  { callId: 'CL-011', workId: 'INST-006', workType: '해체', targetCrewId: 'TEAM-A', callStatus: '호출중', createdAt: '2026-03-20T10:00:00Z' },
];

export default function ByeongCalls() {
  const [calls, setCalls] = useState<any[]>([]);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const loadCalls = () => {
    api.get('/api/platform/calls').then(r => setCalls(r.data?.items || r.data?.data || []))
      .catch(() => setCalls(MOCK_CALLS));
  };

  useEffect(() => {
    loadCalls();
  }, []);

  const respond = async (callId: string, response: string) => {
    try {
      const reason = response === '거부' ? (rejectReasons[callId] || '일정 불가') : undefined;
      await api.patch(`/api/platform/calls/${callId}/respond`, { response, reason });
      alert(response === '수락' ? '수락 완료' : '거부 완료 - 거부는 병의 권리입니다.');
      loadCalls();
    } catch (e: any) {
      alert(e?.response?.data?.error || '응답 실패');
    }
  };

  const pendingCalls = calls.filter(c => c.callStatus === '호출중');
  const pastCalls = calls.filter(c => c.callStatus !== '호출중');

  return (
    <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-4">호출 수신</h1>

      {/* Rights message */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: '#22C55E15', border: '1px solid #22C55E40', color: '#22C55E' }}>
        <div className="text-sm font-semibold">거부는 병의 권리이며, 거부로 인한 불이익은 없습니다.</div>
      </div>

      {/* Pending calls */}
      {pendingCalls.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#F0A500' }}>대기중 호출 ({pendingCalls.length}건)</h2>
          <div className="space-y-3">
            {pendingCalls.map(c => (
              <div key={c.callId} style={{ background: '#0C1520', border: '1px solid #F0A500' }} className="rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-semibold">{c.workType || '작업'} -- {c.targetCrewId || '-'}</span>
                    <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                      {c.callId} | {c.workId}
                      {c.createdAt ? ` | ${new Date(c.createdAt).toLocaleString()}` : ''}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: '#F0A50020', color: '#F0A500' }}>호출중</span>
                </div>
                <div className="mb-3">
                  <input
                    placeholder="거부 사유 (선택)"
                    value={rejectReasons[c.callId] || ''}
                    onChange={e => setRejectReasons(prev => ({ ...prev, [c.callId]: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(c.callId, '수락')} className="px-6 py-2 rounded text-sm font-bold" style={{ background: '#22C55E', color: '#070C12' }}>수락</button>
                  <button onClick={() => respond(c.callId, '거부')} className="px-6 py-2 rounded text-sm font-bold" style={{ background: '#334155', color: '#F1F5F9' }}>거부</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past calls */}
      {pastCalls.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#64748B' }}>이전 호출 ({pastCalls.length}건)</h2>
          <div className="space-y-2">
            {pastCalls.map(c => {
              const color = c.callStatus === '매칭완료' || c.callStatus === '수락' ? '#22C55E' : c.callStatus === '거부' ? '#EF4444' : '#64748B';
              return (
                <div key={c.callId} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="text-sm">{c.callId} | {c.workId}</div>
                    <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                      {c.rejectReason ? `사유: ${c.rejectReason}` : ''}
                      {c.respondedAt ? ` | ${new Date(c.respondedAt).toLocaleString()}` : ''}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: color + '20', color }}>{c.callStatus}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {calls.length === 0 && <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>수신된 호출이 없습니다.</div>}
    </div>
  );
}
