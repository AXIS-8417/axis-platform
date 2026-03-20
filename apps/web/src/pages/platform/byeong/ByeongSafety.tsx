import { useState } from 'react';
export default function ByeongSafety() {
  const [cycle, setCycle] = useState('일일');
  const [season, setSeason] = useState('일반');
  const [actionTab, setActionTab] = useState<'check'|'issue'|'action'|'confirm'>('check');
  const items = ['바닥상태','조명','안전장구','장비상태','방호울타리','날씨','소화기','비상구','신호체계','안전표지','가스감지','전기설비'];
  const [checks, setChecks] = useState<Record<string,boolean>>(Object.fromEntries(items.map(i => [i, false])));
  const passCount = Object.values(checks).filter(Boolean).length;

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">안전체크</h1>

      {/* 워크플로우 탭 */}
      <div className="flex gap-2 mb-6">
        {([['check','① 점검'],['issue','② 지적'],['action','③ 조치'],['confirm','④ 확인']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setActionTab(k as any)} className="px-4 py-2 rounded-lg text-sm"
            style={{ background:actionTab===k?'#22C55E20':'#0C1520', color:actionTab===k?'#22C55E':'#64748B', border:`1px solid ${actionTab===k?'#22C55E':'#1E293B'}` }}>{l}</button>
        ))}
      </div>

      {actionTab === 'check' && (
        <>
          <div className="flex gap-4 mb-6">
            <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>점검주기</label>
            <select value={cycle} onChange={e => setCycle(e.target.value)} className="px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }}>
              {['일일','주간','월간','분기','반기','정밀'].map(c => <option key={c}>{c}</option>)}
            </select></div>
            <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>계절점검</label>
            <select value={season} onChange={e => setSeason(e.target.value)} className="px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }}>
              {['일반','해빙기','장마','태풍','동절기'].map(s => <option key={s}>{s}</option>)}
            </select></div>
          </div>
          <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold" style={{ color:'#22C55E' }}>12항목 방호장치 점검</h2>
              <span className="text-xs font-mono" style={{ color: passCount===12?'#22C55E':'#F0A500' }}>{passCount}/12</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {items.map(item => (
                <label key={item} className="flex items-center gap-2 text-sm cursor-pointer py-1" style={{ color:checks[item]?'#22C55E':'#94A3B8' }}>
                  <input type="checkbox" checked={checks[item]} onChange={() => setChecks({...checks,[item]:!checks[item]})} style={{ accentColor:'#22C55E' }} />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {actionTab === 'issue' && (
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#F0A500' }}>지적사항 입력</h2>
          <textarea placeholder="지적사항을 입력하세요..." rows={4} className="w-full px-3 py-2 rounded text-sm mb-4" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="text-xs mb-2" style={{ color:'#64748B' }}>조치 전 사진</div>
            <div className="h-32 rounded flex items-center justify-center" style={{ background:'#111B2A', border:'1px dashed #334155', color:'#64748B' }}>📷 사진 업로드</div></div>
            <div><div className="text-xs mb-2" style={{ color:'#64748B' }}>현장 전경</div>
            <div className="h-32 rounded flex items-center justify-center" style={{ background:'#111B2A', border:'1px dashed #334155', color:'#64748B' }}>📷 사진 업로드</div></div>
          </div>
          <button className="px-6 py-2 rounded font-bold text-sm" style={{ background:'#F0A500', color:'#070C12' }}>지적사항 등록</button>
        </div>
      )}

      {actionTab === 'action' && (
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#3B82F6' }}>조치내용 입력</h2>
          <div className="mb-4 p-3 rounded text-sm" style={{ background:'#F0A50015', color:'#F0A500' }}>지적사항: 방호울타리 파손 구간 발견 (3M)</div>
          <textarea placeholder="조치내용을 입력하세요..." rows={4} className="w-full px-3 py-2 rounded text-sm mb-4" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="text-xs mb-2" style={{ color:'#64748B' }}>조치 전 사진</div>
            <div className="h-32 rounded flex items-center justify-center" style={{ background:'#111B2A', border:'1px dashed #EF4444', color:'#EF4444' }}>📷 조치 전</div></div>
            <div><div className="text-xs mb-2" style={{ color:'#64748B' }}>조치 후 사진</div>
            <div className="h-32 rounded flex items-center justify-center" style={{ background:'#111B2A', border:'1px dashed #22C55E', color:'#22C55E' }}>📷 조치 후</div></div>
          </div>
          <button className="px-6 py-2 rounded font-bold text-sm" style={{ background:'#3B82F6', color:'#fff' }}>조치완료 등록</button>
        </div>
      )}

      {actionTab === 'confirm' && (
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#22C55E' }}>확인 완료</h2>
          <div className="space-y-3">
            {[{ issue:'방호울타리 파손', action:'교체 완료', status:'확인완료' }, { issue:'조명 불량', action:'전구 교체', status:'조치완료' }].map((item,i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded" style={{ background:'#111B2A' }}>
                <div className="text-sm"><span style={{ color:'#EF4444' }}>{item.issue}</span> → <span style={{ color:'#3B82F6' }}>{item.action}</span></div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: item.status==='확인완료'?'#22C55E20':'#F0A50020', color: item.status==='확인완료'?'#22C55E':'#F0A500' }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
