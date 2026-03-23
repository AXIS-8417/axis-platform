import { useState, useEffect } from 'react';
import api from '../../lib/api';

const ROLE_COLORS: Record<string,string> = { 갑:'#F0A500', 을:'#00D9CC', 병:'#22C55E', 소개소:'#8B5CF6' };
const TABS = ['주체목록', '사용자목록', '크루목록', '구독플랜'] as const;

const MOCK_PARTIES = [
  { partyId:'PARTY-001', partyRole:'갑', companyName:'OO건설(주)', repName:'김대표', bizNumber:'123-45-67890', planType:'AXIS', status:'활성', phone:'02-1234-5678' },
  { partyId:'PARTY-002', partyRole:'을', companyName:'NS기업', repName:'박대표', bizNumber:'234-56-78901', planType:'STANDARD', status:'활성', phone:'031-987-6543' },
  { partyId:'PARTY-003', partyRole:'병', companyName:'홍기사팀', repName:'홍길동', bizNumber:'', planType:'NONE', status:'활성', phone:'010-1111-2222' },
  { partyId:'PARTY-004', partyRole:'을', companyName:'대한시공', repName:'이대표', bizNumber:'345-67-89012', planType:'AXIS', status:'활성', phone:'02-5555-6666' },
  { partyId:'PARTY-005', partyRole:'소개소', companyName:'파주인력소개소', repName:'최소장', bizNumber:'456-78-90123', planType:'NONE', status:'활성', phone:'031-444-5555' },
  { partyId:'PARTY-006', partyRole:'병', companyName:'최기능공팀', repName:'최기능', bizNumber:'', planType:'STANDARD', status:'활성', phone:'010-3333-4444' },
];

const MOCK_USERS = [
  { userId:'USER-001', partyId:'PARTY-001', name:'김과장', role:'관리감독자', phone:'010-1000-1001', workerType:'상용직', isActive:true, lastLogin:'2026-03-20 09:15' },
  { userId:'USER-002', partyId:'PARTY-002', name:'박팀장', role:'팀장', phone:'010-2000-2001', workerType:'상용직', isActive:true, lastLogin:'2026-03-20 08:30' },
  { userId:'USER-003', partyId:'PARTY-003', name:'홍기사', role:'기사', phone:'010-1111-2222', workerType:'프리랜서', isActive:true, riskGrade:'R2', safetyEdu:'충족', consecutiveDays:15, lastLogin:'2026-03-19 17:00' },
  { userId:'USER-004', partyId:'PARTY-002', name:'이관리', role:'관리감독자', phone:'010-2000-2002', workerType:'상용직', isActive:true, lastLogin:'2026-03-20 10:00' },
  { userId:'USER-005', partyId:'PARTY-004', name:'정반장', role:'대표', phone:'010-5000-5001', workerType:'상용직', isActive:true, lastLogin:'2026-03-18 14:22' },
  { userId:'USER-006', partyId:'PARTY-006', name:'최기능공', role:'기사', phone:'010-3333-4444', workerType:'일용직', isActive:true, riskGrade:'R3', safetyEdu:'충족', consecutiveDays:42, lastLogin:'2026-03-20 07:45' },
  { userId:'USER-007', partyId:'PARTY-005', name:'최소장', role:'대표', phone:'031-444-5555', workerType:'상용직', isActive:true, lastLogin:'2026-03-19 11:00' },
];

const MOCK_CREWS = [
  { crewId:'CREW-001', crewName:'A시공팀', partyId:'PARTY-002', leaderName:'박팀장', riskGrade:'R2', crewType:'AXIS', totalWorks:87, insStatus:'VERIFIED', insExpiry:'2026-12-31', assignMethod:'안심배정', memberCount:5, isActive:true },
  { crewId:'CREW-002', crewName:'B시공팀', partyId:'PARTY-004', leaderName:'정반장', riskGrade:'R1', crewType:'STANDARD', totalWorks:34, insStatus:'VERIFIED', insExpiry:'2026-09-30', assignMethod:'일반배정', memberCount:3, isActive:true },
  { crewId:'CREW-003', crewName:'C해체팀', partyId:'PARTY-002', leaderName:'이관리', riskGrade:'R3', crewType:'AXIS', totalWorks:156, insStatus:'EXPIRED', insExpiry:'2026-02-28', assignMethod:'안심배정', memberCount:7, isActive:true },
  { crewId:'CREW-004', crewName:'파주인력1팀', partyId:'PARTY-005', leaderName:'최소장', riskGrade:'R0', crewType:'STANDARD', totalWorks:12, insStatus:'NONE', insExpiry:null, assignMethod:'일반배정', memberCount:2, isActive:true },
];

