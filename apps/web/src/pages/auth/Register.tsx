import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'GAP' as 'GAP' | 'EUL',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        email: form.email,
        password: form.password,
        role: form.role,
        companyName: form.companyName,
      });
      navigate('/auth/login');
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
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
          <p className="text-slate-500 mt-2">회원가입</p>
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
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="axis-input w-full"
              placeholder="email@company.com"
              required
            />
          </div>

          <div>
            <label className="axis-label">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="axis-input w-full"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="axis-label">비밀번호 확인</label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => update('passwordConfirm', e.target.value)}
              className="axis-input w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="axis-label">역할</label>
            <select
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className="axis-input w-full"
            >
              <option value="GAP">갑 (발주자)</option>
              <option value="EUL">을 (시공업체)</option>
            </select>
          </div>

          <div>
            <label className="axis-label">회사명</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              className="axis-input w-full"
              placeholder="(주) 회사명"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="axis-btn-primary w-full"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>

          <p className="text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/auth/login" className="text-axis-teal hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
