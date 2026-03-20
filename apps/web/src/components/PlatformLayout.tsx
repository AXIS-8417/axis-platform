import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const MENUS: Record<string, { label: string; path: string }[]> = {
  갑: [
    { label: '홈', path: '/platform/gap' },
    { label: '현장관리', path: '/platform/gap/sites' },
    { label: '작업기록', path: '/platform/gap/records' },
    { label: '서류조회', path: '/platform/gap/documents' },
    { label: '청구·결제', path: '/platform/gap/billing' },
    { label: '설계변경', path: '/platform/gap/design-change' },
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
  ],
  병: [
    { label: '홈', path: '/platform/byeong' },
    { label: '호출수신', path: '/platform/byeong/calls' },
    { label: '시공일보', path: '/platform/byeong/reports' },
    { label: '안전체크', path: '/platform/byeong/safety' },
    { label: 'R등급', path: '/platform/byeong/grade' },
    { label: '근로계약', path: '/platform/byeong/contracts' },
  ],
};

const ROLE_COLORS: Record<string, string> = { 갑: '#F0A500', 을: '#00D9CC', 병: '#22C55E' };

export default function PlatformLayout({ role, children }: { role: string; children: ReactNode }) {
  const loc = useLocation();
  const { logout } = useAuthStore();
  const menus = MENUS[role] || [];
  const color = ROLE_COLORS[role] || '#00D9CC';

  return (
    <div className="min-h-screen flex" style={{ background: '#070C12', color: '#F1F5F9' }}>
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: '#0C1520', borderRight: '1px solid #1E293B' }}>
        <div className="px-5 py-5">
          <Link to="/" className="font-mono font-bold text-xl" style={{ color: '#00D9CC' }}>AXIS</Link>
          <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-bold" style={{ background: color + '20', color, border: `1px solid ${color}` }}>{role}</div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {menus.map(m => {
            const active = loc.pathname === m.path;
            return (
              <Link key={m.path} to={m.path} className="block px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ background: active ? color + '15' : 'transparent', color: active ? color : '#94A3B8', borderLeft: active ? `3px solid ${color}` : '3px solid transparent' }}>
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4" style={{ borderTop: '1px solid #1E293B' }}>
          <button onClick={() => { logout(); window.location.href = '/platform/login'; }} className="text-sm hover:underline" style={{ color: '#64748B' }}>로그아웃</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
