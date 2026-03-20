import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ROLES = [
  { key: '갑', icon: '🏢', label: '갑 (발주자)', desc: '현장관리 · 서류조회 · 결제승인 · 설계변경', color: '#F0A500', path: '/platform/gap' },
  { key: '을', icon: '⚙️', label: '을 (시공사)', desc: '작업지시 · 호출매칭 · 건설기계 · 정산관리', color: '#00D9CC', path: '/platform/eul' },
  { key: '병', icon: '👷', label: '병 (작업팀)', desc: '시공일보 · 안전체크 · R등급 · 근로계약', color: '#22C55E', path: '/platform/byeong' },
];

export default function Home() {
  const { token } = useAuthStore();

  return (
    <div className="min-h-screen" style={{ background: '#070C12', color: '#F1F5F9', fontFamily: "'Noto Sans KR',sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#0C1520', borderBottom: '1px solid #1E293B' }} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{ color: '#00D9CC' }} className="font-mono font-bold text-2xl tracking-wider">AXIS</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1E293B', color: '#64748B' }}>v4.8 · CANON v14</span>
          </div>
          <div className="flex items-center gap-3">
            {token ? (
              <>
                <Link to="/platform/dashboard" className="text-sm hover:underline" style={{ color: '#94A3B8' }}>대시보드</Link>
                <Link to="/quotes" className="text-sm hover:underline" style={{ color: '#94A3B8' }}>내 견적</Link>
              </>
            ) : (
              <>
                <Link to="/platform/login" className="text-sm px-4 py-1.5 rounded" style={{ border: '1px solid #334155', color: '#94A3B8' }}>로그인</Link>
                <Link to="/platform/signup" className="text-sm px-4 py-1.5 rounded font-semibold" style={{ background: '#00D9CC', color: '#070C12' }}>회원가입</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-xs font-mono mb-3 tracking-widest" style={{ color: '#00D9CC' }}>AXIS PLATFORM</div>
          <h1 className="text-3xl font-bold mb-3">건설 가설울타리 통합 플랫폼</h1>
          <p style={{ color: '#94A3B8' }}>견적엔진 · 3자 계약관리 · 시공기록 · 정산 · 봉인</p>
        </div>

        {/* 견적엔진 — 무료 진입 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#F0A500' }}>견적엔진</h2>
            <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: '#22C55E20', color: '#22C55E' }}>FREE</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Link to="/quote/new" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '2px solid #00D9CC' }}>
              <div className="text-2xl mb-3">📐</div>
              <div className="font-bold mb-1" style={{ color: '#00D9CC' }}>간편견적</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>6Q + 8조합 매트릭스 + BB 시뮬레이션</div>
              <div className="mt-3 text-xs font-mono" style={{ color: '#64748B' }}>759건 데이터 · ±5%</div>
            </Link>
            <Link to="/quotes" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
              <div className="text-2xl mb-3">💾</div>
              <div className="font-bold mb-1">견적 기록</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>저장 · 합산 · 공유 링크 · 이메일 전송</div>
            </Link>
            <Link to="/contractor/requests" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
              <div className="text-2xl mb-3">🔧</div>
              <div className="font-bold mb-1">업체 응답 (을)</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>E블록 자동계산 · 3트랙 응답</div>
            </Link>
          </div>
        </div>

        {/* 3자 플랫폼 */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#3B82F6' }}>건설 3자 계약관리 플랫폼</h2>
          <div className="grid grid-cols-3 gap-4">
            {ROLES.map(r => (
              <Link key={r.key} to={token ? r.path : '/platform/login'} className="rounded-lg p-6 transition-all hover:opacity-90"
                style={{ background: '#0C1520', border: `2px solid ${r.color}` }}>
                <div className="text-2xl mb-3">{r.icon}</div>
                <div className="font-bold mb-1" style={{ color: r.color }}>{r.label}</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>{r.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* 시스템 기능 */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#8B5CF6' }}>시스템 기능</h2>
          <div className="grid grid-cols-5 gap-3">
            {[
              { icon: '📊', label: '대시보드', path: '/platform/dashboard' },
              { icon: '📡', label: 'GPS 엔진', path: '/platform/gps' },
              { icon: '🎯', label: '리스크/TCI', path: '/platform/risk' },
              { icon: '🔒', label: '봉인·증빙', path: '/platform/seal' },
              { icon: '👥', label: '회원관리', path: '/platform/members' },
            ].map(f => (
              <Link key={f.label} to={token ? f.path : '/platform/login'} className="rounded-lg p-4 text-center transition-all hover:opacity-80"
                style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
                <div className="text-xl mb-2">{f.icon}</div>
                <div className="text-xs font-semibold">{f.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* CANON 원칙 */}
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-8">
          <div className="text-xs font-semibold mb-4" style={{ color: '#8B5CF6' }}>CANON v14 — 핵심 원칙</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['🔒 기록 중심', '사실만 기록. 판단하지 않음', '#00D9CC'],
              ['⚡ 판단 배제', '결론·추천·귀책 판단 불가', '#3B82F6'],
              ['🔗 봉인 불변', 'SEALED = 수정·삭제·선별 불가', '#8B5CF6'],
            ].map(([t, d, c]) => (
              <div key={t} className="p-3 rounded" style={{ background: c + '10', border: `1px solid ${c}30` }}>
                <div className="text-xs font-bold mb-1" style={{ color: c }}>{t}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[['26+', 'DB 테이블'], ['54', 'API 엔드포인트'], ['46', '코드그룹'], ['759', '시공 데이터']].map(([v, l]) => (
            <div key={l} className="text-center p-4 rounded-lg" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
              <div className="font-mono font-bold text-xl" style={{ color: '#00D9CC' }}>{v}</div>
              <div className="text-xs mt-1" style={{ color: '#64748B' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-4 mb-8">
          <Link to="/quote/new" className="px-8 py-3 rounded-lg font-bold text-sm" style={{ background: '#00D9CC', color: '#070C12' }}>무료 견적 시작</Link>
          <Link to="/platform/login" className="px-8 py-3 rounded-lg font-bold text-sm" style={{ border: '1px solid #334155', color: '#94A3B8' }}>플랫폼 로그인</Link>
        </div>

        <p className="text-center text-xs" style={{ color: '#334155' }}>NS기업 × AXIS Platform · CANON v14 · 60 테이블 · Gate v6</p>
      </div>
    </div>
  );
}
