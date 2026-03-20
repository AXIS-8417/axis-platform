import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const { token } = useAuthStore();

  return (
    <div className="min-h-screen" style={{ background: '#070C12', color: '#F1F5F9', fontFamily: "'Noto Sans KR',sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#0C1520', borderBottom: '1px solid #1E293B' }} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{ color: '#00D9CC' }} className="font-mono font-bold text-2xl tracking-wider">AXIS</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1E293B', color: '#64748B' }}>v4.8</span>
          </div>
          <div className="flex items-center gap-3">
            {token ? (
              <>
                <Link to="/quotes" className="text-sm hover:underline" style={{ color: '#94A3B8' }}>내 견적</Link>
                <Link to="/dashboard" className="text-sm hover:underline" style={{ color: '#94A3B8' }}>대시보드</Link>
              </>
            ) : (
              <Link to="/auth/login" className="text-sm px-4 py-1.5 rounded" style={{ border: '1px solid #334155', color: '#94A3B8' }}>로그인</Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">건설 가설울타리 통합 플랫폼</h1>
          <p style={{ color: '#94A3B8' }}>견적엔진 · 3자 계약관리 · 시공기록 · 정산</p>
        </div>

        {/* 견적엔진 섹션 */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>견적엔진</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link to="/quote/new" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '2px solid #00D9CC' }}>
              <div className="text-2xl mb-3">📐</div>
              <div className="font-bold mb-1" style={{ color: '#00D9CC' }}>간편견적 (무료)</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>6가지 조건 입력 → 8조합 매트릭스 → BB 시뮬레이션</div>
              <div className="mt-3 text-xs font-mono" style={{ color: '#64748B' }}>759건 데이터 · ±5% 정밀도</div>
            </Link>
            <Link to="/quotes" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
              <div className="text-2xl mb-3">💾</div>
              <div className="font-bold mb-1">견적 기록</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>저장된 견적 조회 · 합산 견적 · 공유 링크 · 이메일 전송</div>
              <div className="mt-3 text-xs font-mono" style={{ color: '#64748B' }}>최대 12개월 보관</div>
            </Link>
            <Link to="/contractor/requests" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
              <div className="text-2xl mb-3">🔧</div>
              <div className="font-bold mb-1">업체 응답 (을)</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>견적 수신 · E블록 자동계산 · 스펙 변경 · 견적 제출</div>
              <div className="mt-3 text-xs font-mono" style={{ color: '#64748B' }}>실전형/표준형 비교</div>
            </Link>
          </div>
        </div>

        {/* 플랫폼 섹션 */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#3B82F6' }}>건설 3자 계약관리 플랫폼</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link to="/platform/gap" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '2px solid #F0A500' }}>
              <div className="text-2xl mb-3">🏢</div>
              <div className="font-bold mb-1" style={{ color: '#F0A500' }}>갑 포털 (발주자)</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>현장관리 · 작업기록 조회 · 서류조회 · 청구승인 · 설계변경</div>
              <div className="mt-3 text-xs" style={{ color: '#64748B' }}>6개 탭 · 계층뷰 · 72h 카운트다운</div>
            </Link>
            <Link to="/platform/eul" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '2px solid #00D9CC' }}>
              <div className="text-2xl mb-3">⚙️</div>
              <div className="font-bold mb-1" style={{ color: '#00D9CC' }}>을 포털 (시공사)</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>작업지시 · 호출매칭 · 건설기계 · 간편서명 · 레미콘 · 정산</div>
              <div className="mt-3 text-xs" style={{ color: '#64748B' }}>8개 탭 · 13항목 검증 · K×L 계산</div>
            </Link>
            <Link to="/platform/byeong" className="rounded-lg p-6 transition-all hover:opacity-90" style={{ background: '#0C1520', border: '2px solid #22C55E' }}>
              <div className="text-2xl mb-3">👷</div>
              <div className="font-bold mb-1" style={{ color: '#22C55E' }}>병 포털 (작업팀)</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>호출수신 · 시공일보 · 안전체크 · R등급 · 근로계약</div>
              <div className="mt-3 text-xs" style={{ color: '#64748B' }}>6개 탭 · 거부 권리 보장</div>
            </Link>
          </div>
        </div>

        {/* 통계 + 핵심 원칙 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
            <h3 className="text-xs font-semibold mb-4" style={{ color: '#F0A500' }}>플랫폼 통계</h3>
            <div className="grid grid-cols-2 gap-4">
              {[['759건','시공 데이터'],['60버킷','조합 분석'],['26개','DB 테이블'],['54개','API 엔드포인트']].map(([v,l]) => (
                <div key={l}><div className="font-bold text-lg font-mono" style={{ color: '#00D9CC' }}>{v}</div><div className="text-xs" style={{ color: '#64748B' }}>{l}</div></div>
              ))}
            </div>
          </div>
          <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
            <h3 className="text-xs font-semibold mb-4" style={{ color: '#F0A500' }}>핵심 원칙</h3>
            <div className="space-y-2 text-sm" style={{ color: '#94A3B8' }}>
              <div>· 기록 중심 — 판단하지 않고 사실만 기록</div>
              <div>· 봉인 불변 — SEALED 레코드는 수정/삭제 불가</div>
              <div>· 3자 투명 — 갑·을·병 상호 조회 가능</div>
              <div>· 갑 근로계약 차단 — 을·병 당사자만 열람</div>
              <div>· 병 거부 권리 — 호출 거부 시 불이익 없음</div>
            </div>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <div className="flex justify-center gap-4">
          <Link to="/platform/login" className="px-8 py-3 rounded-lg font-bold text-sm" style={{ background: '#00D9CC', color: '#070C12' }}>플랫폼 로그인</Link>
          <Link to="/auth/login" className="px-8 py-3 rounded-lg font-bold text-sm" style={{ border: '1px solid #334155', color: '#94A3B8' }}>견적엔진 로그인</Link>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: '#334155' }}>NS기업 × AXIS Platform · 건설 가설울타리 전문</p>
      </div>
    </div>
  );
}
