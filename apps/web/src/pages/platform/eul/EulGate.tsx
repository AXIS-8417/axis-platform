import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const fmt = (n: number) => n?.toLocaleString('ko-KR') ?? '-';

// 게이트 마스터 예시 데이터
const MOCK_GATES = [
  { gateId:'GATE-001', gateType:'홀딩도어', widthM:8, heightM:6, grade:'신재', location:'A구간 정문', siteId:'SITE-001', status:'설치완료', sealId:null, installedAt:'2026-03-10' },
  { gateId:'GATE-002', gateType:'양개도어(비계식)', widthM:4, heightM:2.4, grade:'고재', location:'B구간 후문', siteId:'SITE-001', status:'설치완료', sealId:'SEAL-G01', installedAt:'2026-03-08' },
  { gateId:'GATE-003', gateType:'양개도어(각관식)', widthM:6, heightM:2.4, grade:'신재', location:'C구간 측면', siteId:'SITE-002', status:'회수대기', sealId:null, installedAt:'2026-03-05' },
];

// 을 원장 (단독잠금) — 을이 기록하고 단독 봉인
const MOCK_EUL_EVENTS = [
  { eventId:'GE-E001', gateId:'GATE-001', eventType:'설치', eventDate:'2026-03-10', recorder:'을사 김팀장', sealType:'단독잠금', sealId:'SEAL-GE01', note:'A구간 정문 홀딩도어 W:8M 설치 완료. 쪽문 좌측.', details:{ panelCount:4, boltTorque:'25N·m', foundationType:'H빔', meshInstalled:true } },
  { eventId:'GE-E002', gateId:'GATE-001', eventType:'점검', eventDate:'2026-03-15', recorder:'을사 박관리', sealType:'단독잠금', sealId:'SEAL-GE02', note:'힌지 윤활유 도포. 잠금장치 정상 작동 확인.', details:{ condition:'양호', repairNeeded:false } },
  { eventId:'GE-E003', gateId:'GATE-002', eventType:'설치', eventDate:'2026-03-08', recorder:'을사 김팀장', sealType:'단독잠금', sealId:'SEAL-GE03', note:'B구간 후문 양개도어 W:4M 설치. 고재 사용.', details:{ panelCount:2, boltTorque:'25N·m', foundationType:'파이프' } },
  { eventId:'GE-E004', gateId:'GATE-003', eventType:'이동', eventDate:'2026-03-18', recorder:'을사 이반장', sealType:null, sealId:null, note:'C구간→D구간 이동 예정. 크레인 필요.', details:{ fromLocation:'C구간 측면', toLocation:'D구간 정면', equipNeeded:'크레인 25톤' } },
];

// 병 원장 (상호잠금) — 병이 기록하고 을·병 상호 확인 후 봉인
const MOCK_BYEONG_EVENTS = [
  { eventId:'GE-B001', gateId:'GATE-001', eventType:'일일점검', eventDate:'2026-03-16', recorder:'병팀 홍기사', counterConfirmed:true, counterUser:'을사 김팀장', counterConfirmedAt:'2026-03-16', sealType:'상호잠금', sealId:'SEAL-GB01', note:'개폐 정상. 잠금장치 정상. 경첩 소리 없음.', checks:{ openClose:'정상', lockDevice:'정상', hinge:'정상', ground:'양호', visibility:'양호' } },
  { eventId:'GE-B002', gateId:'GATE-001', eventType:'일일점검', eventDate:'2026-03-17', recorder:'병팀 홍기사', counterConfirmed:true, counterUser:'을사 김팀장', counterConfirmedAt:'2026-03-17', sealType:'상호잠금', sealId:'SEAL-GB02', note:'개폐 정상. 비 후 지반 약간 침하. 모니터링 필요.', checks:{ openClose:'정상', lockDevice:'정상', hinge:'정상', ground:'주의', visibility:'양호' } },
  { eventId:'GE-B003', gateId:'GATE-002', eventType:'일일점검', eventDate:'2026-03-17', recorder:'병팀 최기능공', counterConfirmed:false, counterUser:null, counterConfirmedAt:null, sealType:null, sealId:null, note:'양개도어 좌측 경첩 이완. 볼트 재체결 필요.', checks:{ openClose:'정상', lockDevice:'정상', hinge:'이완', ground:'양호', visibility:'양호' } },
];

