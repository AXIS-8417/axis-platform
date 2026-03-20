import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

const ROLES = [
  { key:'갑', code:'GAP', icon:'🏢', label:'갑 (발주자)', desc:'현장 개설, 서류 조회, 결제 승인, 설계변경 요청', color:'#F0A500',
    docs:['발주 담당자 위임 확인','현장 관련 공문(선택)'], bizRequired:true },
  { key:'을', code:'EUL', icon:'⚙️', label:'을 (시공사)', desc:'작업지시 생성, 크루 호출, 정산 관리, 게이트 관리', color:'#00D9CC',
    docs:['건설업 등록증/업종 증빙','보험증권(책임/근재)','장비등록증(보유시)'], bizRequired:true },
  { key:'병', code:'BYEONG', icon:'👷', label:'병 (작업팀)', desc:'시공일보 작성, 안전체크, 호출 수락/거부', color:'#22C55E',
    docs:['신분증(본인확인용)','안전교육 확인서','면허사본(장비기사)'], bizRequired:false },
  { key:'소개소', code:'AGENCY', icon:'📋', label:'소개소 (직업소개소)', desc:'인력 배정, 출역 확인, 인력풀 관리', color:'#8B5CF6',
    docs:['직업소개사업 등록증','사업자등록증'], bizRequired:true },
];

const PLANS = [
  { key:'NONE', label:'무료', price:'₩0', desc:'기본 등록, 제한적 조회', features:['기록 입력','기본 조회','호출 수신'], color:'#64748B' },
  { key:'STANDARD', label:'스탠다드', price:'₩49,000/월', desc:'전체 기록, 호출매칭, 정산관리', features:['전체 기록','호출매칭','정산관리','이슈이벤트','기록 12개월 보관'], color:'#00D9CC', recommended:false },
  { key:'AXIS', label:'AXIS', price:'₩99,000/월', desc:'GPS 자동, SEAL 봉인, PG연동, R0~R5', features:['GPS 자동기록','SEAL 자동봉인','PG 연동','감사로그','R0~R5 등급','게이트 관리','증빙패키지','건설기계 검증','기록 60개월 보관'], color:'#F0A500', recommended:true },
];

const STEP_LABELS = ['역할 선택', '사업자 정보', '계정 생성', '구독 플랜', '약관 동의'];

