import { useState, useEffect } from 'react';
import api from '../../lib/api';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };

const StatCard = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
  <div style={card} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</div>
    <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
    {sub && <div className="text-xs mt-1" style={{ color: '#64748B' }}>{sub}</div>}
  </div>
);

const ARCH_LINKS = [
  { code: 'PART258', label: 'GPS 엔진', desc: '자동전환 상태머신', color: '#00D9CC' },
  { code: 'PART259', label: '리스크/TCI', desc: '신뢰지수 엔진', color: '#F0A500' },
  { code: 'PART263', label: '건설기계', desc: '장비 배차·정산', color: '#8B5CF6' },
  { code: '상태머신', label: '봉인·증빙', desc: 'SEALED 불변 증빙', color: '#3B82F6' },
];

const CANON_V14 = [
  { icon: '🔒', label: '기록 중심', desc: '옳고 그름을 말하지 않고 사실만 기록', color: '#22C55E' },
  { icon: '⚡', label: '판단 배제', desc: '결론·추천·귀책 판단 절대 불가', color: '#F0A500' },
  { icon: '🔗', label: '봉인 불변', desc: 'SEALED 레코드는 수정·삭제·선별 전부 불가', color: '#EF4444' },
  { icon: '👥', label: '3자 투명', desc: '갑·을·병 모든 기록은 권한 범위 내 상호 조회', color: '#3B82F6' },
  { icon: '⏱', label: '72h 규칙', desc: '설계변경 무응답 → DISAGREEMENT 자동 전이', color: '#8B5CF6' },
  { icon: '📦', label: '증빙 단위', desc: '외부 제공은 EVIDENCE_PKG_ID 단위만', color: '#00D9CC' },
];

const DOMAIN_MAP: { domain: string; color: string; count: number; tables: string[] }[] = [
  { domain: '기준·마스터', color: '#00D9CC', count: 6, tables: ['00_권한매트릭스', '01_코드마스터', '02_공통설정', '03_역할정의', '04_알림설정', '05_시스템코드'] },
  { domain: '주체·사용자', color: '#22C55E', count: 5, tables: ['03_주체목록', '04_사용자목록', '05_권한그룹', '06_인증로그', '07_세션관리'] },
  { domain: '현장·설계', color: '#3B82F6', count: 5, tables: ['08_현장마스터', '09_설계변경', '10_도면관리', '11_공정관리', '12_현장설정'] },
  { domain: '단가·견적', color: '#F0A500', count: 5, tables: ['13_단가마스터', '14_견적서', '15_견적항목', '16_단가이력', '17_승인로그'] },
  { domain: '작업·호출', color: '#8B5CF6', count: 4, tables: ['18_작업지시', '19_호출매칭', '20_장비배차', '21_작업이력'] },
  { domain: '일보·잠금', color: '#FF7849', count: 6, tables: ['22_시공일보', '23_일보항목', '24_봉인로그', '25_잠금상태', '26_봉인검증', '27_봉인이력'] },
  { domain: '보험·증빙', color: '#EF4444', count: 6, tables: ['28_보험마스터', '29_증빙패키지', '30_증빙항목', '31_감사로그', '32_보험상태', '33_보험이력'] },
  { domain: '자재·게이트', color: '#14B8A6', count: 7, tables: ['34_자재마스터', '35_자재입출', '36_게이트마스터', '37_게이트이벤트', '38_재고이력', '39_입출로그', '40_자재요청'] },
  { domain: '정산·결제', color: '#EC4899', count: 7, tables: ['41_청구서', '42_바이백', '43_월임대', '44_결제마스터', '45_결제상태', '46_정산이력', '47_정산검증'] },
  { domain: '안전·계약', color: '#A855F7', count: 6, tables: ['48_안전점검', '49_사고기록', '50_계약마스터', '51_계약조건', '52_계약상태', '53_계약이력'] },
];

const TECH_LAYERS = [
  { layer: 'UI', desc: 'React + Tailwind + 다크테마', color: '#00D9CC' },
  { layer: 'API', desc: 'Fastify REST + JWT 인증', color: '#3B82F6' },
  { layer: 'State Machine', desc: '봉인·정산·호출 상태전이', color: '#F0A500' },
  { layer: 'Data', desc: 'PostgreSQL 60테이블 + Prisma ORM', color: '#22C55E' },
  { layer: 'GPS Engine', desc: '위치기반 자동전환 엔진', color: '#8B5CF6' },
  { layer: 'PG Integration', desc: '결제 게이트웨이 연동', color: '#EC4899' },
  { layer: 'Gate Engine', desc: '자재 입출·게이트 관리', color: '#14B8A6' },
];

interface DashStats {
  siteCount: number;
  siteActive: number;
  siteComplete: number;
  workOrderCount: number;
  equipCount: number;
  sealCount: number;
  billingTotal: string;
}

