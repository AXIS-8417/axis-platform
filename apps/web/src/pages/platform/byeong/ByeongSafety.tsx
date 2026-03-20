import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const MOCK_CHECKS = [
  { checkId: 'SC-MOCK01', checkType: '일일', result: '통과', checkerName: '홍길동', checkedAt: '2026-03-19', seasonType: '일반' },
];

const CHECK_ITEMS = ['바닥상태', '조명', '안전장구', '장비상태', '방호울타리', '날씨', '소화기', '비상구', '신호체계', '안전표지', '가스감지', '전기설비'];
const CYCLES = ['일일', '주간', '월간', '분기', '반기', '정밀'];
const SEASONS = ['일반', '해빙기', '장마', '태풍', '동절기'];

export default function ByeongSafety() {
  const [cycle, setCycle] = useState('일일');
  const [season, setSeason] = useState('일반');
  const [actionTab, setActionTab] = useState<'check' | 'issue' | 'action' | 'confirm'>('check');
  const [checks, setChecks] = useState<Record<string, boolean>>(Object.fromEntries(CHECK_ITEMS.map(i => [i, false])));
  const [existingChecks, setExistingChecks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [note, setNote] = useState('');

  const passCount = Object.values(checks).filter(Boolean).length;

  const loadChecks = () => {
    api.get('/api/platform/safety-checks').then(r => setExistingChecks(r.data?.items || r.data?.data || []))
      .catch(() => setExistingChecks(MOCK_CHECKS));
  };

  useEffect(() => {
    loadChecks();
  }, []);

  const handleSubmitCheck = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/platform/safety-checks', {
        checkType: '방호장치',
        checkCycle: cycle,
        seasonType: season,
        floorStatus: checks['바닥상태'] ? '적합' : '부적합',
        lightingStatus: checks['조명'] ? '적합' : '부적합',
        safetyGear: checks['안전장구'] ? '적합' : '부적합',
        equipStatus: checks['장비상태'] ? '적합' : '부적합',
        fenceStatus: checks['방호울타리'] ? '적합' : '부적합',
        weather: checks['날씨'] ? '적합' : '부적합',
        result: passCount === 12 ? '통과' : '미통과',
        note,
        issueDesc: issueDesc || undefined,
        issueCount: issueDesc ? 1 : 0,
        actionDesc: actionDesc || undefined,
        actionStatus: actionDesc ? '조치완료' : undefined,
      });
      alert('안전점검이 제출되었습니다.');
      setChecks(Object.fromEntries(CHECK_ITEMS.map(i => [i, false])));
      setNote('');
      setIssueDesc('');
      setActionDesc('');
      loadChecks();
    } catch (e: any) {
      alert(e?.response?.data?.error || '제출 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-4">안전체크</h1>

      {/* Workflow tabs */}
      <div className="flex gap-2 mb-6">
        {([['check', '1. 점검'], ['issue', '2. 지적'], ['action', '3. 조치'], ['confirm', '4. 확인']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setActionTab(k as any)} className="px-4 py-2 rounded-lg text-sm"
            style={{ background: actionTab === k ? '#22C55E20' : '#0C1520', color: actionTab === k ? '#22C55E' : '#64748B', border: `1px solid ${actionTab === k ? '#22C55E' : '#1E293B'}` }}>{l}</button>
        ))}
      </div>

      {actionTab === 'check' && (
        <>
          <div className="flex gap-4 mb-6">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#64748B' }}>점검주기</label>
              <select value={cycle} onChange={e => setCycle(e.target.value)} className="px-3 py-2 rounded text-sm" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }}>
                {CYCLES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#64748B' }}>계절점검</label>
              <select value={season} onChange={e => setSeason(e.target.value)} className="px-3 py-2 rounded text-sm" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }}>
                {SEASONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#22C55E' }}>12항목 방호장치 점검</h2>
              <span className="text-xs font-mono" style={{ color: passCount === 12 ? '#22C55E' : '#F0A500' }}>{passCount}/12</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CHECK_ITEMS.map(item => (
                <label key={item} className="flex items-center gap-2 text-sm cursor-pointer py-1" style={{ color: checks[item] ? '#22C55E' : '#94A3B8' }}>
                  <input type="checkbox" checked={checks[item]} onChange={() => setChecks({ ...checks, [item]: !checks[item] })} style={{ accentColor: '#22C55E' }} />
                  {item}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-xs block mb-1" style={{ color: '#64748B' }}>비고</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full px-3 py-2 rounded text-sm" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }} />
            </div>
            <button onClick={handleSubmitCheck} disabled={submitting} className="mt-4 px-6 py-2 rounded font-bold text-sm"
              style={{ background: '#22C55E', color: '#070C12', opacity: submitting ? 0.5 : 1 }}>
              {submitting ? '제출중...' : '점검 제출'}
            </button>
          </div>

          {/* Existing checks */}
          {existingChecks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#64748B' }}>제출된 점검 ({existingChecks.length}건)</h3>
              <div className="space-y-2">
                {existingChecks.map((c: any) => (
                  <div key={c.checkId} className="p-3 rounded flex justify-between items-center" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
                    <div className="text-sm">
                      {c.checkId} | {c.checkType || c.checkCycle || '-'} | {c.checkerName || '-'}
                      <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{c.checkedAt ? new Date(c.checkedAt).toLocaleDateString() : '-'} | {c.seasonType || '-'}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded" style={{ background: c.result === '통과' ? '#22C55E20' : '#EF444420', color: c.result === '통과' ? '#22C55E' : '#EF4444' }}>{c.result || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {actionTab === 'issue' && (
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>지적사항 입력</h2>
          <textarea placeholder="지적사항을 입력하세요..." rows={4} value={issueDesc} onChange={e => setIssueDesc(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm mb-4" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }} />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="text-xs mb-2" style={{ color: '#64748B' }}>조치 전 사진</div>
              <div className="h-32 rounded flex items-center justify-center" style={{ background: '#111B2A', border: '1px dashed #334155', color: '#64748B' }}>[사진 업로드]</div></div>
            <div><div className="text-xs mb-2" style={{ color: '#64748B' }}>현장 전경</div>
              <div className="h-32 rounded flex items-center justify-center" style={{ background: '#111B2A', border: '1px dashed #334155', color: '#64748B' }}>[사진 업로드]</div></div>
          </div>
          <button className="px-6 py-2 rounded font-bold text-sm" style={{ background: '#F0A500', color: '#070C12' }}>지적사항 등록</button>
        </div>
      )}

      {actionTab === 'action' && (
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#3B82F6' }}>조치내용 입력</h2>
          {issueDesc && <div className="mb-4 p-3 rounded text-sm" style={{ background: '#F0A50015', color: '#F0A500' }}>지적사항: {issueDesc}</div>}
          <textarea placeholder="조치내용을 입력하세요..." rows={4} value={actionDesc} onChange={e => setActionDesc(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm mb-4" style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }} />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="text-xs mb-2" style={{ color: '#64748B' }}>조치 전 사진</div>
              <div className="h-32 rounded flex items-center justify-center" style={{ background: '#111B2A', border: '1px dashed #EF4444', color: '#EF4444' }}>[조치 전]</div></div>
            <div><div className="text-xs mb-2" style={{ color: '#64748B' }}>조치 후 사진</div>
              <div className="h-32 rounded flex items-center justify-center" style={{ background: '#111B2A', border: '1px dashed #22C55E', color: '#22C55E' }}>[조치 후]</div></div>
          </div>
          <button className="px-6 py-2 rounded font-bold text-sm" style={{ background: '#3B82F6', color: '#fff' }}>조치완료 등록</button>
        </div>
      )}

      {actionTab === 'confirm' && (
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#22C55E' }}>확인 완료</h2>
          <div className="space-y-3">
            {existingChecks.filter((c: any) => c.issueDesc).map((c: any, i: number) => (
              <div key={c.checkId || i} className="flex items-center justify-between p-3 rounded" style={{ background: '#111B2A' }}>
                <div className="text-sm">
                  <span style={{ color: '#EF4444' }}>{c.issueDesc || '지적사항'}</span> -&gt; <span style={{ color: '#3B82F6' }}>{c.actionDesc || '조치 내용'}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: c.actionStatus === '확인완료' ? '#22C55E20' : '#F0A50020', color: c.actionStatus === '확인완료' ? '#22C55E' : '#F0A500' }}>
                  {c.actionStatus || '대기'}
                </span>
              </div>
            ))}
            {existingChecks.filter((c: any) => c.issueDesc).length === 0 && (
              <div className="text-sm" style={{ color: '#64748B' }}>지적사항이 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
