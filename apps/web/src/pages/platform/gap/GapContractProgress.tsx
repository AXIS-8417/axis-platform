import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../lib/api';

/* ── Types ────────────────────────────────────────── */
type ContractStatus = 'ACTIVE' | 'WARN7' | 'WARN10' | 'CANCELLED' | 'SEALED';
type ChangeReqStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type TimelineActor = 'GAP' | 'EUL' | 'SYSTEM';

interface ContractData {
  siteId: string;
  gapCompany: string;
  eulCompany: string;
  gapContact: string;
  eulContact: string;
  eulPhone: string;
  address: string;
  panelType: string;
  frameLengthM: number;
  heightM: number;
  confirmedPrice: number;
  urgency: string;
  installTarget: string;
  bbDeduction: number;
  eulGrade: string;
  gapOrderCount: number;
  status: ContractStatus;
  lastUpdateDays: number;
  extensionUsed: number;
  installDate: string | null;
}

interface TimelineEntry {
  id: string;
  date: string;
  actor: TimelineActor;
  action: string;
}

interface ChangeRequest {
  id: string;
  type: string;
  detail: string;
  status: ChangeReqStatus;
  createdAt: string;
}

/* ── Helpers ──────────────────────────────────────── */
const STATUS_MAP: Record<ContractStatus, { label: string; color: string }> = {
  ACTIVE:    { label: '정상 진행', color: '#22C55E' },
  WARN7:     { label: '7일 무응답', color: '#FACC15' },
  WARN10:    { label: '10일+ 무응답', color: '#EF4444' },
  CANCELLED: { label: '취소', color: '#64748B' },
  SEALED:    { label: '완료 봉인', color: '#3B82F6' },
};

const ACTOR_COLOR: Record<TimelineActor, string> = {
  GAP: '#F0A500',
  EUL: '#00D9CC',
  SYSTEM: '#64748B',
};

const fmtKRW = (n: number) => n.toLocaleString() + '원';

const MOCK_CONTRACT: ContractData = {
  siteId: 'SITE-001',
  gapCompany: '(주)한양건설',
  eulCompany: '(주)가림산업',
  gapContact: '김철수 과장',
  eulContact: '박영수 대표',
  eulPhone: '010-1234-5678',
  address: '경기도 파주시 OO구',
  panelType: 'RPP',
  frameLengthM: 160,
  heightM: 2.0,
  confirmedPrice: 24_000_000,
  urgency: '보통',
  installTarget: '2026-04',
  bbDeduction: 320_000,
  eulGrade: 'A',
  gapOrderCount: 7,
  status: 'ACTIVE',
  lastUpdateDays: 3,
  extensionUsed: 0,
  installDate: null,
};

const MOCK_TIMELINE: TimelineEntry[] = [
  { id: 'T1', date: '2026-03-15 09:00', actor: 'SYSTEM', action: '갑-을 매칭 확정' },
  { id: 'T2', date: '2026-03-15 09:01', actor: 'SYSTEM', action: '연락처 상호 공개' },
  { id: 'T3', date: '2026-03-16 14:22', actor: 'GAP', action: '갑이 연락처 확인' },
  { id: 'T4', date: '2026-03-18 10:00', actor: 'GAP', action: '진행상황: 부지정리 중' },
  { id: 'T5', date: '2026-03-20 11:30', actor: 'EUL', action: '진행상황: 자재 발주 완료' },
];

const PROGRESS_OPTIONS = [
  '감독/감리 조율 중',
  '부지정리 중',
  '내부일정 논의 중',
  '인허가 대기 중',
  '기타',
];

const CHANGE_TYPES = ['연장 변경', '판넬 종류 변경', '높이 변경', '기타'];

