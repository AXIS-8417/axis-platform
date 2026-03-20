import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

const ROLES = [
  { key: '갑', label: '갑 (발주자)', desc: '현장 관리, 서류 조회, 결제 승인', color: '#F0A500' },
  { key: '을', label: '을 (시공사)', desc: '작업지시, 크루 호출, 정산 관리', color: '#00D9CC' },
  { key: '병', label: '병 (작업팀)', desc: '시공일보, 안전체크, 호출 응답', color: '#22C55E' },
];

export default function PlatformLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [selectedRole, setSelectedRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) { setError('역할을 선택하세요.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setAuth(data.token, data.user);
      const paths: Record<string,string> = { 갑: '/platform/gap', 을: '/platform/eul', 병: '/platform/byeong' };
      navigate(paths[selectedRole] || '/platform/gap');
    } catch (err: any) { setError(err.response?.data?.error || '로그인 실패'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#070C12' }}>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <span className="font-mono font-bold text-3xl" style={{ color: '#00D9CC' }}>AXIS</span>
          <p style={{ color: '#64748B' }} className="mt-2 text-sm">건설 3자 계약 관리 플랫폼</p>
        </div>
        <div className="flex gap-2 mb-6">
          {ROLES.map(r => (
            <button key={r.key} onClick={() => setSelectedRole(r.key)}
              className="flex-1 p-3 rounded-lg text-center transition-all"
              style={{ background: selectedRole === r.key ? r.color + '20' : '#0C1520', border: `2px solid ${selectedRole === r.key ? r.color : '#1E293B'}`, color: selectedRole === r.key ? r.color : '#64748B' }}>
              <div className="font-bold text-sm">{r.label}</div>
              <div className="text-xs mt-1 opacity-70">{r.desc}</div>
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm">{error}</div>}
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#94A3B8' }}>비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-bold text-sm"
            style={{ background: '#00D9CC', color: '#070C12' }}>{loading ? '로그인 중...' : '로그인'}</button>
        </form>
      </div>
    </div>
  );
}
