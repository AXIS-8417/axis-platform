import { useState, useEffect } from 'react';

const card = { background: '#0C1520', border: '1px solid #1E293B' };

type RiskStatus = 'NORMAL' | 'WATCH' | 'REINFORCED' | 'PROTECTED';

const STATUS_COLORS: Record<RiskStatus, string> = {
  NORMAL: '#22C55E',
  WATCH: '#F0A500',
  REINFORCED: '#FF7849',
  PROTECTED: '#EF4444',
};

interface TCIProfile {
  name: string;
  role: string;
  contract: number;
  settlement: number;
  quality: number;
  safety: number;
  status: RiskStatus;
}

const MOCK_PROFILES: TCIProfile[] = [
  { name: '(주)대한건설', role: '을', contract: 8, settlement: 5, quality: 3, safety: 2, status: 'NORMAL' },
  { name: '(주)서울기계', role: '을', contract: 18, settlement: 22, quality: 10, safety: 8, status: 'WATCH' },
  { name: '김OO (개인)', role: '병', contract: 25, settlement: 28, quality: 16, safety: 18, status: 'REINFORCED' },
];

function getTCIColor(total: number): string {
  if (total <= 30) return '#22C55E';
  if (total <= 60) return '#F0A500';
  if (total <= 80) return '#FF7849';
  return '#EF4444';
}

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div style={card} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</div>
    <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
  </div>
);

const TCIBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs mb-1">
      <span style={{ color: '#94A3B8' }}>{label} ({max})</span>
      <span className="font-mono" style={{ color }}>{value}</span>
    </div>
    <div className="w-full rounded-full h-1.5" style={{ background: '#1E293B' }}>
      <div className="h-1.5 rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  </div>
);

export default function RiskView() {
  const counts = {
    NORMAL: MOCK_PROFILES.filter(p => p.status === 'NORMAL').length,
    WATCH: MOCK_PROFILES.filter(p => p.status === 'WATCH').length,
    REINFORCED: MOCK_PROFILES.filter(p => p.status === 'REINFORCED').length,
    PROTECTED: MOCK_PROFILES.filter(p => p.status === 'PROTECTED').length,
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-2">리스크 / TCI</h1>
      <div className="text-xs mb-6" style={{ color: '#64748B' }}>PART259 - Trust & Compliance Index 엔진</div>

      {/* Status counts */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="NORMAL" value={counts.NORMAL} color={STATUS_COLORS.NORMAL} />
        <StatCard label="WATCH" value={counts.WATCH} color={STATUS_COLORS.WATCH} />
        <StatCard label="REINFORCED" value={counts.REINFORCED} color={STATUS_COLORS.REINFORCED} />
        <StatCard label="PROTECTED" value={counts.PROTECTED} color={STATUS_COLORS.PROTECTED} />
      </div>

      {/* Spec note */}
      <div className="mb-6 p-3 rounded-lg text-xs" style={{ background: '#F0A50010', border: '1px solid #F0A50030', color: '#F0A500' }}>
        * 점수 UI 표시, 랭킹, 비교 전부 금지. 내부 상태 트리거 전용.
      </div>

      {/* Profiles */}
      <div className="grid grid-cols-3 gap-6">
        {MOCK_PROFILES.map((p, i) => {
          const total = p.contract + p.settlement + p.quality + p.safety;
          const tciColor = getTCIColor(total);
          return (
            <div key={i} style={card} className="rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs" style={{ color: '#64748B' }}>{p.role}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded font-bold"
                  style={{ background: STATUS_COLORS[p.status] + '20', color: STATUS_COLORS[p.status] }}>
                  {p.status}
                </span>
              </div>

              <div className="text-center mb-4">
                <div className="text-3xl font-mono font-bold" style={{ color: tciColor }}>{total}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>TCI (max 100)</div>
              </div>

              <TCIBar label="계약이행" value={p.contract} max={30} color={tciColor} />
              <TCIBar label="정산분쟁" value={p.settlement} max={30} color={tciColor} />
              <TCIBar label="품질" value={p.quality} max={20} color={tciColor} />
              <TCIBar label="안전" value={p.safety} max={20} color={tciColor} />

              <div className="mt-3 text-xs text-center" style={{ color: '#64748B' }}>
                TCI = 계약이행(30) + 정산분쟁(30) + 품질(20) + 안전(20)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
