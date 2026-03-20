const card = { background: '#0C1520', border: '1px solid #1E293B' };

const S = ({ label, value, color, trend }: { label: string; value: string | number; color: string; trend?: string }) => (
  <div style={card} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</div>
    <div className="flex items-center gap-2">
      <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
      {trend && <span className="text-xs" style={{ color: trend.startsWith('+') ? '#22C55E' : '#EF4444' }}>{trend}</span>}
    </div>
  </div>
);

const EDU_LIST = [
  { name: '안전보건교육 (4h)', done: true },
  { name: '고소작업 특별교육', done: true },
  { name: '화재예방교육', done: true },
  { name: '유해물질 취급교육', done: false },
];

export default function ByeongHome() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">병 대시보드</h1>

      {/* StatCards with trends */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <S label="R등급" value="R2" color="#22C55E" trend="+1" />
        <S label="교육이수" value="충족" color="#3B82F6" trend="+2건" />
        <S label="연속투입" value="15일" color="#F0A500" trend="+3일" />
        <S label="호출대기" value={2} color="#00D9CC" trend="-1" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: AXIS 상태 */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-5" style={{ color: '#00D9CC' }}>AXIS 상태</h2>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#22C55E20', border: '3px solid #22C55E' }}>
              <span className="text-3xl font-mono font-bold" style={{ color: '#22C55E' }}>R2</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#64748B' }}>AXIS 상태</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: '#22C55E20', color: '#22C55E' }}>ACTIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#64748B' }}>보험</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#3B82F620', color: '#3B82F6' }}>가입완료</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#64748B' }}>안전교육</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#22C55E20', color: '#22C55E' }}>충족</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div style={{ background: '#111B2A', border: '1px solid #1E293B' }} className="rounded-lg p-3">
              <div className="text-xs" style={{ color: '#64748B' }}>연속투입</div>
              <div className="text-lg font-mono font-bold" style={{ color: '#F0A500' }}>15일</div>
            </div>
            <div style={{ background: '#111B2A', border: '1px solid #1E293B' }} className="rounded-lg p-3">
              <div className="text-xs" style={{ color: '#64748B' }}>총 시공 건수</div>
              <div className="text-lg font-mono font-bold" style={{ color: '#00D9CC' }}>89건</div>
            </div>
          </div>
        </div>

        {/* Right: R2→R3 진급 */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-5" style={{ color: '#F0A500' }}>R2 → R3 진급</h2>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: '#94A3B8' }}>시공 건수</span>
              <span className="font-mono" style={{ color: '#F0A500' }}>89 / 100</span>
            </div>
            <div className="w-full rounded-full h-3" style={{ background: '#1E293B' }}>
              <div className="h-3 rounded-full" style={{ width: '89%', background: '#F0A500' }} />
            </div>
            <div className="text-xs mt-1 text-right" style={{ color: '#64748B' }}>11건 남음</div>
          </div>

          {/* Education completion */}
          <div>
            <div className="text-xs font-semibold mb-3" style={{ color: '#94A3B8' }}>교육 이수 현황</div>
            <div className="space-y-2">
              {EDU_LIST.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded" style={{ background: '#111B2A' }}>
                  <span className="text-sm" style={{ color: e.done ? '#94A3B8' : '#F1F5F9' }}>{e.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold"
                    style={{ background: e.done ? '#22C55E20' : '#EF444420', color: e.done ? '#22C55E' : '#EF4444' }}>
                    {e.done ? '완료' : '미이수'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