export default function PlatformSignup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<typeof ROLES[number]|null>(null);

  // Step 1: 사업자 정보
  const [companyName, setCompanyName] = useState('');
  const [repName, setRepName] = useState('');
  const [bizNumber, setBizNumber] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: 계정
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');

  // Step 3: 구독
  const [plan, setPlan] = useState('NONE');

  // Step 4: 약관
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canNext = () => {
    if (step === 0) return !!role;
    if (step === 1) return companyName.trim().length > 0 && (!role?.bizRequired || bizNumber.trim().length > 0);
    if (step === 2) return email.includes('@') && password.length >= 6 && password === passwordConfirm && name.trim().length > 0;
    if (step === 3) return true;
    if (step === 4) return agreeTerms && agreePrivacy;
    return false;
  };

  const handleSubmit = async () => {
    if (!role) return;
    setSubmitting(true); setError('');
    try {
      // 1. Register auth user
      const { data } = await api.post('/api/auth/register', { email, password, name, role: role.code, company: companyName, phone });
      setAuth(data.token, data.user);

      // 2. Create party
      try {
        await api.post('/api/platform/parties', { partyRole: role.key, companyName, repName, bizNumber, phone, planType: plan });
      } catch {}

      const paths: Record<string,string> = { 갑:'/platform/gap', 을:'/platform/eul', 병:'/platform/byeong', 소개소:'/platform/eul' };
      navigate(paths[role.key] || '/');
    } catch (err: any) { setError(err.response?.data?.error || '회원가입 실패'); }
    finally { setSubmitting(false); }
  };

  const inputStyle = { background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' };
  const labelStyle: React.CSSProperties = { color:'#64748B', fontSize:12, marginBottom:4, display:'block' };

  return (
    <div className="min-h-screen" style={{ background:'#070C12', color:'#F1F5F9' }}>
      {/* Header */}
      <div style={{ background:'#0C1520', borderBottom:'1px solid #1E293B' }} className="px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{ color:'#00D9CC' }} className="font-mono font-bold text-xl">AXIS</span>
            <span style={{ color:'#64748B' }} className="text-sm">회원가입</span>
          </div>
          <button onClick={() => navigate('/platform/login')} className="text-sm" style={{ color:'#64748B' }}>로그인으로 →</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* 5-Step Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                  style={{ background: i <= step ? (role?.color || '#00D9CC') : '#1E293B', color: i <= step ? '#070C12' : '#64748B', border: `2px solid ${i <= step ? (role?.color || '#00D9CC') : '#334155'}` }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs" style={{ color: i <= step ? '#F1F5F9' : '#64748B' }}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && <div className="h-0.5 flex-1 mt-[-14px]" style={{ background: i < step ? (role?.color || '#00D9CC') : '#1E293B' }} />}
            </div>
          ))}
        </div>

        {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background:'#EF444420', border:'1px solid #EF4444', color:'#EF4444' }}>{error}</div>}

        {/* Step 0: 역할 선택 */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold mb-2">역할을 선택하세요</h2>
            <p className="text-sm mb-6" style={{ color:'#94A3B8' }}>AXIS에서의 역할에 따라 사용 가능한 기능이 달라집니다.</p>
            <div className="space-y-3">
              {ROLES.map(r => {
                const sel = role?.key === r.key;
                return (
                  <button key={r.key} onClick={() => setRole(r)} className="w-full text-left p-5 rounded-lg transition-all"
                    style={{ background: sel ? r.color + '15' : '#0C1520', border: `2px solid ${sel ? r.color : '#1E293B'}` }}>
                    <div className="flex items-start gap-4">
                      <div className="text-2xl flex-shrink-0 mt-1">{r.icon}</div>
                      <div className="flex-1">
                        <div className="font-bold text-base mb-1" style={{ color: sel ? r.color : '#F1F5F9' }}>{r.label}</div>
                        <div className="text-sm mb-2" style={{ color:'#94A3B8' }}>{r.desc}</div>
                        <div className="text-xs" style={{ color:'#64748B' }}>
                          필수서류: {r.docs.join(' · ')}
                        </div>
                        <div className="text-xs mt-1" style={{ color:'#64748B' }}>
                          {r.bizRequired ? '사업자등록증 필수' : '개인 휴대폰 본인인증'}
                        </div>
                      </div>
                      {sel && <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: r.color, color:'#070C12' }}>✓</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: 사업자 정보 */}
        {step === 1 && role && (
          <div>
            <h2 className="text-lg font-bold mb-2">사업자 정보</h2>
            <p className="text-sm mb-6" style={{ color:'#94A3B8' }}>{role.key === '병' ? '개인 정보를 입력해주세요.' : '사업자 정보를 입력해주세요.'}</p>
            <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6 space-y-4">
              <div>
                <label style={labelStyle}>{role.key === '병' ? '이름 / 팀명' : '사업자명 (상호)'} *</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}
                  placeholder={role.key === '병' ? '예: 홍길동 / A시공팀' : '예: NS기업 / OO건설'} />
              </div>
              <div>
                <label style={labelStyle}>대표자명</label>
                <input value={repName} onChange={e => setRepName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
              </div>
              {role.bizRequired && (
                <div>
                  <label style={labelStyle}>사업자등록번호 * <span style={{ color:'#64748B' }}>(###-##-#####)</span></label>
                  <input value={bizNumber} onChange={e => setBizNumber(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}
                    placeholder="123-45-67890" maxLength={12} />
                </div>
              )}
              <div>
                <label style={labelStyle}>연락처</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}
                  placeholder="010-1234-5678" />
              </div>
              <div className="pt-3" style={{ borderTop:'1px solid #1E293B' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: role.color }}>필수 서류 안내 ({role.label})</div>
                {role.docs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1" style={{ color:'#94A3B8' }}>
                    <span>📄</span><span>{doc}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background:'#F0A50020', color:'#F0A500' }}>업로드 (추후)</span>
                  </div>
                ))}
                <div className="text-xs mt-2" style={{ color:'#64748B' }}>* 서류 업로드는 가입 후 마이페이지에서 가능합니다.</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 계정 생성 */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold mb-2">계정 생성</h2>
            <p className="text-sm mb-6" style={{ color:'#94A3B8' }}>로그인에 사용할 계정 정보를 입력해주세요.</p>
            <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6 space-y-4">
              <div>
                <label style={labelStyle}>담당자 이름 *</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>이메일 *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle}
                  placeholder="email@company.com" />
              </div>
              <div>
                <label style={labelStyle}>비밀번호 * <span style={{ color:'#64748B' }}>(6자 이상)</span></label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>비밀번호 확인 *</label>
                <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ ...inputStyle, borderColor: passwordConfirm && password !== passwordConfirm ? '#EF4444' : '#334155' }} />
                {passwordConfirm && password !== passwordConfirm && <div className="text-xs mt-1" style={{ color:'#EF4444' }}>비밀번호가 일치하지 않습니다.</div>}
              </div>
              <div className="p-3 rounded text-xs" style={{ background:'#3B82F615', border:'1px solid #3B82F640', color:'#3B82F6' }}>
                인증 방식: {role?.bizRequired ? '사업자 인증 + 휴대폰 (추후 연동)' : '휴대폰 본인인증 (추후 연동)'}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 구독 플랜 */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold mb-2">구독 플랜 선택</h2>
            <p className="text-sm mb-6" style={{ color:'#94A3B8' }}>구독은 기능 차이가 아니라 기록의 효력 범위입니다. 미구독도 기록 입력은 동일합니다.</p>
            <div className="space-y-3">
              {PLANS.map(p => {
                const sel = plan === p.key;
                return (
                  <button key={p.key} onClick={() => setPlan(p.key)} className="w-full text-left rounded-lg transition-all"
                    style={{ background: sel ? p.color + '12' : '#0C1520', border: `2px solid ${sel ? p.color : '#1E293B'}`, padding:'20px', position:'relative' }}>
                    {p.recommended && <div className="absolute -top-2 right-4 text-xs px-3 py-0.5 rounded-full font-bold" style={{ background: p.color, color:'#070C12' }}>추천</div>}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-base" style={{ color: sel ? p.color : '#F1F5F9' }}>{p.label}</div>
                        <div className="text-sm" style={{ color:'#94A3B8' }}>{p.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg" style={{ color: p.color }}>{p.price}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.features.map(f => (
                        <span key={f} className="text-xs px-2 py-0.5 rounded" style={{ background: p.color + '15', color: p.color, border: `1px solid ${p.color}30` }}>{f}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded text-xs" style={{ background:'#111B2A', border:'1px solid #1E293B', color:'#64748B' }}>
              ※ 구독 여부는 리스크 점수와 연결되지 않습니다. 구독 = 효력 범위, 리스크 = 이행 기록 요약. 미구독이 불리하다는 표시는 어디에도 없습니다.
            </div>
          </div>
        )}

        {/* Step 4: 약관 동의 */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold mb-2">약관 동의</h2>
            <p className="text-sm mb-6" style={{ color:'#94A3B8' }}>서비스 이용에 필요한 약관에 동의해주세요.</p>
            <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg" style={{ background: agreeTerms ? '#00D9CC10' : 'transparent', border: `1px solid ${agreeTerms ? '#00D9CC' : '#1E293B'}` }}>
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-1" style={{ accentColor:'#00D9CC' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: agreeTerms ? '#00D9CC' : '#F1F5F9' }}>[필수] 서비스 이용약관</div>
                  <div className="text-xs mt-1" style={{ color:'#64748B' }}>AXIS 플랫폼 서비스 이용에 관한 기본 약관입니다.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg" style={{ background: agreePrivacy ? '#00D9CC10' : 'transparent', border: `1px solid ${agreePrivacy ? '#00D9CC' : '#1E293B'}` }}>
                <input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} className="mt-1" style={{ accentColor:'#00D9CC' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: agreePrivacy ? '#00D9CC' : '#F1F5F9' }}>[필수] 개인정보 처리방침</div>
                  <div className="text-xs mt-1" style={{ color:'#64748B' }}>개인정보 수집·이용·보관에 관한 동의입니다.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg" style={{ background: agreeMarketing ? '#00D9CC10' : 'transparent', border: `1px solid ${agreeMarketing ? '#00D9CC' : '#1E293B'}` }}>
                <input type="checkbox" checked={agreeMarketing} onChange={e => setAgreeMarketing(e.target.checked)} className="mt-1" style={{ accentColor:'#00D9CC' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color:'#F1F5F9' }}>[선택] 마케팅 정보 수신</div>
                  <div className="text-xs mt-1" style={{ color:'#64748B' }}>신규 기능 안내, 프로모션 등 마케팅 정보를 받습니다.</div>
                </div>
              </label>
              <button onClick={() => { setAgreeTerms(true); setAgreePrivacy(true); setAgreeMarketing(true); }}
                className="w-full text-center text-sm py-2 rounded" style={{ border:'1px solid #334155', color:'#94A3B8' }}>전체 동의</button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-lg text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>← 이전</button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex-1 py-3 rounded-lg text-sm font-bold"
              style={{ background: canNext() ? (role?.color || '#00D9CC') : '#1E293B', color: canNext() ? '#070C12' : '#64748B' }}>
              다음 →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canNext() || submitting} className="flex-1 py-3 rounded-lg text-sm font-bold"
              style={{ background: canNext() ? '#00D9CC' : '#1E293B', color: canNext() ? '#070C12' : '#64748B' }}>
              {submitting ? '가입 중...' : '가입 완료'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