export default function PlatformDash() {
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);
  const [stats, setStats] = useState<DashStats>({
    siteCount: 0, siteActive: 0, siteComplete: 0,
    workOrderCount: 0, equipCount: 0, sealCount: 0, billingTotal: '0',
  });
  const [sites, setSites] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    // Fetch all stats in parallel
    Promise.allSettled([
      api.get('/api/platform/sites'),
      api.get('/api/platform/work-orders'),
      api.get('/api/platform/equipment'),
      api.get('/api/platform/seals'),
      api.get('/api/platform/billings'),
    ]).then(([sitesR, woR, equipR, sealsR, billR]) => {
      const siteItems = sitesR.status === 'fulfilled' ? (sitesR.value.data?.items || []) : [];
      const woItems = woR.status === 'fulfilled' ? (woR.value.data?.items || woR.value.data?.data || []) : [];
      const equipItems = equipR.status === 'fulfilled' ? (equipR.value.data?.items || equipR.value.data?.data || []) : [];
      const sealItems = sealsR.status === 'fulfilled' ? (sealsR.value.data?.items || []) : [];
      const billItems = billR.status === 'fulfilled' ? (billR.value.data?.items || []) : [];

      const totalBilling = billItems.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
      const formatBilling = totalBilling >= 1000000
        ? (totalBilling / 1000000).toFixed(1) + 'M'
        : totalBilling.toLocaleString();

      setSites(siteItems.slice(0, 5));
      setStats({
        siteCount: siteItems.length,
        siteActive: siteItems.filter((s: any) => s.status !== 'COMPLETED' && s.status !== '완료').length,
        siteComplete: siteItems.filter((s: any) => s.status === 'COMPLETED' || s.status === '완료').length,
        workOrderCount: woItems.length,
        equipCount: equipItems.length,
        sealCount: sealItems.length,
        billingTotal: formatBilling,
      });
      setLastRefresh(new Date());
    });
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl font-bold mb-2">AXIS Platform Dashboard</h1>
      <div className="text-xs mb-6" style={{ color: '#64748B' }}>
        실시간 현황 (마지막 갱신: {lastRefresh.toLocaleTimeString('ko-KR')})
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="현장" value={stats.siteCount} color="#00D9CC" sub={`진행 ${stats.siteActive} / 완료 ${stats.siteComplete}`} />
        <StatCard label="작업지시" value={stats.workOrderCount} color="#22C55E" sub="전체 건수" />
        <StatCard label="장비" value={stats.equipCount} color="#8B5CF6" sub="등록 건수" />
        <StatCard label="봉인" value={stats.sealCount} color="#F0A500" sub="SEALED 건수" />
        <StatCard label="정산" value={stats.billingTotal} color="#FF7849" sub="누적 (KRW)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Left: 현장 현황 */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>현장 현황</h2>
          <div className="space-y-4">
            {sites.length > 0 ? sites.map((s: any, i: number) => {
              const progress = s.progress || (s.status === 'COMPLETED' || s.status === '완료' ? 100 : 50);
              return (
                <div key={s.siteId || i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{s.siteName || s.name || `현장 ${i + 1}`}</span>
                    <span className="text-xs font-mono" style={{ color: '#64748B' }}>{s.panelType || '-'} · {s.length || '-'}m</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ background: '#1E293B' }}>
                    <div className="h-2 rounded-full" style={{
                      width: `${progress}%`,
                      background: progress === 100 ? '#64748B' : progress >= 70 ? '#22C55E' : '#F0A500',
                    }} />
                  </div>
                  <div className="text-right text-xs mt-1" style={{ color: progress === 100 ? '#64748B' : '#94A3B8' }}>
                    {progress}%{progress === 100 ? ' (완료)' : ''}
                  </div>
                </div>
              );
            }) : (
              <div className="text-sm" style={{ color: '#64748B' }}>등록된 현장이 없습니다.</div>
            )}
          </div>
        </div>

        {/* Right: Architecture */}
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
        </div>
      </div>

      {/* CANON v14 */}
      <div style={card} className="rounded-lg p-6 mb-8">
        <h2 className="text-sm font-bold mb-1" style={{ color: '#22C55E' }}>CANON v14 &mdash; 헌법적 원칙</h2>
        <div className="text-xs mb-4" style={{ color: '#64748B' }}>플랫폼이 절대 위반할 수 없는 6대 원칙</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {CANON_V14.map((c, i) => (
            <div key={i} style={elevated} className="rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{c.icon}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: c.color }}>{c.label}</div>
                  <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{c.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 60 테이블 도메인 맵 */}
      <div style={card} className="rounded-lg p-6 mb-8">
        <h2 className="text-sm font-bold mb-1" style={{ color: '#8B5CF6' }}>60 테이블 도메인 맵</h2>
        <div className="text-xs mb-4" style={{ color: '#64748B' }}>10개 도메인 · 60개 테이블 — 클릭하여 테이블 목록 확인</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {DOMAIN_MAP.map((d, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedDomain(expandedDomain === i ? null : i)}
                className="w-full text-left rounded-lg p-3 transition-colors"
                style={{
                  background: expandedDomain === i ? d.color + '15' : '#111B2A',
                  border: `1px solid ${expandedDomain === i ? d.color + '50' : '#1E293B'}`,
                  cursor: 'pointer',
                }}
              >
                <div className="text-xs font-bold" style={{ color: d.color }}>{d.domain}</div>
                <div className="text-xs mt-1" style={{ color: '#64748B' }}>{d.count}개 테이블</div>
              </button>
              {expandedDomain === i && (
                <div className="mt-2 rounded-lg p-3 space-y-1" style={{ background: '#0A1018', border: `1px solid ${d.color}30` }}>
                  {d.tables.map((t, ti) => (
                    <div key={ti} className="text-xs font-mono" style={{ color: '#94A3B8' }}>{t}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 기술 스택 레이어 */}
      <div style={card} className="rounded-lg p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>기술 스택 레이어</h2>
        <div className="space-y-2">
          {TECH_LAYERS.map((t, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg p-3" style={elevated}>
              <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                style={{ background: t.color + '20', color: t.color, border: `1px solid ${t.color}40` }}>
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: t.color }}>{t.layer}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
