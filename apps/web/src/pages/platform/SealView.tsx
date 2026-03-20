import { useState, useEffect } from 'react';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };

type SealType = 'SINGLE_SEAL' | 'MUTUAL_SEAL' | 'AUTO_SEAL';

const SEAL_TYPE_CONFIG: Record<SealType, { label: string; color: string; desc: string }> = {
  SINGLE_SEAL: { label: '단독잠금', color: '#00D9CC', desc: '단일 당사자가 증빙을 봉인. 작성자 단독으로 확정하며, 상대방 동의 없이 잠금 처리.' },
  MUTUAL_SEAL: { label: '상호잠금', color: '#F0A500', desc: '갑-을 또는 을-병 양 당사자가 모두 승인해야 봉인 완료. 한쪽만 승인 시 PENDING 상태 유지.' },
  AUTO_SEAL: { label: '자동잠금', color: '#8B5CF6', desc: '시스템이 조건 충족 시 자동 봉인. GPS 완료, 정산 확정 등 트리거에 의해 자동 실행.' },
};

interface SealRecord {
  sealId: string;
  targetType: string;
  targetId: string;
  sealType: SealType;
  sealedBy: string;
  timestamp: string;
}

const MOCK_SEALS: SealRecord[] = [
  { sealId: 'SEAL-001', targetType: '시공일보', targetId: 'RPT-2024-0312', sealType: 'SINGLE_SEAL', sealedBy: '김OO (병)', timestamp: '2024-03-12 17:05:22' },
  { sealId: 'SEAL-002', targetType: '정산서', targetId: 'SET-2024-0311', sealType: 'MUTUAL_SEAL', sealedBy: '(주)대한건설 (을)', timestamp: '2024-03-11 18:30:15' },
  { sealId: 'SEAL-003', targetType: 'GPS기록', targetId: 'GPS-2024-0312', sealType: 'AUTO_SEAL', sealedBy: 'SYSTEM', timestamp: '2024-03-12 17:02:18' },
  { sealId: 'SEAL-004', targetType: '근로계약', targetId: 'CTR-2024-0301', sealType: 'MUTUAL_SEAL', sealedBy: '(주)서울기계 (을)', timestamp: '2024-03-01 09:15:40' },
  { sealId: 'SEAL-005', targetType: '안전점검', targetId: 'SAF-2024-0310', sealType: 'SINGLE_SEAL', sealedBy: '박OO (갑)', timestamp: '2024-03-10 16:45:00' },
  { sealId: 'SEAL-006', targetType: '설계변경', targetId: 'DCH-2024-0308', sealType: 'MUTUAL_SEAL', sealedBy: '(주)대한건설 (을)', timestamp: '2024-03-08 11:20:33' },
];

export default function SealView() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-2">봉인 / 증빙</h1>
      <div className="text-xs mb-6" style={{ color: '#64748B' }}>SEALED 불변성 기반 증빙 관리 시스템</div>

      {/* Seal Types */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(Object.entries(SEAL_TYPE_CONFIG) as [SealType, typeof SEAL_TYPE_CONFIG[SealType]][]).map(([type, cfg]) => (
          <div key={type} style={card} className="rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono px-2 py-1 rounded font-bold"
                style={{ background: cfg.color + '20', color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                {type}
              </span>
            </div>
            <div className="text-sm font-bold mb-2" style={{ color: cfg.color }}>{cfg.label}</div>
            <div className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{cfg.desc}</div>
          </div>
        ))}
      </div>

      {/* Immutability note */}
      <div className="mb-6 p-3 rounded-lg text-xs" style={{ background: '#EF444410', border: '1px solid #EF444430', color: '#EF4444' }}>
        * SEALED 상태의 증빙은 수정, 삭제, 덮어쓰기가 불가합니다. 모든 변경은 새로운 버전으로 생성됩니다.
      </div>

      {/* Seal History */}
      <div style={card} className="rounded-lg p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>봉인 이력</h2>
        <div className="space-y-3">
          {MOCK_SEALS.map((seal) => {
            const cfg = SEAL_TYPE_CONFIG[seal.sealType];
            return (
              <div key={seal.sealId} style={elevated} className="rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm font-mono font-semibold" style={{ color: '#F1F5F9' }}>{seal.sealId}</div>
                    <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                      {seal.targetType} · <span className="font-mono">{seal.targetId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs px-2 py-1 rounded font-bold"
                    style={{ background: cfg.color + '20', color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: '#94A3B8' }}>{seal.sealedBy}</div>
                    <div className="text-xs font-mono" style={{ color: '#64748B' }}>{seal.timestamp}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
