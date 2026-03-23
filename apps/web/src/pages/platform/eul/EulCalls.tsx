import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const MOCK_CALLS = [
  { callId: 'CL-001', targetCrewId: 'TEAM-A', callStatus: '호출중', workId: 'INST-001' },
  { callId: 'CL-002', targetCrewId: 'TEAM-B', callStatus: '수락', workId: 'INST-002' },
  { callId: 'CL-003', targetCrewId: 'TEAM-C', callStatus: '거부', workId: 'INST-003', rejectReason: '일정 불가' },
];

const MOCK_WORK_ORDERS = [
  { workId: 'WO-001', workType: '설치', currentStatus: '지시생성' },
  { workId: 'WO-002', workType: '해체', currentStatus: '지시생성' },
];

const statusColors: Record<string, string> = {
  '호출중': '#F0A500',
  '수락': '#22C55E',
  '매칭완료': '#22C55E',
  '거부': '#EF4444',
  '만료': '#64748B',
};

export default function EulCalls() {
  const [calls, setCalls] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [showCall, setShowCall] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState('');
  const [targetCrewId, setTargetCrewId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCalls = () => {
    api.get('/api/platform/calls').then(r => setCalls(r.data?.items || r.data?.data || []))
      .catch(() => setCalls(MOCK_CALLS));
  };

  useEffect(() => {
    loadCalls();
    api.get('/api/platform/work-orders').then(r => setWorkOrders(r.data?.items || r.data?.data || []))
      .catch(() => setWorkOrders(MOCK_WORK_ORDERS));
  }, []);

  const handleStartCall = async () => {
    if (!selectedWorkId || !targetCrewId) { alert('작업지시와 대상팀을 입력하세요.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/api/platform/work-orders/${selectedWorkId}/call`, { targetCrewId });
      setShowCall(false);
      setSelectedWorkId('');
      setTargetCrewId('');
      loadCalls();
    } catch (e: any) {
      alert(e?.response?.data?.error || '호출 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (callId: string, response: string) => {
    try {
      await api.patch(`/api/platform/calls/${callId}/respond`, { response, reason: response === '거부' ? '일정 불가' : undefined });
      loadCalls();
    } catch (e: any) {
      alert(e?.response?.data?.error || '응답 실패');
    }
  };

  const inputStyle = { background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' };

  return (
    <div className="p-4 md:p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">호출매칭</h1>
        <button onClick={() => setShowCall(!showCall)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#00D9CC', color: '#070C12' }}>
          {showCall ? '취소' : '+ 호출 시작'}
        </button>
      </div>

      {/* Call creation */}
      {showCall && (
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#00D9CC' }}>새 호출</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>작업지시</label>
              <select value={selectedWorkId} onChange={e => setSelectedWorkId(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                <option value="">선택</option>
                {workOrders.map(w => <option key={w.workId} value={w.workId}>{w.workId} ({w.workType})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>대상 시공팀 ID</label>
              <input value={targetCrewId} onChange={e => setTargetCrewId(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="예: CREW-001" />
            </div>
          </div>
          <button onClick={handleStartCall} disabled={submitting} className="mt-4 px-6 py-2 rounded text-sm font-bold"
            style={{ background: '#00D9CC', color: '#070C12', opacity: submitting ? 0.5 : 1 }}>
            {submitting ? '호출중...' : '호출 시작'}
          </button>
        </div>
      )}

      {/* Call list */}
      <div className="space-y-2">
        {calls.map(cl => {
          const color = statusColors[cl.callStatus] || '#64748B';
          return (
            <div key={cl.callId} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">{cl.callId} -&gt; {cl.targetCrewId}</div>
                <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                  {cl.workId}{cl.rejectReason ? ` | 사유: ${cl.rejectReason}` : ''}
                  {cl.respondedAt ? ` | 응답: ${new Date(cl.respondedAt).toLocaleString()}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded" style={{ background: color + '20', color }}>{cl.callStatus}</span>
                {cl.callStatus === '호출중' && (
                  <div className="flex gap-1">
                    <button onClick={() => handleRespond(cl.callId, '수락')} className="text-xs px-2 py-1 rounded" style={{ background: '#22C55E20', color: '#22C55E' }}>수락</button>
                    <button onClick={() => handleRespond(cl.callId, '거부')} className="text-xs px-2 py-1 rounded" style={{ background: '#EF444420', color: '#EF4444' }}>거부</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {calls.length === 0 && <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>호출 내역이 없습니다.</div>}
      </div>
    </div>
  );
}