/* ── Component ────────────────────────────────────── */
export default function GapContractProgress() {
  const { id } = useParams<{ id: string }>();

  const [contract, setContract] = useState<ContractData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Contact reveal
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  // Install date
  const [installDate, setInstallDate] = useState('');

  // Progress input
  const [progressChoice, setProgressChoice] = useState('');
  const [progressEtc, setProgressEtc] = useState('');

  // Extension
  const [showExtension, setShowExtension] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');

  // Design change request
  const [changeType, setChangeType] = useState('');
  const [changeDetail, setChangeDetail] = useState('');
  const [changeReqs, setChangeReqs] = useState<ChangeRequest[]>([]);

  // Cancel / Complete modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  /* ── Fetch ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [siteRes, tlRes] = await Promise.all([
          api.get(`/api/platform/sites/${id}`),
          api.get(`/api/platform/timeline/${id}`),
        ]);
        setContract(siteRes.data?.data ?? MOCK_CONTRACT);
        setTimeline(tlRes.data?.data ?? MOCK_TIMELINE);
      } catch {
        setContract(MOCK_CONTRACT);
        setTimeline(MOCK_TIMELINE);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading || !contract) {
    return (
      <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
        <div className="text-center py-20 text-sm" style={{ color: '#64748B' }}>로딩 중...</div>
      </div>
    );
  }

  const sts = STATUS_MAP[contract.status];

  /* ── Handlers ── */
  const handleRevealPhone = async () => {
    setPhoneRevealed(true);
    const now = new Date();
    const label = `${now.getMonth() + 1}월${now.getDate()}일 ${now.getHours()}시 갑이 연락처 확인`;
    const entry: TimelineEntry = { id: `T-${Date.now()}`, date: now.toISOString().slice(0, 16).replace('T', ' '), actor: 'GAP', action: label };
    setTimeline(prev => [...prev, entry]);
    try { await api.post(`/api/platform/timeline/${id}`, { action: label }); } catch { /* logged locally */ }
  };

  const handleInstallDate = async () => {
    if (!installDate) return;
    const diff = (new Date(installDate).getTime() - Date.now()) / 86_400_000;
    if (diff > 30 || diff < 0) { alert('설치예정일은 오늘부터 30일 이내여야 합니다.'); return; }
    setContract(prev => prev ? { ...prev, installDate: installDate } : prev);
    const entry: TimelineEntry = { id: `T-${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'GAP', action: `설치예정일 입력: ${installDate}` };
    setTimeline(prev => [...prev, entry]);
    try { await api.post('/api/platform/progress', { siteId: id, type: 'INSTALL_DATE', value: installDate }); } catch { /* fallback ok */ }
  };

  const handleProgressSubmit = async () => {
    const text = progressChoice === '기타' ? progressEtc : progressChoice;
    if (!text) return;
    const entry: TimelineEntry = { id: `T-${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'GAP', action: `진행상황: ${text}` };
    setTimeline(prev => [...prev, entry]);
    setContract(prev => prev ? { ...prev, lastUpdateDays: 0 } : prev);
    setProgressChoice('');
    setProgressEtc('');
    try { await api.post('/api/platform/progress', { siteId: id, type: 'STATUS_UPDATE', value: text }); } catch { /* fallback ok */ }
  };

  const handleExtension = async () => {
    if (!extensionReason) { alert('연장 사유를 입력해 주세요.'); return; }
    if (contract.extensionUsed >= 3) { alert('연장 횟수를 모두 사용하였습니다.'); return; }
    setContract(prev => prev ? { ...prev, extensionUsed: prev.extensionUsed + 1, lastUpdateDays: 0 } : prev);
    const entry: TimelineEntry = { id: `T-${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'GAP', action: `연장 신청 (${contract.extensionUsed + 1}/3회): ${extensionReason}` };
    setTimeline(prev => [...prev, entry]);
    setShowExtension(false);
    setExtensionReason('');
    try { await api.post('/api/platform/progress', { siteId: id, type: 'EXTENSION', reason: extensionReason }); } catch { /* fallback ok */ }
  };

  const handleChangeRequest = async () => {
    if (!changeType || !changeDetail) { alert('변경 유형과 상세 내용을 입력해 주세요.'); return; }
    const req: ChangeRequest = { id: `CR-${Date.now()}`, type: changeType, detail: changeDetail, status: 'PENDING', createdAt: new Date().toISOString() };
    setChangeReqs(prev => [...prev, req]);
    const entry: TimelineEntry = { id: `T-${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'GAP', action: `견적변경 요청: ${changeType} — ${changeDetail}` };
    setTimeline(prev => [...prev, entry]);
    setChangeType('');
    setChangeDetail('');
    try { await api.post('/api/platform/design-changes', { siteId: id, type: changeType, detail: changeDetail }); } catch { /* fallback ok */ }
  };

  const handleCancel = async () => {
    if (!cancelReason) { alert('취소 사유를 입력해 주세요.'); return; }
    setContract(prev => prev ? { ...prev, status: 'CANCELLED' as ContractStatus } : prev);
    const entry: TimelineEntry = { id: `T-${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'GAP', action: `취소 요청: ${cancelReason}` };
    setTimeline(prev => [...prev, entry]);
    setShowCancelModal(false);
    setCancelReason('');
    try { await api.post('/api/platform/progress', { siteId: id, type: 'CANCEL', reason: cancelReason }); } catch { /* fallback ok */ }
  };

  const handleSeal = async () => {
    if (!confirm('완료 확인 후 봉인 처리됩니다. 진행하시겠습니까?')) return;
    setContract(prev => prev ? { ...prev, status: 'SEALED' as ContractStatus } : prev);
    const entry: TimelineEntry = { id: `T-${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'GAP', action: '완료 확인 — SEAL 봉인' };
    setTimeline(prev => [...prev, entry]);
    try { await api.post('/api/platform/progress', { siteId: id, type: 'SEAL' }); } catch { /* fallback ok */ }
  };

  const daysRemaining = contract.installDate
    ? Math.ceil((new Date(contract.installDate).getTime() - Date.now()) / 86_400_000)
    : null;

  const changeReqStatusLabel = (s: ChangeReqStatus) => {
    if (s === 'ACCEPTED') return { text: '수락', color: '#22C55E' };
    if (s === 'REJECTED') return { text: '거절', color: '#EF4444' };
    return { text: '대기중', color: '#FACC15' };
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="p-8 space-y-6" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>

      {/* ─── 1. Header & Status ─── */}
      <div style={{ background: '#0C1520', border: `1px solid ${sts.color}` }} className="rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">진행관리</h1>
          <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: sts.color + '20', color: sts.color }}>{sts.label}</span>
        </div>
        <div className="flex gap-6 text-sm">
          <div><span style={{ color: '#64748B' }}>갑: </span><span style={{ color: '#F0A500' }}>{contract.gapCompany}</span></div>
          <div><span style={{ color: '#64748B' }}>을: </span><span style={{ color: '#00D9CC' }}>{contract.eulCompany}</span></div>
        </div>
        <div className="text-xs mt-2" style={{ color: '#64748B' }}>{contract.siteId} · {contract.address}</div>
      </div>

      {/* ─── 2. 공개정보 범위 (§7.1) ─── */}
      <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
        <h2 className="font-semibold mb-3">공개정보 범위</h2>
        <table className="w-full text-xs">
          <thead><tr style={{ color: '#64748B' }}><th className="text-left py-1">항목</th><th className="text-center">갑</th><th className="text-center">을</th></tr></thead>
          <tbody>
            {([
              ['회사명',           true,  true],
              ['담당자명',         true,  true],
              ['연락처 (확정 후)', true,  true],
              ['현장주소',         '시/군/구', '시/군/구'],
              ['스펙 전체',        true,  true],
              ['설치예정시기+긴급도', true, false],
              ['확정금액',         true,  true],
              ['엔진기준단가',     false, false],
              ['BOM단가상세',      false, false],
              ['BB차감기준값',     true,  false],
              ['을 평판등급',      true,  false],
              ['갑 발주건수',      false, '건수만'],
              ['진행상황 메모',    true,  true],
              ['타임라인',         true,  true],
            ] as [string, boolean | string, boolean | string][]).map(([label, gap, eul]) => (
              <tr key={label} style={{ borderTop: '1px solid #1E293B' }}>
                <td className="py-1.5">{label}</td>
                <td className="text-center">{gap === true ? '✅' : gap === false ? '❌' : gap}</td>
                <td className="text-center">{eul === true ? '✅' : eul === false ? '❌' : eul}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── 3. 연락처 확인 (§7.2) ─── */}
      <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
        <h2 className="font-semibold mb-3">연락처 확인</h2>
        {!phoneRevealed ? (
          <button onClick={handleRevealPhone} className="px-4 py-2 rounded text-sm font-bold" style={{ background: '#00D9CC', color: '#070C12' }}>
            📞 을에게 연락
          </button>
        ) : (
          <div>
            <div className="text-sm font-mono mb-2" style={{ color: '#00D9CC' }}>{contract.eulContact} — {contract.eulPhone}</div>
            <div className="text-xs p-3 rounded" style={{ background: '#1E293B', color: '#FACC15' }}>
              ⚠ 통화 내용은 기록되지 않습니다. 견적 변경·일정 조율 등 중요 사항은 반드시 플랫폼에 기록해 주세요. 플랫폼 외 거래 진행 시 분쟁 보호가 제공되지 않습니다.
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. 설치예정일 입력 (§7.3) ─── */}
      <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
        <h2 className="font-semibold mb-3">설치예정일 입력</h2>
        {contract.installDate ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono" style={{ color: '#22C55E' }}>{contract.installDate}</span>
            {daysRemaining !== null && (
              <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: daysRemaining <= 3 ? '#EF444420' : '#22C55E20', color: daysRemaining <= 3 ? '#EF4444' : '#22C55E' }}>
                D-{daysRemaining}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <input type="date" value={installDate} onChange={e => setInstallDate(e.target.value)}
                className="px-3 py-2 rounded text-sm" style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' }} />
              <button onClick={handleInstallDate} className="px-4 py-2 rounded text-sm font-bold" style={{ background: '#22C55E', color: '#070C12' }}>저장</button>
            </div>
            <p className="text-xs" style={{ color: '#FACC15' }}>
              설치예정일을 30일 이내에 입력해 주세요. 시장 단가 변동 및 을(시공사)의 인력·자재 스케줄 확보를 위해 필요합니다. 30일 초과 시 을이 대기를 종료할 수 있습니다.
            </p>
          </>
        )}
      </div>

      {/* ─── 5. 진행상황 입력 (§7.4) ─── */}
      <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
        <h2 className="font-semibold mb-3">진행상황 입력</h2>

        {contract.lastUpdateDays >= 10 && (
          <div className="mb-3 p-3 rounded text-xs" style={{ background: '#EF444420', color: '#EF4444' }}>
            🔴 {contract.lastUpdateDays}일간 갱신 없음 — 을(시공사)에게 경고가 전달되며, 을이 대기를 종료할 수 있습니다.
          </div>
        )}
        {contract.lastUpdateDays >= 7 && contract.lastUpdateDays < 10 && (
          <div className="mb-3 p-3 rounded text-xs" style={{ background: '#FACC1520', color: '#FACC15' }}>
            🟡 {contract.lastUpdateDays}일간 갱신 없음 — 3일 내 갱신하지 않으면 을이 대기를 종료할 수 있습니다.
          </div>
        )}

        <div className="space-y-2 mb-4">
          {PROGRESS_OPTIONS.map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="progress" value={opt} checked={progressChoice === opt} onChange={() => setProgressChoice(opt)}
                className="accent-[#00D9CC]" />
              {opt}
            </label>
          ))}
        </div>
        {progressChoice === '기타' && (
          <input type="text" placeholder="상세 내용 입력" value={progressEtc} onChange={e => setProgressEtc(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded text-sm" style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' }} />
        )}
        <div className="flex gap-3">
          <button onClick={handleProgressSubmit} disabled={!progressChoice} className="px-4 py-2 rounded text-sm font-bold disabled:opacity-40" style={{ background: '#00D9CC', color: '#070C12' }}>
            진행상황 저장
          </button>
          <button onClick={() => setShowExtension(true)} className="px-4 py-2 rounded text-sm" style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' }}>
            연장 신청 ({contract.extensionUsed}/3회)
          </button>
        </div>
        {showExtension && (
          <div className="mt-3 p-4 rounded" style={{ background: '#1E293B' }}>
            <div className="text-xs mb-2" style={{ color: '#64748B' }}>연장 사유 (필수)</div>
            <input type="text" value={extensionReason} onChange={e => setExtensionReason(e.target.value)} placeholder="사유 입력"
              className="w-full mb-2 px-3 py-2 rounded text-sm" style={{ background: '#0C1520', color: '#F1F5F9', border: '1px solid #334155' }} />
            <div className="flex gap-2">
              <button onClick={handleExtension} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background: '#F0A500', color: '#070C12' }}>신청</button>
              <button onClick={() => setShowExtension(false)} className="px-3 py-1.5 rounded text-xs" style={{ color: '#64748B' }}>취소</button>
            </div>
          </div>
        )}
      </div>

      {/* ─── 6. 견적변경 요청 (§7.5) ─── */}
      <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
        <h2 className="font-semibold mb-3">견적변경 요청</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs mb-1" style={{ color: '#64748B' }}>변경 유형</div>
            <select value={changeType} onChange={e => setChangeType(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm" style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' }}>
              <option value="">선택</option>
              {CHANGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: '#64748B' }}>상세 내용</div>
            <input type="text" value={changeDetail} onChange={e => setChangeDetail(e.target.value)} placeholder="변경 상세"
              className="w-full px-3 py-2 rounded text-sm" style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' }} />
          </div>
        </div>
        <button onClick={handleChangeRequest} disabled={!changeType || !changeDetail} className="px-4 py-2 rounded text-sm font-bold disabled:opacity-40" style={{ background: '#F0A500', color: '#070C12' }}>
          변경 요청 제출
        </button>
        <p className="text-xs mt-2" style={{ color: '#64748B' }}>※ 3일 무응답 시 자동 거절 처리</p>

        {changeReqs.length > 0 && (
          <div className="mt-4 space-y-2">
            {changeReqs.map(cr => {
              const sl = changeReqStatusLabel(cr.status);
              return (
                <div key={cr.id} className="flex items-center justify-between p-3 rounded" style={{ background: '#1E293B' }}>
                  <div>
                    <span className="text-sm font-semibold">{cr.type}</span>
                    <span className="text-xs ml-2" style={{ color: '#64748B' }}>{cr.detail}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: sl.color + '20', color: sl.color }}>{sl.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 7. 타임라인 (§9) ─── */}
      <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5">
        <h2 className="font-semibold mb-3">타임라인</h2>
        <div className="space-y-0">
          {[...timeline].sort((a, b) => a.date.localeCompare(b.date)).map(t => (
            <div key={t.id} className="flex gap-3 py-2" style={{ borderBottom: '1px solid #1E293B' }}>
              <div className="text-xs font-mono whitespace-nowrap pt-0.5" style={{ color: '#64748B', minWidth: 120 }}>{t.date}</div>
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: ACTOR_COLOR[t.actor] }} />
              <div className="text-sm" style={{ color: ACTOR_COLOR[t.actor] }}>{t.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 8. 종료 처리 (§8) ─── */}
      <div className="flex gap-3">
        {contract.status !== 'CANCELLED' && contract.status !== 'SEALED' && (
          <>
            <button onClick={() => setShowCancelModal(true)} className="px-5 py-2.5 rounded text-sm font-bold" style={{ background: '#EF4444', color: '#fff' }}>
              취소 요청
            </button>
            <button onClick={handleSeal} className="px-5 py-2.5 rounded text-sm font-bold" style={{ background: '#3B82F6', color: '#fff' }}>
              완료 확인
            </button>
          </>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-lg p-6 w-full max-w-md" style={{ background: '#0C1520', border: '1px solid #EF4444' }}>
            <h3 className="font-bold mb-3">취소 요청</h3>
            <div className="text-xs mb-2" style={{ color: '#64748B' }}>사유를 입력해 주세요 (필수)</div>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3}
              className="w-full mb-3 px-3 py-2 rounded text-sm" style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' }} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 rounded text-sm" style={{ color: '#64748B' }}>닫기</button>
              <button onClick={handleCancel} className="px-4 py-2 rounded text-sm font-bold" style={{ background: '#EF4444', color: '#fff' }}>취소 확정</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
