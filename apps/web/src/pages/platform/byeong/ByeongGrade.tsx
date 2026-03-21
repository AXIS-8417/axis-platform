import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const GRADE_INFO = [
  { grade:'R0', label:'신규', color:'#64748B', desc:'가입 직후', minWorks: 0 },
  { grade:'R1', label:'초급', color:'#3B82F6', desc:'작업 5건 이상', minWorks: 5 },
  { grade:'R2', label:'중급', color:'#22C55E', desc:'작업 20건 + GPS 95%', minWorks: 20 },
  { grade:'R3', label:'상급', color:'#F0A500', desc:'작업 50건 + 무사고 90일', minWorks: 50 },
  { grade:'R4', label:'전문', color:'#8B5CF6', desc:'작업 100건 + 심사 PASS', minWorks: 100 },
  { grade:'R5', label:'마스터', color:'#EF4444', desc:'작업 200건 + 추천 3건', minWorks: 200 },
];

export default function ByeongGrade() {
  const [currentGrade, setCurrentGrade] = useState('R0');
  const [totalWorks, setTotalWorks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/platform/crews');
        const crews = res.data?.items || [];
        const myCrew = crews[0];
        if (myCrew) {
          setCurrentGrade(myCrew.riskGrade || 'R0');
          setTotalWorks(myCrew.totalWorks || 0);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const currentIdx = GRADE_INFO.findIndex(g => g.grade === currentGrade);
  const nextGrade = currentIdx < 5 ? GRADE_INFO[currentIdx + 1] : null;
  const progressPct = nextGrade ? Math.min(100, (totalWorks / nextGrade.minWorks) * 100) : 100;
  const remaining = nextGrade ? Math.max(0, nextGrade.minWorks - totalWorks) : 0;

  if (loading) return <div className="p-4 md:p-8 text-center" style={{ color:'#64748B' }}>로딩 중...</div>;

  return (
    <div className="p-4 md:p-8" style={{ background:'#070C12', minHeight:'100vh', color:'#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-6">R등급 현황</h1>

      {/* 현재 등급 + 진급 */}
      {nextGrade && (
        <div className="mb-8 p-6 rounded-lg" style={{ background:'#0C1520', border:`2px solid ${GRADE_INFO[currentIdx].color}` }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: GRADE_INFO[currentIdx].color + '20', border: `3px solid ${GRADE_INFO[currentIdx].color}` }}>
              <span className="text-2xl font-mono font-bold" style={{ color: GRADE_INFO[currentIdx].color }}>{currentGrade}</span>
            </div>
            <div>
              <div className="text-lg font-bold">{GRADE_INFO[currentIdx].label}</div>
              <div className="text-xs" style={{ color:'#64748B' }}>총 시공: {totalWorks}건</div>
            </div>
            <div className="text-2xl mx-4" style={{ color:'#64748B' }}>→</div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: nextGrade.color + '10', border: `2px dashed ${nextGrade.color}` }}>
              <span className="text-2xl font-mono" style={{ color: nextGrade.color }}>{nextGrade.grade}</span>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: nextGrade.color }}>{nextGrade.label}</div>
              <div className="text-xs" style={{ color:'#64748B' }}>{remaining}건 남음</div>
            </div>
          </div>
          <div className="w-full rounded-full h-3" style={{ background:'#1E293B' }}>
            <div className="h-3 rounded-full transition-all" style={{ width: `${progressPct}%`, background: GRADE_INFO[currentIdx].color }} />
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color:'#64748B' }}>
            <span>{totalWorks}건</span>
            <span className="font-mono" style={{ color: GRADE_INFO[currentIdx].color }}>{Math.round(progressPct)}%</span>
            <span>{nextGrade.minWorks}건</span>
          </div>
        </div>
      )}

      {/* 전체 등급 표 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {GRADE_INFO.map(g => {
          const isCurrent = g.grade === currentGrade;
          const isPast = GRADE_INFO.indexOf(g) < currentIdx;
          return (
            <div key={g.grade} className="rounded-lg p-5 transition-all" style={{ background: isCurrent ? g.color+'20' : '#0C1520', border:`2px solid ${isCurrent ? g.color : isPast ? g.color+'60' : '#1E293B'}` }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-mono font-bold" style={{ color: g.color }}>{g.grade}</span>
                {isCurrent && <span className="text-xs px-2 py-0.5 rounded" style={{ background: g.color, color:'#070C12' }}>현재</span>}
                {isPast && <span className="text-xs" style={{ color: g.color }}>✓ 달성</span>}
              </div>
              <div className="font-semibold text-sm">{g.label}</div>
              <div className="text-xs mt-1" style={{ color:'#64748B' }}>{g.desc}</div>
              <div className="text-xs mt-2 font-mono" style={{ color: g.color }}>필요: {g.minWorks}건</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
