export default function EulSettlement() {
  const steps = ['시공완료', '봉인', '청구', '결제', 'PG', '수령'];
  const current = 2;
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">정산</h1>
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s,i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i<=current?'#00D9CC':'#1E293B', color: i<=current?'#070C12':'#64748B' }}>{i+1}</div>
            <span className="text-xs" style={{ color: i<=current?'#00D9CC':'#64748B' }}>{s}</span>
            {i < steps.length-1 && <div className="w-8 h-0.5" style={{ background: i<current?'#00D9CC':'#334155' }} />}
          </div>
        ))}
      </div>
      <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
        <p className="text-sm" style={{ color:'#94A3B8' }}>현재 단계: <strong style={{ color:'#00D9CC' }}>{steps[current]}</strong></p>
      </div>
    </div>
  );
}
