const S = ({ label, value, color }: { label: string; value: string|number; color: string }) => (
  <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</div>
    <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
  </div>
);
export default function EulHome() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">을 대시보드</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <S label="작업지시" value={7} color="#00D9CC" />
        <S label="크루 현황" value="3팀" color="#22C55E" />
        <S label="보험 상태" value="유효" color="#3B82F6" />
        <S label="게이트" value={12} color="#F0A500" />
      </div>
    </div>
  );
}
