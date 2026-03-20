import { useState, useEffect } from 'react';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };

const StatCard = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
  <div style={card} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</div>
    <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
    {sub && <div className="text-xs mt-1" style={{ color: '#64748B' }}>{sub}</div>}
  </div>
);

const SITES = [
  { name: '파주 OO아파트 가설울타리', panel: 'RPP', len: 160, progress: 72 },
  { name: '수원 OO현장 가시설', panel: 'CLP', len: 240, progress: 45 },
  { name: '인천 OO현장 방음벽', panel: 'SNB', len: 80, progress: 100 },
];

const ARCH_LINKS = [
  { code: 'PART258', label: 'GPS 엔진', desc: '자동전환 상태머신', color: '#00D9CC' },
  { code: 'PART259', label: '리스크/TCI', desc: '신뢰지수 엔진', color: '#F0A500' },
  { code: 'PART263', label: '건설기계', desc: '장비 배차·정산', color: '#8B5CF6' },
  { code: '상태머신', label: '봉인·증빙', desc: 'SEALED 불변 증빙', color: '#3B82F6' },
];

const CANON = [
  { label: '기록중심', desc: '모든 판단은 기록된 사실에서 파생', color: '#22C55E' },
  { label: '판단배제', desc: '플랫폼은 판단하지 않고 기록만 제공', color: '#F0A500' },
  { label: '봉인불변', desc: 'SEALED 상태 이후 변경 불가', color: '#EF4444' },
];

export default function PlatformDash() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 60000); return () => clearInterval(t); }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-2">AXIS Platform Dashboard</h1>
      <div className="text-xs mb-6" style={{ color: '#64748B' }}>
        실시간 현황 (마지막 갱신: {new Date().toLocaleTimeString('ko-KR')})
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="현장" value={3} color="#00D9CC" sub="진행 2 / 완료 1" />
        <StatCard label="작업지시" value={3} color="#22C55E" sub="금일 배정" />
        <StatCard label="장비" value={2} color="#8B5CF6" sub="가동중" />
        <StatCard label="봉인" value={3} color="#F0A500" sub="SEALED 건수" />
        <StatCard label="정산" value="11.6M" color="#FF7849" sub="이번달 누적 (KRW)" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: 현장 현황 */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>현장 현황</h2>
          <div className="space-y-4">
            {SITES.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs font-mono" style={{ color: '#64748B' }}>{s.panel} · {s.len}m</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: '#1E293B' }}>
                  <div className="h-2 rounded-full" style={{
                    width: `${s.progress}%`,
                    background: s.progress === 100 ? '#64748B' : s.progress >= 70 ? '#22C55E' : '#F0A500',
                  }} />
                </div>
                <div className="text-right text-xs mt-1" style={{ color: s.progress === 100 ? '#64748B' : '#94A3B8' }}>
                  {s.progress}%{s.progress === 100 ? ' (완료)' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Architecture + CANON */}
        <div className="space-y-6">
          <div style={card} className="rounded-lg p-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#F0A500' }}>아키텍처</h2>
            <div className="grid grid-cols-2 gap-3">
              {ARCH_LINKS.map((a, i) => (
                <div key={i} style={elevated} className="rounded-lg p-3">
                  <div className="text-xs font-mono mb-1" style={{ color: a.color }}>{a.code}</div>
                  <div className="text-sm font-semibold">{a.label}</div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card} className="rounded-lg p-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#22C55E' }}>CANON 원칙</h2>
            <div className="space-y-3">
              {CANON.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: c.color }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: c.color }}>{c.label}</div>
                    <div className="text-xs" style={{ color: '#94A3B8' }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
