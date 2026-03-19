import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <div className="inline-flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider mb-4">
          ▲ AXIS PLATFORM v4.7 — MVP
        </div>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">건설 하도급 견적 플랫폼</h1>
        <p className="text-sm text-[#64748b]">가설방음벽 전문 · 갑/을 통합 · 3사 759건 · No.26~75</p>
      </div>

      {/* 갑/을 선택 */}
      <div className="max-w-lg mx-auto px-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link to="/quote/new" className="block bg-[#eff6ff] border-2 border-[#bfdbfe] rounded-xl p-5 text-center hover:border-[#3b82f6] transition-colors">
            <div className="text-3xl mb-3">🏗</div>
            <div className="font-bold text-sm text-[#0f172a] mb-1">발주처 (갑)</div>
            <div className="text-xs text-[#64748b] mb-3">견적요청 · 비교 · 계약</div>
            <div className="bg-[#2563eb] text-white text-sm font-bold py-2 rounded-lg">시작 →</div>
          </Link>
          <Link to="/contractor/requests" className="block bg-[#f5f3ff] border-2 border-[#ddd6fe] rounded-xl p-5 text-center hover:border-[#7c3aed] transition-colors">
            <div className="text-3xl mb-3">🔧</div>
            <div className="font-bold text-sm text-[#0f172a] mb-1">하도급사 (을)</div>
            <div className="text-xs text-[#64748b] mb-3">견적수신 · E블록 · 제출</div>
            <div className="bg-[#7c3aed] text-white text-sm font-bold py-2 rounded-lg">시작 →</div>
          </Link>
        </div>

        {/* 통계 */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 mb-3">
          <div className="grid grid-cols-4 text-center gap-2">
            {[['759건','시공 데이터'],['60버킷','조합 분석'],['±5%','엔진 정밀도'],['No.26~75','의사결정']].map(([v,l]) => (
              <div key={l}>
                <div className="font-bold text-lg text-[#0f172a]">{v}</div>
                <div className="text-xs text-[#64748b]">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 설계 원칙 */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 mb-3">
          <div className="text-xs font-bold text-[#334155] mb-2">설계 원칙</div>
          <div className="flex flex-wrap gap-1.5">
            {['플랫폼=증거 채널','BB 자산4종 분리','경비=동적 계산','을=데이터 파이프라인','단가=갑 전용 비공개','버킷=시장위치 판단용'].map(t => (
              <span key={t} className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full font-medium">{t}</span>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#94a3b8] mt-4 pb-8">NS기업 × AXIS | 2층구조 | BB파라미터 엔진 | 46번시트 도어 | 을 2계층</p>
      </div>
    </div>
  );
}
