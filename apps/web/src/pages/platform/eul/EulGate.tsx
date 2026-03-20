import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const TABS = ['마스터', '을원장 (단독잠금)', '병원장 (상호잠금)', '정합대조'] as const;
const matchColors: Record<string,string> = { '일치':'#22C55E', '을기록누락':'#EF4444', '병기록누락':'#EF4444', '미봉인':'#F0A500', '불일치':'#EF4444', '미매핑':'#F0A500' };

export default function EulGate() {
  const [tab, setTab] = useState(0);
  const [gates, setGates] = useState<any[]>([]);
  const [eulEvents, setEulEvents] = useState<any[]>([]);
  const [byeongEvents, setByeongEvents] = useState<any[]>([]);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [expandedGate, setExpandedGate] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  // 을 이벤트 등록 폼
  const [showEulForm, setShowEulForm] = useState(false);
  const [eulForm, setEulForm] = useState({ gateId:'', eventType:'설치', description:'', quantity:0, unit:'EA' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gRes, eRes, bRes] = await Promise.all([
        api.get('/api/platform/gates'),
        api.get('/api/platform/seals', { params: { q: 'EulGateEvent' } }),
        api.get('/api/platform/seals', { params: { q: 'ByeongGateEvent' } }),
      ]);
      setGates(gRes.data?.items || []);

      // 을/병 이벤트는 별도 테이블이므로 직접 조회 — seals에서 targetId로 역추적하거나
      // 실제로는 eul/byeong events를 직접 가져와야 함
      // 현재 API에는 eul-events / byeong-events GET 목록이 없으므로 gates 목록 연동
    } catch {
      // fallback
    }

    // 을 이벤트 — seals 통해 간접 조회 (임시) or gates eul-events
    // 현재 구조상 별도 GET /gates/eul-events 목록 API가 없으므로 seals에서 EulGateEvent 타입 필터
    try {
      const sRes = await api.get('/api/platform/seals');
      const allSeals = sRes.data?.items || [];
      const eulSeals = allSeals.filter((s: any) => s.targetType === 'EulGateEvent');
      const byeongSeals = allSeals.filter((s: any) => s.targetType === 'ByeongGateEvent');
      // 이벤트 자체는 seal과 1:1이므로 표시용으로 사용
      if (eulSeals.length > 0) setEulEvents(eulSeals.map((s: any) => ({
        eventId: s.targetId, gateId: s.sealTargetId, eventType: '기록', eventDate: s.sealedAt?.slice(0,10),
        recorder: s.sealParty || '-', sealType: s.sealType, sealId: s.sealId, note: s.sealReason || '',
      })));
      if (byeongSeals.length > 0) setByeongEvents(byeongSeals.map((s: any) => ({
        eventId: s.targetId, gateId: s.sealTargetId, eventType: '점검', eventDate: s.sealedAt?.slice(0,10),
        recorder: s.sealParty || '-', sealType: s.sealType, sealId: s.sealId, note: s.sealReason || '',
        counterConfirmed: s.counterConfirmed, counterUser: s.counterUser,
      })));
    } catch {}
    setLoading(false);
  };

  const fetchReconciliation = async () => {
    try {
      // siteId 필요 — 첫 게이트의 siteId 사용
      const siteId = gates[0]?.siteId;
      if (!siteId) return;
      const res = await api.get('/api/platform/gates/reconciliation', { params: { siteId } });
      setReconciliation(res.data);
    } catch {}
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === 3 && gates.length > 0) fetchReconciliation(); }, [tab, gates]);

  const handleCreateEulEvent = async () => {
    try {
      await api.post('/api/platform/gates/eul-events', {
        gateId: eulForm.gateId || gates[0]?.gateId,
        siteId: gates[0]?.siteId,
        eventType: eulForm.eventType,
        description: eulForm.description,
        quantity: eulForm.quantity,
        unit: eulForm.unit,
      });
      setShowEulForm(false);
      setEulForm({ gateId:'', eventType:'설치', description:'', quantity:0, unit:'EA' });
      fetchAll();
    } catch (e: any) {
      alert(e?.response?.data?.error || '등록 실패');
    }
  };

  const sealBadge = (sealId: string|null) => sealId
    ? <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>🔒 {sealId}</span>
    : <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#F0A50020', color:'#F0A500' }}>미봉인</span>;

  const recon = reconciliation || { reconciled:[], unmatchedEul:[], unmatchedByeong:[], summary:{ totalEul:0, totalByeong:0, matched:0, matchRate:0 } };

  return (
    <div className="p-8" style={{ background:'#070C12', minHeight:'100vh', color:'#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-2">게이트 관리</h1>
      <p className="text-xs mb-6" style={{ color:'#64748B' }}>4축 구조: 시공·장비·화물·<strong style={{ color:'#F0A500' }}>게이트</strong> | 을원장(단독잠금) + 병원장(상호잠금) + 정합대조</p>

      {/* 4축 표시 */}
      <div className="flex gap-2 mb-6">
        {[{axis:'시공축', icon:'🏗', color:'#00D9CC'},{axis:'장비축', icon:'🚜', color:'#3B82F6'},{axis:'화물축', icon:'🚛', color:'#8B5CF6'},{axis:'게이트축', icon:'🚪', color:'#F0A500', active:true}].map(a => (
          <div key={a.axis} className="flex-1 p-3 rounded-lg text-center text-xs" style={{ background: a.active ? a.color+'20' : '#0C1520', border: `1px solid ${a.active ? a.color : '#1E293B'}`, color: a.active ? a.color : '#64748B' }}>
            <div className="text-lg mb-1">{a.icon}</div>
            <div className="font-bold">{a.axis}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} className="px-4 py-2 rounded-lg text-sm"
            style={{ background: tab===i ? '#F0A50020' : '#0C1520', color: tab===i ? '#F0A500' : '#64748B', border: `1px solid ${tab===i ? '#F0A500' : '#1E293B'}` }}>
            {t}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>로딩 중...</div>}

      {/* 마스터 */}
      {!loading && tab === 0 && (
        <div className="space-y-3">
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#3B82F615', border:'1px solid #3B82F640', color:'#3B82F6' }}>
            게이트 마스터 = 설치된 도어(홀딩/양개) 목록. GateID 단위로 원장 관리. 각 게이트는 시공·장비·화물과 독립된 <strong>게이트축</strong>으로 봉인됩니다.
          </div>
          {gates.length === 0 && <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>등록된 게이트가 없습니다.</div>}
          {gates.map((g: any) => (
            <div key={g.gateId} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="font-bold">{g.gateId}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#F0A50020', color:'#F0A500' }}>{g.gateType || '-'}</span>
                  </div>
                  <div className="text-xs" style={{ color:'#94A3B8' }}>{g.gateName || '-'} · {g.description || ''}</div>
                  <div className="text-xs mt-1" style={{ color:'#64748B' }}>사이트: {g.siteId || '-'}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: g.isActive ? '#22C55E20' : '#EF444420', color: g.isActive ? '#22C55E' : '#EF4444' }}>{g.isActive ? '활성' : '비활성'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 을원장 (단독잠금) */}
      {!loading && tab === 1 && (
        <div className="space-y-3">
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#00D9CC15', border:'1px solid #00D9CC40', color:'#00D9CC' }}>
            <strong>을 게이트원장</strong> = 을(시공사)이 기록하는 게이트 이벤트. <strong>단독잠금(SINGLE_SEAL)</strong>으로 봉인됩니다.
          </div>
          {eulEvents.length === 0 && <div className="text-center py-8 text-sm" style={{ color:'#64748B' }}>을 게이트 이벤트가 없습니다.</div>}
          {eulEvents.map((ev: any) => (
            <div key={ev.eventId} onClick={() => setExpandedGate(expandedGate===ev.eventId ? null : ev.eventId)}
              style={{ background:'#0C1520', border: `1px solid ${ev.sealId ? '#8B5CF6' : '#1E293B'}` }} className="rounded-lg p-4 cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="font-semibold text-sm">{ev.eventId}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#F0A50020', color:'#F0A500' }}>{ev.eventType}</span>
                    {ev.sealType && <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>🔒 {ev.sealType}</span>}
                  </div>
                  <div className="text-xs" style={{ color:'#94A3B8' }}>{ev.gateId} · {ev.eventDate} · 작성: {ev.recorder}</div>
                </div>
                {sealBadge(ev.sealId)}
              </div>
              <div className="text-sm" style={{ color:'#94A3B8' }}>{ev.note}</div>
            </div>
          ))}

          {/* 등록 폼 */}
          {showEulForm ? (
            <div className="p-4 rounded-lg" style={{ background:'#111B2A', border:'1px solid #00D9CC' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color:'#00D9CC' }}>을 게이트 이벤트 등록</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color:'#64748B' }}>게이트 ID</label>
                  <select value={eulForm.gateId} onChange={e => setEulForm({...eulForm, gateId: e.target.value})}
                    className="w-full px-3 py-2 rounded text-sm" style={{ background:'#0C1520', border:'1px solid #334155', color:'#F1F5F9' }}>
                    <option value="">선택</option>
                    {gates.map((g: any) => <option key={g.gateId} value={g.gateId}>{g.gateId} - {g.gateName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color:'#64748B' }}>이벤트 유형</label>
                  <select value={eulForm.eventType} onChange={e => setEulForm({...eulForm, eventType: e.target.value})}
                    className="w-full px-3 py-2 rounded text-sm" style={{ background:'#0C1520', border:'1px solid #334155', color:'#F1F5F9' }}>
                    {['설치','점검','이동','수리','회수'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color:'#64748B' }}>수량</label>
                  <input type="number" value={eulForm.quantity} onChange={e => setEulForm({...eulForm, quantity: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded text-sm" style={{ background:'#0C1520', border:'1px solid #334155', color:'#F1F5F9' }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color:'#64748B' }}>설명</label>
                  <textarea value={eulForm.description} onChange={e => setEulForm({...eulForm, description: e.target.value})}
                    className="w-full px-3 py-2 rounded text-sm" rows={2} style={{ background:'#0C1520', border:'1px solid #334155', color:'#F1F5F9' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateEulEvent} className="px-4 py-2 rounded text-sm font-bold" style={{ background:'#00D9CC', color:'#070C12' }}>등록 (단독잠금)</button>
                  <button onClick={() => setShowEulForm(false)} className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>취소</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowEulForm(true)} className="w-full py-3 rounded-lg text-sm font-bold" style={{ background:'#00D9CC', color:'#070C12' }}>
              + 을 게이트 이벤트 등록 (단독잠금)
            </button>
          )}
        </div>
      )}

      {/* 병원장 (상호잠금) */}
      {!loading && tab === 2 && (
        <div className="space-y-3">
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#22C55E15', border:'1px solid #22C55E40', color:'#22C55E' }}>
            <strong>병 게이트원장</strong> = 병(작업팀)이 기록하는 게이트 일일점검. <strong>상호잠금(MUTUAL_SEAL)</strong>으로 봉인됩니다.
            병이 기록 후, 을이 상호확인(counter-confirm)해야 봉인 완료.
          </div>
          {byeongEvents.length === 0 && <div className="text-center py-8 text-sm" style={{ color:'#64748B' }}>병 게이트 이벤트가 없습니다.</div>}
          {byeongEvents.map((ev: any) => (
            <div key={ev.eventId} onClick={() => setExpandedGate(expandedGate===ev.eventId ? null : ev.eventId)}
              style={{ background:'#0C1520', border: `1px solid ${ev.sealId ? '#8B5CF6' : ev.counterConfirmed ? '#22C55E' : '#F0A500'}` }} className="rounded-lg p-4 cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="font-semibold text-sm">{ev.eventId}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#22C55E20', color:'#22C55E' }}>{ev.eventType}</span>
                    {ev.sealType && <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>🔒 {ev.sealType}</span>}
                  </div>
                  <div className="text-xs" style={{ color:'#94A3B8' }}>{ev.gateId} · {ev.eventDate} · 작성: {ev.recorder}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {sealBadge(ev.sealId)}
                  {ev.counterConfirmed
                    ? <span className="text-xs" style={{ color:'#22C55E' }}>✓ 상호확인: {ev.counterUser}</span>
                    : <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#EF444420', color:'#EF4444' }}>상호확인 대기</span>
                  }
                </div>
              </div>
              <div className="text-sm" style={{ color:'#94A3B8' }}>{ev.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* 정합대조 */}
      {!loading && tab === 3 && (
        <div>
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#8B5CF615', border:'1px solid #8B5CF640', color:'#8B5CF6' }}>
            <strong>정합대조</strong> = 을원장과 병원장의 1:1 매핑 검증. 같은 게이트·같은 이벤트유형의 을 기록과 병 기록을 대조합니다.
          </div>

          {/* 요약 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label:'을 원장', count: recon.summary?.totalEul || 0, color:'#00D9CC' },
              { label:'병 원장', count: recon.summary?.totalByeong || 0, color:'#22C55E' },
              { label:'매칭', count: recon.summary?.matched || 0, color:'#8B5CF6' },
              { label:'매칭률', count: `${recon.summary?.matchRate || 0}%`, color:'#F0A500' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-lg text-center" style={{ background:'#0C1520', border:`1px solid ${s.color}40` }}>
                <div className="text-2xl font-mono font-bold" style={{ color: s.color }}>{s.count}</div>
                <div className="text-xs mt-1" style={{ color:'#64748B' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 매칭 결과 테이블 */}
          {recon.reconciled?.length > 0 && (
            <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background:'#111B2A', borderBottom:'1px solid #334155' }}>
                    <th className="text-left px-4 py-3 text-xs" style={{ color:'#64748B' }}>Gate</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color:'#00D9CC' }}>을 수량</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color:'#22C55E' }}>병 수량</th>
                    <th className="text-center px-4 py-3 text-xs" style={{ color:'#8B5CF6' }}>차이</th>
                    <th className="text-center px-4 py-3 text-xs" style={{ color:'#F0A500' }}>정합</th>
                  </tr>
                </thead>
                <tbody>
                  {recon.reconciled.map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom:'1px solid #1E293B' }}>
                      <td className="px-4 py-3 text-xs">{r.gateId}</td>
                      <td className="px-4 py-3 text-xs font-mono">{r.eulQty ?? '-'}</td>
                      <td className="px-4 py-3 text-xs font-mono">{r.byeongQty ?? '-'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-center">{r.diff ?? '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs px-2 py-1 rounded font-bold"
                          style={{ background: (matchColors[r.matchStatus]||'#64748B')+'20', color: matchColors[r.matchStatus]||'#64748B' }}>
                          {r.matchStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 미매핑 */}
          {(recon.unmatchedEul?.length > 0 || recon.unmatchedByeong?.length > 0) && (
            <div className="p-4 rounded-lg mb-4" style={{ background:'#EF444410', border:'1px solid #EF444440' }}>
              <div className="text-xs font-bold mb-2" style={{ color:'#EF4444' }}>미매핑 레코드</div>
              {recon.unmatchedEul?.map((e: any, i: number) => (
                <div key={`e${i}`} className="text-xs py-1" style={{ color:'#94A3B8' }}>을: {e.eventId} ({e.eventType})</div>
              ))}
              {recon.unmatchedByeong?.map((b: any, i: number) => (
                <div key={`b${i}`} className="text-xs py-1" style={{ color:'#94A3B8' }}>병: {b.eventId} ({b.eventType})</div>
              ))}
            </div>
          )}

          {recon.reconciled?.length === 0 && recon.unmatchedEul?.length === 0 && recon.unmatchedByeong?.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>정합대조할 데이터가 없습니다.</div>
          )}

          <div className="mt-4 p-3 rounded-lg text-xs" style={{ background:'#111B2A', border:'1px solid #1E293B', color:'#64748B' }}>
            ※ 정합 결과는 봉인 대상이 아닙니다. 정합은 항상 "동적 계산 결과"이며, 을·병 기록의 사실 확인용입니다.
          </div>
        </div>
      )}
    </div>
  );
}
