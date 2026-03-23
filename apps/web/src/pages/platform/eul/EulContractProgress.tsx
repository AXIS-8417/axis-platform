import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../lib/api';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  '정상': { bg: '#22C55E20', color: '#22C55E' },
  '경고': { bg: '#EAB30820', color: '#EAB308' },
  '위험': { bg: '#EF444420', color: '#EF4444' },
  '취소': { bg: '#64748B20', color: '#64748B' },
  '완료': { bg: '#3B82F620', color: '#3B82F6' },
};

const EUL_PROGRESS_OPTIONS = ['자재 발주 완료', '장비 예약 완료', '인력 배정 완료', '현장 사전 답사 완료', '준비 완료', '일정 조율 중'];

interface TimelineEvent { date: string; actor: string; action: string; }

export default function EulContractProgress() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState('정상');
  const [gapCompany, setGapCompany] = useState('OO발주처');
  const [gapContact, setGapContact] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [installDate, setInstallDate] = useState<string | null>(null);
  const [gapNoDateDays, setGapNoDateDays] = useState(0);
  const [progressOption, setProgressOption] = useState('');
  const [progressMemo, setProgressMemo] = useState('');
  const [pendingChange, setPendingChange] = useState<{ type: string; detail: string; deadline: string } | null>(null);
  const [changeResponse, setChangeResponse] = useState('');
  const [changeRejectReason, setChangeRejectReason] = useState('');
  const [changeMemo, setChangeMemo] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { date: '03/18 09:00', actor: '갑', action: '을 선택 확정' },
    { date: '03/18 09:01', actor: '시스템', action: '계약 진행 시작' },
  ]);

  // 평판 현황
  const [rep, setRep] = useState({ response: 20, delivery: 25, reliability: 22, record: 15, total: 82, grade: '양호' });

  useEffect(() => {
    api.get(`/api/platform/timeline/${id}`).then(r => {
      if (r.data?.data?.length) setTimeline(r.data.data.map((e: any) => ({
        date: new Date(e.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        actor: e.actor === 'GAP' ? '갑' : e.actor === 'EUL' ? '을' : '시스템',
        action: e.action,
      })));
    }).catch(() => {});
    api.get('/api/platform/reputation').then(r => {
      if (r.data?.totalScore) setRep({
        response: r.data.responseScore, delivery: r.data.deliveryScore,
        reliability: r.data.reliabilityScore, record: r.data.recordScore,
        total: r.data.totalScore, grade: r.data.grade,
      });
    }).catch(() => {});
  }, [id]);

  const addTimeline = (actor: string, action: string) => {
    const now = new Date();
    const date = `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setTimeline(prev => [{ date, actor, action }, ...prev]);
    api.post('/api/platform/timeline', { contractId: id, actor: actor === '을' ? 'EUL' : actor === '갑' ? 'GAP' : 'SYSTEM', action }).catch(() => {});
  };

  const handleContactView = () => {
    setShowContact(true);
    setGapContact('010-9876-5432');
    addTimeline('을', '연락처 확인');
    api.post('/api/platform/contact-view', { contractId: id, actor: 'EUL' }).catch(() => {});
  };

  const handleProgress = () => {
    if (!progressOption) return;
    const label = progressOption === '일정 조율 중' && progressMemo ? `${progressOption} — ${progressMemo}` : progressOption;
    addTimeline('을', label);
    api.post('/api/platform/progress', { contractId: id, actor: 'EUL', status: label, memo: progressMemo }).catch(() => {});
    setProgressOption(''); setProgressMemo('');
  };

  const handleChangeAccept = () => {
    setPendingChange(null);
    setChangeResponse('수락');
    addTimeline('을', '견적변경 수락 → 재견적 제출');
  };
  const handleChangeReject = () => {
    if (!changeRejectReason) return;
    setPendingChange(null);
    setChangeResponse('거절');
    addTimeline('을', `견적변경 거절 — 사유: ${changeRejectReason}`);
  };
  const handleChangeNegotiate = () => {
    setPendingChange(null);
    setChangeResponse('협의');
    addTimeline('을', `견적변경 협의 요청 — ${changeMemo}`);
  };

  const handleAbandon = () => {
    addTimeline('을', '대기 포기 신청');
    api.post('/api/platform/abandon', { contractId: id, reason: '갑 설치예정일 미입력' }).catch(() => {});
  };

  const handleCompletion = () => {
    addTimeline('을', '설치 완료 보고');
    api.post('/api/platform/completion', { contractId: id, actor: 'EUL' }).catch(() => {});
  };

  const sc = STATUS_COLORS[status] || STATUS_COLORS['정상'];

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">을 진행 관리</h1>
          <div className="text-xs mt-1" style={{ color: '#64748B' }}>계약 {id?.slice(0, 12)}</div>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: sc.bg, color: sc.color }}>{status}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 갑 정보 (제한적 공개) */}
        <div className="col-span-2 p-5 rounded-lg" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
          <div className="font-semibold text-sm mb-3" style={{ color: '#00D9CC' }}>갑(발주처) 정보</div>
          <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: '#94A3B8' }}>
            <div><span style={{ color: '#64748B' }}>회사명:</span> {gapCompany}</div>
            <div><span style={{ color: '#64748B' }}>담당자:</span> 확정 후 공개</div>
            <div><span style={{ color: '#64748B' }}>현장:</span> 경기도 파주시</div>
            <div><span style={{ color: '#64748B' }}>스펙:</span> RPP / 3M / 250M</div>
            <div><span style={{ color: '#64748B' }}>계약:</span> BB(바이백)</div>
            <div><span style={{ color: '#64748B' }}>갑 발주:</span> 12건</div>
          </div>
          <div className="mt-3">
            {!showContact ? (
              <button onClick={handleContactView}
                className="px-4 py-2 rounded text-sm font-semibold" style={{ background: '#00D9CC', color: '#070C12' }}>
                📞 갑에게 연락
              </button>
            ) : (
              <div>
                <div className="font-mono text-lg mb-2" style={{ color: '#00D9CC' }}>{gapContact}</div>
                <div className="text-xs p-2 rounded" style={{ background: '#EF444410', border: '1px solid #EF444440', color: '#F87171' }}>
                  통화 내용은 기록되지 않습니다. 중요 사항은 반드시 플랫폼에 기록해 주세요.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 평판 현황 카드 */}
        <div className="p-5 rounded-lg" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
          <Link to="/platform/eul/reputation" className="font-semibold text-sm mb-3 block hover:underline" style={{ color: '#00D9CC' }}>내 평판 →</Link>
          <div className="text-2xl font-mono font-bold mb-1" style={{ color: rep.total >= 80 ? '#22C55E' : rep.total >= 60 ? '#EAB308' : '#EF4444' }}>
            {rep.total}<span className="text-sm font-normal" style={{ color: '#64748B' }}>/100</span>
          </div>
          <div className="text-xs" style={{ color: '#94A3B8' }}>{rep.grade}</div>
          <div className="mt-2 space-y-1 text-xs" style={{ color: '#64748B' }}>
            <div>응답 {rep.response}/25 · 납기 {rep.delivery}/30</div>
            <div>이행 {rep.reliability}/25 · 기록 {rep.record}/20</div>
          </div>
        </div>
      </div>

      {/* §7.3 설치예정일 대기 */}
      <div className="p-5 rounded-lg mb-4" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
        <div className="font-semibold text-sm mb-2" style={{ color: '#00D9CC' }}>설치예정일</div>
        {installDate ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono" style={{ color: '#22C55E' }}>✅ {installDate}</span>
            <span className="text-xs" style={{ color: '#64748B' }}>갑이 입력 완료</span>
          </div>
        ) : (
          <div>
            <div className="text-xs mb-3" style={{ color: '#94A3B8' }}>
              갑(발주처)이 설치예정일을 입력 중입니다. 확정되면 알림을 드립니다. 이 기간 동안 단가 및 일정은 견적 제출 기준으로 유지됩니다.
            </div>
            {gapNoDateDays >= 20 && (
              <div className="flex gap-3 mt-2">
                <span className="text-xs self-center" style={{ color: '#EF4444' }}>갑 미입력 {gapNoDateDays}일 경과</span>
                <button className="px-3 py-1.5 rounded text-xs" style={{ border: '1px solid #334155', color: '#94A3B8' }}>대기 유지</button>
                <button onClick={handleAbandon} className="px-3 py-1.5 rounded text-xs" style={{ border: '1px solid #EF4444', color: '#EF4444' }}>포기 신청</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* §7.4 진행상황 */}
      <div className="p-5 rounded-lg mb-4" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
        <div className="font-semibold text-sm mb-3" style={{ color: '#00D9CC' }}>진행상황 입력</div>
        <div className="flex gap-2 flex-wrap mb-3">
          {EUL_PROGRESS_OPTIONS.map(opt => (
            <button key={opt} onClick={() => setProgressOption(opt)}
              className="px-3 py-1.5 rounded text-xs transition-all"
              style={{ background: progressOption === opt ? '#00D9CC15' : '#111B2A', border: `1px solid ${progressOption === opt ? '#00D9CC' : '#1E293B'}`, color: progressOption === opt ? '#00D9CC' : '#94A3B8' }}>
              {opt}
            </button>
          ))}
        </div>
        {progressOption === '일정 조율 중' && (
          <input value={progressMemo} onChange={e => setProgressMemo(e.target.value)} placeholder="사유 입력"
            className="w-full px-3 py-2 rounded text-xs mb-2" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }} />
        )}
        <button onClick={handleProgress} disabled={!progressOption}
          className="px-4 py-2 rounded text-sm font-semibold" style={{ background: progressOption ? '#00D9CC' : '#1E293B', color: progressOption ? '#070C12' : '#64748B' }}>
          기록
        </button>
      </div>

      {/* §7.5 견적변경 응답 */}
      {pendingChange && (
        <div className="p-5 rounded-lg mb-4" style={{ background: '#0C1520', border: '2px solid #F0A500' }}>
          <div className="font-semibold text-sm mb-2" style={{ color: '#F0A500' }}>견적변경 요청 수신</div>
          <div className="text-xs mb-2" style={{ color: '#94A3B8' }}>
            {pendingChange.type}: {pendingChange.detail}
          </div>
          <div className="text-xs mb-3" style={{ color: '#EAB308' }}>응답 기한: {pendingChange.deadline} (3일 무응답 → 자동 거절)</div>
          <div className="flex gap-2 mb-2">
            <button onClick={handleChangeAccept} className="px-4 py-2 rounded text-sm font-semibold" style={{ background: '#22C55E', color: '#070C12' }}>수락</button>
            <button onClick={handleChangeReject} className="px-4 py-2 rounded text-sm" style={{ border: '1px solid #EF4444', color: '#EF4444' }}>거절</button>
            <button onClick={handleChangeNegotiate} className="px-4 py-2 rounded text-sm" style={{ border: '1px solid #EAB308', color: '#EAB308' }}>협의 요청</button>
          </div>
          <input value={changeRejectReason} onChange={e => setChangeRejectReason(e.target.value)} placeholder="거절 사유 / 협의 메모"
            className="w-full px-3 py-2 rounded text-xs" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }} />
        </div>
      )}
      {changeResponse && (
        <div className="p-3 rounded mb-4 text-xs" style={{ background: changeResponse === '수락' ? '#22C55E15' : changeResponse === '거절' ? '#EF444415' : '#EAB30815', border: '1px solid #1E293B', color: '#94A3B8' }}>
          견적변경 응답: <span className="font-semibold">{changeResponse}</span>
        </div>
      )}

      {/* §9 타임라인 */}
      <div className="p-5 rounded-lg mb-4" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
        <div className="font-semibold text-sm mb-3" style={{ color: '#00D9CC' }}>타임라인</div>
        {timeline.map((e, i) => (
          <div key={i} className="flex gap-3 py-2" style={{ borderBottom: '1px solid #1E293B' }}>
            <span className="text-xs font-mono flex-shrink-0 w-[90px]" style={{ color: '#64748B' }}>{e.date}</span>
            <span className="text-xs font-semibold flex-shrink-0 w-[32px]" style={{
              color: e.actor === '갑' ? '#F0A500' : e.actor === '을' ? '#00D9CC' : '#64748B'
            }}>{e.actor}</span>
            <span className="text-xs" style={{ color: '#94A3B8' }}>{e.action}</span>
          </div>
        ))}
      </div>

      {/* §8 완료 보고 */}
      <div className="flex gap-3">
        <button onClick={handleCompletion} className="px-4 py-2 rounded text-sm font-semibold" style={{ background: '#00D9CC', color: '#070C12' }}>설치 완료 보고</button>
        <Link to="/platform/eul" className="px-4 py-2 rounded text-sm" style={{ border: '1px solid #334155', color: '#94A3B8' }}>← 대시보드</Link>
      </div>
    </div>
  );
}
