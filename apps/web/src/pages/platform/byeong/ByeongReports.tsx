export default function ByeongReports() {
  const reports = [
    { reportId:'SD-001', workType:'설치', weather:'맑음', sealId:'SEAL-001', section:'0~120M' },
    { reportId:'SD-002', workType:'설치', weather:'흐림', sealId:null, section:'120~250M' },
  ];
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">시공일보</h1>
      <button className="px-4 py-2 rounded-lg text-sm font-bold mb-6" style={{ background:'#22C55E', color:'#070C12' }}>+ 시공일보 작성</button>
      <div className="space-y-2">
        {reports.map(r => (
          <div key={r.reportId} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">{r.sealId ? '🔒 ' : ''}{r.reportId} · {r.workType} · {r.section}</div>
              <div className="text-xs mt-1" style={{ color:'#64748B' }}>날씨: {r.weather} · GPS: 37.7°N 126.9°E</div>
            </div>
            {r.sealId ? <span className="text-xs px-2 py-1 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>🔒 봉인</span>
              : <button className="text-xs px-3 py-1 rounded" style={{ background:'#334155', color:'#94A3B8' }} disabled>수정</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
