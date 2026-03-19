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
    <div className="min-h-screen bg-axis-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-axis-teal font-mono font-bold text-2xl tracking-wider">
            AXIS
          </Link>
          <p className="text-slate-500 mt-2">시공업체 로그인</p>
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

          <p className="text-center text-sm text-slate-500">
            계정이 없으신가요?{' '}
            <Link to="/auth/register" className="text-axis-teal hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
