import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setAuth(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#070C12' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-mono font-bold text-2xl tracking-wider" style={{ color: '#00D9CC' }}>
            AXIS
          </Link>
          <p className="mt-2" style={{ color: '#64748B' }}>견적엔진 로그인</p>
        </div>

        <form onSubmit={handleSubmit} className="axis-card space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="axis-label">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="axis-input w-full"
              placeholder="email@company.com"
              required
            />
          </div>

          <div>
            <label className="axis-label">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="axis-input w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="axis-btn-primary w-full"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p className="text-center text-sm" style={{ color: '#64748B' }}>
            계정이 없으신가요?{' '}
            <Link to="/platform/signup" style={{ color: '#00D9CC' }} className="hover:underline font-semibold">
              회원가입
            </Link>
          </p>
          <p className="text-center text-xs mt-2" style={{ color: '#334155' }}>
            <Link to="/platform/login" style={{ color: '#64748B' }} className="hover:underline">플랫폼 로그인 →</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
