export default function EulCalls() {
  const calls = [
    { callId:'CL-001', targetCrewId:'TEAM-A', callStatus:'호출중', workId:'INST-001' },
    { callId:'CL-002', targetCrewId:'TEAM-B', callStatus:'수락', workId:'INST-002' },
    { callId:'CL-003', targetCrewId:'TEAM-C', callStatus:'거부', workId:'INST-003', rejectReason:'일정 불가' },
  ];
  const c: Record<string,string> = { 호출중:'#F0A500', 수락:'#22C55E', 거부:'#EF4444', 만료:'#64748B' };
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">호출매칭</h1>
      <div className="space-y-2">
        {calls.map(cl => (
          <div key={cl.callId} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4 flex justify-between items-center">
            <div><div className="text-sm font-medium">{cl.callId} → {cl.targetCrewId}</div><div className="text-xs mt-1" style={{ color:'#64748B' }}>{cl.workId}{cl.rejectReason ? ` · 사유: ${cl.rejectReason}` : ''}</div></div>
            <span className="text-xs px-2 py-1 rounded" style={{ background:(c[cl.callStatus]||'#64748B')+'20', color:c[cl.callStatus]||'#64748B' }}>{cl.callStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