// 정합대조 — 을 원장 vs 병 원장 1:1 매핑
const MOCK_RECONCILIATION = [
  { gateId:'GATE-001', date:'2026-03-16', eulEvent:'GE-E002 점검(을)', byeongEvent:'GE-B001 일일점검(병)', matchStatus:'일치', eulSeal:'SEAL-GE02', byeongSeal:'SEAL-GB01', note:'을·병 기록 일치. 게이트 상태 양호.' },
  { gateId:'GATE-001', date:'2026-03-17', eulEvent:null, byeongEvent:'GE-B002 일일점검(병)', matchStatus:'을기록누락', eulSeal:null, byeongSeal:'SEAL-GB02', note:'병 기록 존재하나 을 기록 누락. 대조 불가.' },
  { gateId:'GATE-002', date:'2026-03-17', eulEvent:null, byeongEvent:'GE-B003 일일점검(병)', matchStatus:'미봉인', eulSeal:null, byeongSeal:null, note:'병 기록 미봉인 상태. 상호확인 대기.' },
];

const TABS = ['마스터', '을원장 (단독잠금)', '병원장 (상호잠금)', '정합대조'] as const;

const matchColors: Record<string,string> = { '일치':'#22C55E', '을기록누락':'#EF4444', '병기록누락':'#EF4444', '미봉인':'#F0A500', '불일치':'#EF4444' };

