import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const MENUS: Record<string, { label: string; path: string; section?: string }[]> = {
  갑: [
    { label: '홈', path: '/platform/gap' },
    { label: '현장관리', path: '/platform/gap/sites' },
    { label: '작업기록', path: '/platform/gap/records' },
    { label: '서류조회', path: '/platform/gap/documents' },
    { label: '청구·결제', path: '/platform/gap/billing' },
    { label: '설계변경', path: '/platform/gap/design-change' },
    { label: '───', path: '', section: 'divider' },
    { label: '대시보드', path: '/platform/dashboard', section: 'engine' },
    { label: 'GPS 엔진', path: '/platform/gps', section: 'engine' },
    { label: '리스크/TCI', path: '/platform/risk', section: 'engine' },
    { label: '봉인·증빙', path: '/platform/seal', section: 'engine' },
    { label: '회원관리', path: '/platform/members', section: 'engine' },
    { label: '견적엔진', path: '/quote/new', section: 'engine' },
    { label: '견적기록', path: '/quotes', section: 'engine' },
  ],
  을: [
    { label: '홈', path: '/platform/eul' },
    { label: '작업지시', path: '/platform/eul/work-orders' },
    { label: '호출매칭', path: '/platform/eul/calls' },
    { label: '게이트', path: '/platform/eul/gate' },
    { label: '정산', path: '/platform/eul/settlement' },
    { label: '건설기계', path: '/platform/eul/equipment' },
    { label: '간편서명', path: '/platform/eul/contracts' },
    { label: '레미콘', path: '/platform/eul/remicon' },
    { label: '───', path: '', section: 'divider' },
    { label: '대시보드', path: '/platform/dashboard', section: 'engine' },
    { label: 'GPS 엔진', path: '/platform/gps', section: 'engine' },
    { label: '리스크/TCI', path: '/platform/risk', section: 'engine' },
    { label: '봉인·증빙', path: '/platform/seal', section: 'engine' },
    { label: '견적엔진', path: '/quote/new', section: 'engine' },
    { label: '견적기록', path: '/quotes', section: 'engine' },
    { label: '견적응답', path: '/contractor/requests', section: 'engine' },
  ],
  병: [
    { label: '홈', path: '/platform/byeong' },
    { label: '호출수신', path: '/platform/byeong/calls' },
    { label: '시공일보', path: '/platform/byeong/reports' },
    { label: '안전체크', path: '/platform/byeong/safety' },
    { label: 'R등급', path: '/platform/byeong/grade' },
    { label: '근로계약', path: '/platform/byeong/contracts' },
    { label: '───', path: '', section: 'divider' },
    { label: '대시보드', path: '/platform/dashboard', section: 'engine' },
    { label: 'GPS 엔진', path: '/platform/gps', section: 'engine' },
    { label: '리스크/TCI', path: '/platform/risk', section: 'engine' },
    { label: '봉인·증빙', path: '/platform/seal', section: 'engine' },
  ],
};

const ROLE_COLORS: Record<string, string> = { 갑: '#F0A500', 을: '#00D9CC', 병: '#22C55E' };

export default function PlatformLayout({ role, children }: { role: string; children: ReactNode }) {
  const loc = useLocation();
  const { logout } = useAuthStore();
  const menus = MENUS[role] || [];
  const color = ROLE_COLORS[role] || '#00D9CC';
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#070C12', color: '#F1F5F9' }}>
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: '#0C1520', borderBottom: '1px solid #1E293B' }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="font-mono font-bold text-lg" style={{ color: '#00D9CC' }}>AXIS</Link>
          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: color + '20', color, border: `1px solid ${color}` }}>{role}</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg" style={{ color: '#94A3B8' }}>
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpen(false)} />
      )}

      {/* Sidebar — desktop: static, mobile: slide-in drawer */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 md:w-56 flex-shrink-0 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
        style={{ background: '#0C1520', borderRight: '1px solid #1E293B' }}
      >
        {/* Sidebar header */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div>
            <Link to="/" className="font-mono font-bold text-xl" style={{ color: '#00D9CC' }}>AXIS</Link>
            <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-bold" style={{ background: color + '20', color, border: `1px solid ${color}` }}>{role}</div>
          </div>
          {/* Close button — mobile only */}
          <button onClick={() => setOpen(false)} className="md:hidden p-1 rounded" style={{ color: '#64748B' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menus.map((m, i) => {
            if (m.section === 'divider') return <div key={i} className="my-2" style={{ borderTop: '1px solid #1E293B' }} />;
            const active = loc.pathname === m.path;
            const isEngine = m.section === 'engine';
            return (
              <Link key={m.path || i} to={m.path}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: active ? color + '15' : 'transparent',
                  color: active ? color : isEngine ? '#64748B' : '#94A3B8',
                  borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
                  fontSize: isEngine ? '12px' : undefined,
                }}>
                {isEngine ? '📐 ' : ''}{m.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid #1E293B' }}>
          <button onClick={() => { logout(); window.location.href = '/platform/login'; }} className="text-sm hover:underline" style={{ color: '#64748B' }}>로그아웃</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}
