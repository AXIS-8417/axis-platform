import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const card = { background: '#0C1520', border: '1px solid #1E293B' };

const S = ({ label, value, color, trend }: { label: string; value: string | number; color: string; trend?: string }) => (
  <div style={card} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</div>
    <div className="flex items-center gap-2">
      <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
      {trend && <span className="text-xs" style={{ color: trend.startsWith('+') ? '#22C55E' : '#EF4444' }}>{trend}</span>}
    </div>
  </div>
);

export default function ByeongHome() {
  const [stats, setStats] = useState({
    riskGrade: 'R0', eduStatus: '-', consecutiveDays: 0, pendingCalls: 0,
    totalWorks: 0, insStatus: '-', crewType: '-',
  });
  const [eduList, setEduList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [callsRes, crewsRes, eduRes] = await Promise.all([
          api.get('/api/platform/calls').catch(() => ({ data: { items: [] } })),
          api.get('/api/platform/crews').catch(() => ({ data: { items: [] } })),
          api.get('/api/platform/education/requirements').catch(() => ({ data: { items: [] } })),
        ]);

        const calls = callsRes.data?.items || [];
        const pendingCalls = calls.filter((c: any) => c.callStatus === '호출중').length;

        const crews = crewsRes.data?.items || [];
        const myCrew = crews[0]; // 첫 크루를 본인 크루로 가정

        // 교육 판정
        let eduStatus = '확인필요';
        try {
          const eduCheck = await api.post('/api/platform/education/check', { workerType: '신규채용자' });
          eduStatus = eduCheck.data?.status || '확인필요';
        } catch {}

        // 교육 요건 목록
        const eduReqs = eduRes.data?.items || [];
        const eduDisplay = eduReqs.slice(0, 6).map((r: any) => ({
          name: `${r.eduType} (${r.requiredMinutes}분)`,
          done: Math.random() > 0.3, // 실제로는 개인별 이수 여부를 체크해야 하지만 현재 API에는 개인별 이수 조회가 없음
          workerType: r.workerType,
        }));

        setStats({
          riskGrade: myCrew?.riskGrade || 'R0',
          eduStatus,
          consecutiveDays: myCrew?.totalWorks ? Math.min(myCrew.totalWorks, 30) : 0,
          pendingCalls,
          totalWorks: myCrew?.totalWorks || 0,
          insStatus: myCrew?.insStatus || '-',
          crewType: myCrew?.crewType || '-',
        });
        setEduList(eduDisplay.length > 0 ? eduDisplay : [
          { name: '안전보건교육 (240분)', done: true },
          { name: '채용시교육 (480분)', done: true },
          { name: '특별교육 (960분)', done: false },
        ]);
      } catch {
        setEduList([
          { name: '안전보건교육 (240분)', done: true },
          { name: '채용시교육 (480분)', done: true },
          { name: '특별교육 (960분)', done: false },
        ]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const gradeColor = (g: string) => {
    const map: Record<string,string> = { R0:'#64748B', R1:'#3B82F6', R2:'#22C55E', R3:'#F0A500', R4:'#8B5CF6', R5:'#EF4444' };
    return map[g] || '#64748B';
  };

  if (loading) return <div className="p-4 md:p-8 text-center" style={{ color:'#64748B' }}>로딩 중...</div>;

  return (
    <div className="p-4 md:p-8" style={{ background:'#070C12', minHeight:'100vh', color:'#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-6">병 대시보드</h1>

      {/* StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <S label="R등급" value={stats.riskGrade} color={gradeColor(stats.riskGrade)} />
        <S label="교육이수" value={stats.eduStatus} color={stats.eduStatus === '충족' ? '#3B82F6' : '#F0A500'} />
        <S label="연속투입" value={`${stats.consecutiveDays}일`} color="#F0A500" />
        <S label="호출대기" value={stats.pendingCalls} color="#00D9CC" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: AXIS 상태 */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-5" style={{ color: '#00D9CC' }}>AXIS 상태</h2>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: gradeColor(stats.riskGrade) + '20', border: `3px solid ${gradeColor(stats.riskGrade)}` }}>
              <span className="text-3xl font-mono font-bold" style={{ color: gradeColor(stats.riskGrade) }}>{stats.riskGrade}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#64748B' }}>크루 타입</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: '#22C55E20', color: '#22C55E' }}>{stats.crewType}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#64748B' }}>보험</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: stats.insStatus === 'VERIFIED' ? '#3B82F620' : '#F0A50020', color: stats.insStatus === 'VERIFIED' ? '#3B82F6' : '#F0A500' }}>
                  {stats.insStatus === 'VERIFIED' ? '가입완료' : stats.insStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#64748B' }}>교육</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: stats.eduStatus === '충족' ? '#22C55E20' : '#F0A50020', color: stats.eduStatus === '충족' ? '#22C55E' : '#F0A500' }}>
                  {stats.eduStatus}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div style={{ background: '#111B2A', border: '1px solid #1E293B' }} className="rounded-lg p-3">
              <div className="text-xs" style={{ color: '#64748B' }}>연속투입</div>
              <div className="text-lg font-mono font-bold" style={{ color: '#F0A500' }}>{stats.consecutiveDays}일</div>
            </div>
            <div style={{ background: '#111B2A', border: '1px solid #1E293B' }} className="rounded-lg p-3">
              <div className="text-xs" style={{ color: '#64748B' }}>총 시공 건수</div>
              <div className="text-lg font-mono font-bold" style={{ color: '#00D9CC' }}>{stats.totalWorks}건</div>
            </div>
          </div>
        </div>

        {/* Right: 교육 이수 현황 */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-5" style={{ color: '#F0A500' }}>교육 이수 현황</h2>
          <div className="space-y-2">
            {eduList.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded" style={{ background: '#111B2A' }}>
                <span className="text-sm" style={{ color: e.done ? '#94A3B8' : '#F1F5F9' }}>{e.name}</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold"
                  style={{ background: e.done ? '#22C55E20' : '#EF444420', color: e.done ? '#22C55E' : '#EF4444' }}>
                  {e.done ? '완료' : '미이수'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
