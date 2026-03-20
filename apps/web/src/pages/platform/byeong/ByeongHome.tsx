const S = ({ label, value, color }: { label:string; value:string|number; color:string }) => (
  <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color:'#64748B' }}>{label}</div>
    <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
  </div>
);
export default function ByeongHome() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">병 대시보드</h1>
      <div className="grid grid-cols-4 gap-4">
        <S label="R등급" value="R2" color="#22C55E" />
        <S label="교육이수" value="충족" color="#3B82F6" />
        <S label="연속투입" value="15일" color="#F0A500" />
        <S label="호출대기" value={2} color="#00D9CC" />
      </div>
    </div>
  );
}
