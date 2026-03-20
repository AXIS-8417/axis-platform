import { useState } from 'react';
export default function ByeongSafety() {
  const [cycle, setCycle] = useState('일일');
  const [season, setSeason] = useState('일반');
  const items = ['바닥상태', '조명', '안전장구', '장비상태', '방호울타리', '날씨', '소화기', '비상구', '신호체계', '안전표지', '가스감지', '전기설비'];
  const [checks, setChecks] = useState<Record<string,boolean>>(Object.fromEntries(items.map(i => [i, false])));
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">안전체크</h1>
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
        <h2 className="text-sm font-semibold mb-4" style={{ color:'#22C55E' }}>12항목 방호장치 점검</h2>
        <div className="grid grid-cols-3 gap-3">
          {items.map(item => (
            <label key={item} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: checks[item]?'#22C55E':'#94A3B8' }}>
              <input type="checkbox" checked={checks[item]} onChange={() => setChecks({...checks, [item]:!checks[item]})} style={{ accentColor:'#22C55E' }} />
              {item}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4">
          <div className="text-xs mb-2" style={{ color:'#64748B' }}>조치 전 사진</div>
          <div className="h-32 rounded flex items-center justify-center" style={{ background:'#111B2A', border:'1px dashed #334155', color:'#64748B' }}>📷 사진 업로드</div>
        </div>
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4">
          <div className="text-xs mb-2" style={{ color:'#64748B' }}>조치 후 사진</div>
          <div className="h-32 rounded flex items-center justify-center" style={{ background:'#111B2A', border:'1px dashed #334155', color:'#64748B' }}>📷 사진 업로드</div>
        </div>
      </div>
    </div>
  );
}
