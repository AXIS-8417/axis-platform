import api from '../../../lib/api';
export default function ByeongCalls() {
  const calls = [
    { callId:'CL-010', workId:'INST-005', workType:'설치', site:'파주 OO현장', urgent:true, callStatus:'호출중' },
    { callId:'CL-011', workId:'INST-006', workType:'해체', site:'수원 OO현장', urgent:false, callStatus:'호출중' },
  ];
  const respond = async (id: string, response: string) => {
    try { await api.patch(`/api/platform/calls/${id}/respond`, { response, reason: response==='거부'?'일정 불가':undefined }); alert(response==='수락'?'수락 완료':'거부 완료'); } catch {}
  };
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">호출 수신</h1>
      <div className="mb-6 p-4 rounded-lg" style={{ background:'#22C55E15', border:'1px solid #22C55E40', color:'#22C55E' }}>
        <div className="text-sm font-semibold">거부는 병의 권리이며, 거부로 인한 불이익은 없습니다.</div>
      </div>
      <div className="space-y-3">
        {calls.map(c => (
          <div key={c.callId} style={{ background:'#0C1520', border:`1px solid ${c.urgent?'#EF4444':'#1E293B'}` }} className="rounded-lg p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                {c.urgent && <span className="text-xs px-2 py-0.5 rounded mr-2" style={{ background:'#EF444420', color:'#EF4444' }}>긴급</span>}
                <span className="font-semibold">{c.workType} — {c.site}</span>
                <div className="text-xs mt-1" style={{ color:'#64748B' }}>{c.callId} · {c.workId}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => respond(c.callId, '수락')} className="px-6 py-2 rounded text-sm font-bold" style={{ background:'#22C55E', color:'#070C12' }}>수락</button>
              <button onClick={() => respond(c.callId, '거부')} className="px-6 py-2 rounded text-sm font-bold" style={{ background:'#334155', color:'#F1F5F9' }}>거부</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