export default function EulGate() {
  const [tab, setTab] = useState(0);
  const [gates, setGates] = useState(MOCK_GATES);
  const [eulEvents, setEulEvents] = useState(MOCK_EUL_EVENTS);
  const [byeongEvents, setByeongEvents] = useState(MOCK_BYEONG_EVENTS);
  const [reconciliation, setReconciliation] = useState(MOCK_RECONCILIATION);
  const [expandedGate, setExpandedGate] = useState<string|null>(null);

  // API 연결 시도
  useEffect(() => {
    api.get('/api/platform/codes?group=GATE_TYPE').catch(() => {});
  }, []);

  const sealBadge = (sealId: string|null) => sealId
    ? <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>🔒 {sealId}</span>
    : <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#F0A50020', color:'#F0A500' }}>미봉인</span>;

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

      {/* 마스터 */}
      {tab === 0 && (
        <div className="space-y-3">
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#3B82F615', border:'1px solid #3B82F640', color:'#3B82F6' }}>
            게이트 마스터 = 설치된 도어(홀딩/양개) 목록. GateID 단위로 원장 관리. 각 게이트는 시공·장비·화물과 독립된 <strong>게이트축</strong>으로 봉인됩니다.
          </div>
          {gates.map(g => (
            <div key={g.gateId} style={{ background:'#0C1520', border: `1px solid ${g.sealId ? '#8B5CF6' : '#1E293B'}` }} className="rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="font-bold">{g.gateId}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background:'#F0A50020', color:'#F0A500' }}>{g.gateType}</span>
                    {sealBadge(g.sealId)}
                  </div>
                  <div className="text-xs" style={{ color:'#94A3B8' }}>
                    W:{g.widthM}M × H:{g.heightM}M · {g.grade} · {g.location}
                  </div>
                  <div className="text-xs mt-1" style={{ color:'#64748B' }}>설치일: {g.installedAt} · {g.siteId}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: g.status==='설치완료' ? '#22C55E20' : '#F0A50020', color: g.status==='설치완료' ? '#22C55E' : '#F0A500' }}>{g.status}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span style={{ color:'#64748B' }}>을원장: {eulEvents.filter(e => e.gateId===g.gateId).length}건</span>
                <span style={{ color:'#64748B' }}>병원장: {byeongEvents.filter(e => e.gateId===g.gateId).length}건</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 을원장 (단독잠금) */}
      {tab === 1 && (
        <div className="space-y-3">
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#00D9CC15', border:'1px solid #00D9CC40', color:'#00D9CC' }}>
            <strong>을 게이트원장</strong> = 을(시공사)이 기록하는 게이트 이벤트. <strong>단독잠금(SINGLE_SEAL)</strong>으로 봉인됩니다.
            을이 기록 후 즉시 봉인 가능. 병의 확인 불필요. 설치/점검/이동/수리/회수 이벤트를 기록합니다.
          </div>
          {eulEvents.map(ev => (
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

              {expandedGate === ev.eventId && ev.details && (
                <div className="mt-3 p-3 rounded" style={{ background:'#111B2A', border:'1px solid #1E293B' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color:'#F0A500' }}>상세 기록</div>
                  {Object.entries(ev.details).map(([k,v]) => (
                    <div key={k} className="flex justify-between text-xs py-1" style={{ borderBottom:'1px solid #1E293B' }}>
                      <span style={{ color:'#64748B' }}>{k}</span>
                      <span className="font-mono" style={{ color:'#F1F5F9' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button className="w-full py-3 rounded-lg text-sm font-bold" style={{ background:'#00D9CC', color:'#070C12' }}>
            + 을 게이트 이벤트 등록 (단독잠금)
          </button>
        </div>
      )}

      {/* 병원장 (상호잠금) */}
      {tab === 2 && (
        <div className="space-y-3">
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#22C55E15', border:'1px solid #22C55E40', color:'#22C55E' }}>
            <strong>병 게이트원장</strong> = 병(작업팀)이 기록하는 게이트 일일점검. <strong>상호잠금(MUTUAL_SEAL)</strong>으로 봉인됩니다.
            병이 기록 후, 을이 상호확인(counter-confirm)해야 봉인 완료. 미확인 상태는 봉인 보류.
          </div>
          {byeongEvents.map(ev => (
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

              {expandedGate === ev.eventId && ev.checks && (
                <div className="mt-3 p-3 rounded" style={{ background:'#111B2A', border:'1px solid #1E293B' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color:'#22C55E' }}>점검 항목</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(ev.checks).map(([k,v]) => {
                      const color = v === '정상' || v === '양호' ? '#22C55E' : v === '주의' ? '#F0A500' : '#EF4444';
                      return (
                        <div key={k} className="flex justify-between text-xs p-2 rounded" style={{ background:'#0C1520', border:'1px solid #1E293B' }}>
                          <span style={{ color:'#64748B' }}>{k}</span>
                          <span className="font-bold" style={{ color }}>{String(v)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {!ev.counterConfirmed && (
                    <button className="mt-3 w-full py-2 rounded text-xs font-bold" style={{ background:'#22C55E', color:'#070C12' }}>
                      을 상호확인 (MUTUAL_SEAL 발동)
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 정합대조 */}
      {tab === 3 && (
        <div>
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#8B5CF615', border:'1px solid #8B5CF640', color:'#8B5CF6' }}>
            <strong>정합대조</strong> = 을원장과 병원장의 1:1 매핑 검증. 같은 게이트·같은 날짜의 을 기록과 병 기록을 대조합니다.
            정합 결과: <strong style={{ color:'#22C55E' }}>일치</strong> / <strong style={{ color:'#EF4444' }}>기록누락</strong> / <strong style={{ color:'#F0A500' }}>미봉인</strong> / <strong style={{ color:'#EF4444' }}>불일치</strong>
          </div>

          <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background:'#111B2A', borderBottom:'1px solid #334155' }}>
                  <th className="text-left px-4 py-3 text-xs" style={{ color:'#64748B' }}>Gate / 날짜</th>
                  <th className="text-left px-4 py-3 text-xs" style={{ color:'#00D9CC' }}>을원장</th>
                  <th className="text-left px-4 py-3 text-xs" style={{ color:'#22C55E' }}>병원장</th>
                  <th className="text-center px-4 py-3 text-xs" style={{ color:'#8B5CF6' }}>정합</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.map((r, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #1E293B' }}>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold">{r.gateId}</div>
                      <div className="text-xs" style={{ color:'#64748B' }}>{r.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r.eulEvent ? (
                        <div className="text-xs">
                          <div>{r.eulEvent}</div>
                          {r.eulSeal && <span className="text-xs" style={{ color:'#8B5CF6' }}>🔒</span>}
                        </div>
                      ) : <span className="text-xs" style={{ color:'#EF4444' }}>기록 없음</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.byeongEvent ? (
                        <div className="text-xs">
                          <div>{r.byeongEvent}</div>
                          {r.byeongSeal && <span className="text-xs" style={{ color:'#8B5CF6' }}>🔒</span>}
                        </div>
                      ) : <span className="text-xs" style={{ color:'#EF4444' }}>기록 없음</span>}
                    </td>
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

          {/* 정합 요약 */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label:'일치', count: reconciliation.filter(r => r.matchStatus==='일치').length, color:'#22C55E' },
              { label:'기록누락', count: reconciliation.filter(r => r.matchStatus.includes('누락')).length, color:'#EF4444' },
              { label:'미봉인', count: reconciliation.filter(r => r.matchStatus==='미봉인').length, color:'#F0A500' },
              { label:'불일치', count: reconciliation.filter(r => r.matchStatus==='불일치').length, color:'#EF4444' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-lg text-center" style={{ background:'#0C1520', border:`1px solid ${s.color}40` }}>
                <div className="text-2xl font-mono font-bold" style={{ color: s.color }}>{s.count}</div>
                <div className="text-xs mt-1" style={{ color:'#64748B' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 rounded-lg text-xs" style={{ background:'#111B2A', border:'1px solid #1E293B', color:'#64748B' }}>
            ※ 정합 결과는 봉인 대상이 아닙니다. 정합은 항상 "동적 계산 결과"이며, 을·병 기록의 사실 확인용입니다.
            정합 상태는 기록이 추가/봉인될 때마다 자동 재계산됩니다.
          </div>
        </div>
      )}
    </div>
  );
}
