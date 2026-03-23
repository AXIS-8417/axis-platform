import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api';

interface RepData {
  responseScore: number;
  deliveryScore: number;
  reliabilityScore: number;
  recordScore: number;
  totalScore: number;
  grade: string;
  rollingDays: number;
  penalties: Array<{ type: string; date: string; deducted: number }>;
  excluded: number;
}

const MOCK: RepData = {
  responseScore: 20, deliveryScore: 25, reliabilityScore: 22, recordScore: 15,
  totalScore: 82, grade: '양호', rollingDays: 90,
  penalties: [
    { type: '7일 무응답 경고', date: '2026-02-15', deducted: 5 },
  ],
  excluded: 2,
};

const CATEGORIES = [
  { key: 'responseScore', label: '응답률', max: 25, desc: '견적요청 응답 속도', icon: '⚡' },
  { key: 'deliveryScore', label: '납기준수율', max: 30, desc: '설치예정일 준수', icon: '📅' },
  { key: 'reliabilityScore', label: '이행신뢰도', max: 25, desc: '연장/취소 이력', icon: '🤝' },
  { key: 'recordScore', label: '기록충실도', max: 20, desc: '진행상황 입력 빈도', icon: '📝' },
] as const;

function barColor(pct: number) {
  if (pct >= 80) return '#22C55E';
  if (pct >= 60) return '#EAB308';
  return '#EF4444';
}

function gradeColor(grade: string) {
  if (grade === '우수') return '#22C55E';
  if (grade === '양호') return '#3B82F6';
  if (grade === '보통') return '#EAB308';
  if (grade === '주의') return '#F97316';
  return '#EF4444';
}

export default function EulReputation() {
  const [data, setData] = useState<RepData>(MOCK);

  useEffect(() => {
    api.get('/api/platform/reputation').then(r => {
      if (r.data?.totalScore) setData({ ...MOCK, ...r.data });
    }).catch(() => {});
  }, []);

  const gc = gradeColor(data.grade);
  const pct = data.totalScore;
  const r = 54, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">을 평판 관리</h1>
        <span className="text-xs" style={{ color: '#64748B' }}>{data.rollingDays}일 롤링 평균</span>
      </div>

      {/* Hero: 총점 원형 */}
      <div className="flex items-center gap-8 mb-8 p-6 rounded-lg" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#1E293B" strokeWidth="10" />
            <circle cx="60" cy="60" r={r} fill="none" stroke={gc} strokeWidth="10"
              strokeDasharray={c} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-mono font-bold" style={{ color: gc }}>{pct}</div>
            <div className="text-xs" style={{ color: '#64748B' }}>/100</div>
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold mb-1" style={{ color: gc }}>{data.grade}</div>
          <div className="text-sm" style={{ color: '#94A3B8' }}>총 {pct}점 · 90일 롤링 평균</div>
          <div className="text-xs mt-2" style={{ color: '#64748B' }}>
            응답률 {data.responseScore}/25 · 납기 {data.deliveryScore}/30 · 이행 {data.reliabilityScore}/25 · 기록 {data.recordScore}/20
          </div>
        </div>
      </div>

      {/* 4개 카테고리 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {CATEGORIES.map(cat => {
          const score = data[cat.key as keyof RepData] as number;
          const p = Math.round(score / cat.max * 100);
          return (
            <div key={cat.key} className="p-5 rounded-lg" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{cat.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{cat.label}</div>
                  <div className="text-xs" style={{ color: '#64748B' }}>{cat.desc}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono font-bold" style={{ color: barColor(p) }}>{score}</div>
                  <div className="text-xs" style={{ color: '#64748B' }}>/{cat.max}</div>
                </div>
              </div>
              <div className="h-2 rounded-full" style={{ background: '#1E293B' }}>
                <div className="h-full rounded-full transition-all" style={{ width: p + '%', background: barColor(p) }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 갑 귀책 제외 (§10.2) */}
      <div className="p-5 rounded-lg mb-6" style={{ background: '#0C1520', border: '1px solid #1E3A5F' }}>
        <div className="font-semibold text-sm mb-3" style={{ color: '#3B82F6' }}>갑 귀책 제외 기준 — 을 평판 영향 없음</div>
        <div className="space-y-2 text-xs" style={{ color: '#94A3B8' }}>
          {[
            '갑 귀책 취소 → 을 평판 영향 없음',
            '갑 견적변경 요청 → 을 거절해도 영향 없음',
            '갑 연장 신청 건 → 을 평판 영향 없음',
            '불가항력 사유 등록 → 유예 (3건 반복 시 재검토)',
          ].map(t => <div key={t} className="flex items-center gap-2"><span style={{ color: '#22C55E' }}>✓</span>{t}</div>)}
        </div>
        <div className="mt-3 text-xs font-mono px-3 py-1.5 rounded inline-block" style={{ background: '#3B82F620', color: '#3B82F6' }}>
          제외 처리: {data.excluded}건
        </div>
      </div>

      {/* 을 귀책 감점 이력 (§10.3) */}
      <div className="p-5 rounded-lg mb-6" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
        <div className="font-semibold text-sm mb-3" style={{ color: '#F0A500' }}>을 귀책 감점 이력</div>
        {data.penalties.length > 0 ? (
          <div className="space-y-2">
            {data.penalties.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1E293B' }}>
                <div>
                  <div className="text-sm">{p.type}</div>
                  <div className="text-xs" style={{ color: '#64748B' }}>{p.date}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: '#EF444420', color: '#EF4444' }}>
                  -{p.deducted}점
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs" style={{ color: '#64748B' }}>감점 이력 없음</div>
        )}
        <div className="mt-3 text-xs space-y-1" style={{ color: '#64748B' }}>
          <div>• 7일 무응답 자동취소 → 경고 1회</div>
          <div>• 설치예정일 미준수 (을 귀책) → 납기준수율 하락</div>
          <div>• 3회+ 연장 신청 (을 요청) → 이행신뢰도 하락</div>
        </div>
      </div>

      {/* 색상 범례 (§10.4) */}
      <div className="p-4 rounded-lg mb-6" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
        <div className="font-semibold text-xs mb-2" style={{ color: '#64748B' }}>대시보드 색상 기준</div>
        <div className="flex gap-4 flex-wrap text-xs">
          {[
            ['#22C55E', '정상 진행 중'],
            ['#EAB308', '7일 이내 무응답'],
            ['#EF4444', '10일 이상 무응답'],
            ['#64748B', '취소 완료'],
            ['#3B82F6', '완료 봉인'],
          ].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span style={{ color: '#94A3B8' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <Link to="/platform/eul" className="text-xs px-4 py-2 rounded" style={{ border: '1px solid #334155', color: '#94A3B8' }}>← 을 대시보드</Link>
    </div>
  );
}
