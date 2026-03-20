import { useState } from 'react';
const TABS = ['마스터', '을원장(단독잠금)', '병원장(상호잠금)', '정합대조'];
export default function EulGate() {
  const [tab, setTab] = useState(0);
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">게이트 관리</h1>
      <div className="flex gap-2 mb-6">
        {TABS.map((t,i) => <button key={t} onClick={() => setTab(i)} className="px-4 py-2 rounded-lg text-sm" style={{ background:tab===i?'#00D9CC20':'#0C1520', color:tab===i?'#00D9CC':'#64748B', border:`1px solid ${tab===i?'#00D9CC':'#1E293B'}` }}>{t}</button>)}
      </div>
      <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6 text-sm">
        <p style={{ color:'#94A3B8' }}>게이트 {TABS[tab]} 데이터가 표시됩니다.</p>
      </div>
    </div>
  );
}
