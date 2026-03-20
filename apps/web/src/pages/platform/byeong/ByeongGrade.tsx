export default function ByeongGrade() {
  const grades = [
    { grade:'R0', label:'신규', color:'#64748B', desc:'가입 직후', current:false },
    { grade:'R1', label:'초급', color:'#3B82F6', desc:'작업 5건 이상', current:false },
    { grade:'R2', label:'중급', color:'#22C55E', desc:'작업 20건 + GPS 95%', current:true },
    { grade:'R3', label:'상급', color:'#F0A500', desc:'작업 50건 + 무사고 90일', current:false },
    { grade:'R4', label:'전문', color:'#8B5CF6', desc:'작업 100건 + 심사 PASS', current:false },
    { grade:'R5', label:'마스터', color:'#EF4444', desc:'작업 200건 + 추천 3건', current:false },
  ];
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">R등급 현황</h1>
      <div className="grid grid-cols-3 gap-4">
        {grades.map(g => (
          <div key={g.grade} className="rounded-lg p-5 transition-all" style={{ background: g.current?g.color+'20':'#0C1520', border:`2px solid ${g.current?g.color:'#1E293B'}` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-mono font-bold" style={{ color:g.color }}>{g.grade}</span>
              {g.current && <span className="text-xs px-2 py-0.5 rounded" style={{ background:g.color, color:'#070C12' }}>현재</span>}
            </div>
            <div className="font-semibold text-sm">{g.label}</div>
            <div className="text-xs mt-1" style={{ color:'#64748B' }}>{g.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