const GRADE_COLORS: Record<string,string> = { R0:'#64748B', R1:'#3B82F6', R2:'#22C55E', R3:'#F0A500', R4:'#8B5CF6', R5:'#EF4444' };
const INS_COLORS: Record<string,string> = { VERIFIED:'#22C55E', EXPIRED:'#EF4444', NONE:'#64748B' };
const INS_LABELS: Record<string,string> = { VERIFIED:'유효', EXPIRED:'만료', NONE:'미가입' };

export default function MemberManage() {
  const [tab, setTab] = useState(0);
  const [parties, setParties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState('전체');

  useEffect(() => {
    api.get('/api/platform/parties').then(r => setParties(r.data?.data || [])).catch(() => setParties(MOCK_PARTIES));
    api.get('/api/platform/users').then(r => setUsers(r.data?.data || [])).catch(() => setUsers(MOCK_USERS));
    api.get('/api/platform/crews').then(r => setCrews(r.data?.data || [])).catch(() => setCrews(MOCK_CREWS));
  }, []);

  const filteredParties = roleFilter === '전체' ? parties : parties.filter(p => p.partyRole === roleFilter);

  return (
    <div className="p-4 md:p-8" style={{ background:'#070C12', minHeight:'100vh', color:'#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-6">회원관리</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: tab === i ? '#00D9CC20' : '#0C1520', color: tab === i ? '#00D9CC' : '#64748B', border: `1px solid ${tab === i ? '#00D9CC' : '#1E293B'}` }}>
            {t}
          </button>
        ))}
      </div>

      {/* 주체목록 */}
      {tab === 0 && (
        <div>
          <div className="flex gap-2 mb-4">
            {['전체', '갑', '을', '병', '소개소'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} className="px-3 py-1.5 rounded text-xs font-bold"
                style={{ background: roleFilter === r ? (ROLE_COLORS[r] || '#00D9CC') + '20' : '#0C1520', color: roleFilter === r ? (ROLE_COLORS[r] || '#00D9CC') : '#64748B', border: `1px solid ${roleFilter === r ? (ROLE_COLORS[r] || '#00D9CC') : '#1E293B'}` }}>
                {r}
              </button>
            ))}
            <span className="ml-auto text-xs self-center" style={{ color:'#64748B' }}>{filteredParties.length}개 주체</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredParties.map(p => {
              const color = ROLE_COLORS[p.partyRole] || '#64748B';
              const partyUsers = users.filter(u => u.partyId === p.partyId);
              return (
                <div key={p.partyId} onClick={() => setSelectedParty(selectedParty?.partyId === p.partyId ? null : p)}
                  className="rounded-lg p-5 cursor-pointer transition-all"
                  style={{ background:'#0C1520', border: `1.5px solid ${selectedParty?.partyId === p.partyId ? color : '#1E293B'}` }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: color + '20', color }}>{p.partyRole}</span>
                        <span className="font-bold">{p.companyName}</span>
                      </div>
                      <div className="text-xs" style={{ color:'#94A3B8' }}>{p.partyId} · {p.repName || '-'}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: p.planType === 'AXIS' ? '#F0A50020' : p.planType === 'STANDARD' ? '#00D9CC20' : '#1E293B', color: p.planType === 'AXIS' ? '#F0A500' : p.planType === 'STANDARD' ? '#00D9CC' : '#64748B' }}>{p.planType}</span>
                      <span className="text-xs" style={{ color:'#64748B' }}>{partyUsers.length}명</span>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color:'#64748B' }}>
                    {p.bizNumber ? `사업자: ${p.bizNumber}` : '개인'} · {p.phone || '-'}
                  </div>

                  {/* 소속 사용자 모달 */}
                  {selectedParty?.partyId === p.partyId && partyUsers.length > 0 && (
                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${color}40` }}>
                      <div className="text-xs font-semibold" style={{ color }}>소속 사용자 ({partyUsers.length}명)</div>
                      {partyUsers.map(u => (
                        <div key={u.userId} className="flex justify-between items-center text-xs p-2 rounded" style={{ background:'#111B2A' }}>
                          <div>
                            <span className="font-semibold">{u.name}</span>
                            <span className="ml-2" style={{ color:'#64748B' }}>{u.role || '-'} · {u.phone || '-'}</span>
                          </div>
                          <div className="flex gap-1">
                            {u.riskGrade && <span className="px-1.5 py-0.5 rounded" style={{ background: GRADE_COLORS[u.riskGrade] + '20', color: GRADE_COLORS[u.riskGrade] }}>{u.riskGrade}</span>}
                            <span style={{ color: u.isActive ? '#22C55E' : '#EF4444' }}>{u.isActive ? '활성' : '비활성'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 사용자목록 */}
      {tab === 1 && (
        <div>
          <div className="text-xs mb-4" style={{ color:'#64748B' }}>전체 {users.length}명 · 역할/소속/최종접속 표시</div>
          <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background:'#111B2A', borderBottom:'1px solid #334155' }}>
                  {['ID','이름','역할','소속','유형','R등급','교육','연속투입','최종접속','상태'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs" style={{ color:'#64748B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const party = parties.find(p => p.partyId === u.partyId);
                  const roleColor = party ? ROLE_COLORS[party.partyRole] || '#64748B' : '#64748B';
                  return (
                    <tr key={u.userId} style={{ borderBottom:'1px solid #1E293B' }}>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color:'#64748B' }}>{u.userId}</td>
                      <td className="px-3 py-2.5 font-semibold">{u.name}</td>
                      <td className="px-3 py-2.5"><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: roleColor+'20', color: roleColor }}>{u.role || '-'}</span></td>
                      <td className="px-3 py-2.5 text-xs" style={{ color:'#94A3B8' }}>{party?.companyName || u.partyId}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color:'#94A3B8' }}>{u.workerType || '-'}</td>
                      <td className="px-3 py-2.5">{u.riskGrade ? <span className="text-xs font-mono font-bold" style={{ color: GRADE_COLORS[u.riskGrade] }}>{u.riskGrade}</span> : <span className="text-xs" style={{ color:'#334155' }}>-</span>}</td>
                      <td className="px-3 py-2.5">{u.safetyEdu ? <span className="text-xs" style={{ color: u.safetyEdu === '충족' ? '#22C55E' : '#EF4444' }}>{u.safetyEdu}</span> : <span className="text-xs" style={{ color:'#334155' }}>-</span>}</td>
                      <td className="px-3 py-2.5 text-xs font-mono">{u.consecutiveDays ? u.consecutiveDays + '일' : '-'}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color:'#64748B' }}>{u.lastLogin || '-'}</td>
                      <td className="px-3 py-2.5"><span className="text-xs" style={{ color: u.isActive ? '#22C55E' : '#EF4444' }}>{u.isActive ? '●' : '○'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 크루목록 */}
      {tab === 2 && (
        <div>
          <div className="text-xs mb-4" style={{ color:'#64748B' }}>전체 {crews.length}팀 · R0~R5 등급 + AXIS/보험 상태</div>
          <div className="space-y-3">
            {crews.map(c => {
              const gc = GRADE_COLORS[c.riskGrade] || '#64748B';
              const ic = INS_COLORS[c.insStatus] || '#64748B';
              return (
                <div key={c.crewId} style={{ background:'#0C1520', border:`1px solid ${gc}40` }} className="rounded-lg p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-lg font-mono font-bold" style={{ color: gc }}>{c.riskGrade}</span>
                        <span className="font-bold">{c.crewName}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: c.crewType === 'AXIS' ? '#F0A50020' : '#00D9CC20', color: c.crewType === 'AXIS' ? '#F0A500' : '#00D9CC' }}>{c.crewType}</span>
                      </div>
                      <div className="text-xs" style={{ color:'#94A3B8' }}>{c.crewId} · 팀장: {c.leaderName} · {c.memberCount}명</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: ic + '20', color: ic }}>보험: {INS_LABELS[c.insStatus]}</span>
                      <span className="text-xs" style={{ color:'#64748B' }}>{c.insExpiry ? `만료: ${c.insExpiry}` : ''}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2 rounded text-center" style={{ background:'#111B2A' }}>
                      <div className="text-xs" style={{ color:'#64748B' }}>총 작업</div>
                      <div className="font-mono font-bold" style={{ color: gc }}>{c.totalWorks}건</div>
                    </div>
                    <div className="p-2 rounded text-center" style={{ background:'#111B2A' }}>
                      <div className="text-xs" style={{ color:'#64748B' }}>배정방식</div>
                      <div className="text-xs font-semibold" style={{ color: c.assignMethod === '안심배정' ? '#F0A500' : '#94A3B8' }}>{c.assignMethod}</div>
                    </div>
                    <div className="p-2 rounded text-center" style={{ background:'#111B2A' }}>
                      <div className="text-xs" style={{ color:'#64748B' }}>인원</div>
                      <div className="font-mono font-bold">{c.memberCount}명</div>
                    </div>
                    <div className="p-2 rounded text-center" style={{ background:'#111B2A' }}>
                      <div className="text-xs" style={{ color:'#64748B' }}>상태</div>
                      <div className="text-xs font-semibold" style={{ color: c.isActive ? '#22C55E' : '#EF4444' }}>{c.isActive ? '활성' : '비활성'}</div>
                    </div>
                  </div>
                  {c.insStatus === 'EXPIRED' && (
                    <div className="mt-3 p-2 rounded text-xs" style={{ background:'#EF444415', border:'1px solid #EF444440', color:'#EF4444' }}>
                      ⚠ 보험 만료 — 갱신이 필요합니다. 만료일: {c.insExpiry}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 구독플랜 */}
      {tab === 3 && (
        <div>
          <div className="text-xs mb-6" style={{ color:'#64748B' }}>구독은 기능 차이가 아니라 기록의 효력 범위입니다.</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { plan:'NONE', label:'무료', price:'₩0', color:'#64748B', items:['기록 입력 ✓','기본 조회 ✓','호출 수신 ✓','봉인 ✗','자동정산 ✗','증빙패키지 ✗','감사로그 ✗'] },
              { plan:'STANDARD', label:'스탠다드', price:'₩49,000/월', color:'#00D9CC', items:['기록 입력 ✓','전체 조회 ✓','호출매칭 ✓','정산관리 ✓','이슈이벤트 ✓','봉인 일부 ✓','자동정산 ✗','기록 12M 보관'] },
              { plan:'AXIS', label:'AXIS', price:'₩99,000/월', color:'#F0A500', items:['전체 기록 ✓','GPS 자동 ✓','SEAL 자동봉인 ✓','PG 연동 ✓','감사로그 ✓','R0~R5 등급 ✓','게이트 관리 ✓','증빙패키지 ✓','건설기계 검증 ✓','기록 60M 보관'] },
            ].map(p => {
              const count = parties.filter(pp => pp.planType === p.plan).length;
              return (
                <div key={p.plan} className="rounded-lg p-6" style={{ background:'#0C1520', border:`2px solid ${p.color}` }}>
                  <div className="text-center mb-4">
                    <div className="font-bold text-lg" style={{ color: p.color }}>{p.label}</div>
                    <div className="font-mono text-xl font-bold mt-1">{p.price}</div>
                    <div className="text-xs mt-1" style={{ color:'#64748B' }}>{count}개 주체 이용 중</div>
                  </div>
                  <div className="space-y-1.5">
                    {p.items.map(item => {
                      const ok = item.includes('✓');
                      return (
                        <div key={item} className="text-xs flex items-center gap-2" style={{ color: ok ? '#94A3B8' : '#334155' }}>
                          <span style={{ color: ok ? '#22C55E' : '#EF4444' }}>{ok ? '✓' : '✗'}</span>
                          {item.replace(' ✓', '').replace(' ✗', '')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 rounded-lg text-xs" style={{ background:'#111B2A', border:'1px solid #1E293B', color:'#64748B', lineHeight:1.8 }}>
            ※ 구독 여부는 리스크 점수와 연결되지 않습니다.<br/>
            ※ 미구독도 기록 입력은 동일합니다. 봉인/자동정산/증빙 생성만 제한됩니다.<br/>
            ※ "미구독은 불리합니다" 같은 표시는 어디에도 없습니다.<br/>
            ※ 구독 안내는 봉인 시도, 정산 Gate 진입, 증빙 요청 시에만 노출됩니다.
          </div>
        </div>
      )}
    </div>
  );
}
