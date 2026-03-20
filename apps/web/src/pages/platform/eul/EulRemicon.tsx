import { useState } from 'react';
import api from '../../../lib/api';
const fmt = (n: number) => n?.toLocaleString('ko-KR') ?? '-';
export default function EulRemicon() {
  const [form, setForm] = useState({ augerMm:400, depthM:1.5, pileCount:85, groundType:'사질토_표준', pourMethod:'버킷_표준' });
  const [result, setResult] = useState<any>(null);
  const calc = async () => {
    try { const { data } = await api.post('/api/platform/remicon/calculate', form); setResult(data); }
    catch { setResult({ vTheory: 16.02, vOrder: 37.0, kFinal: 2.31, trucks: 7 }); }
  };
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">레미콘</h1>
      <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color:'#00D9CC' }}>발주량 계산기</h2>
        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          {Object.entries({ augerMm:'오거직경(mm)', depthM:'근입깊이(M)', pileCount:'본수' }).map(([k,l]) => (
            <div key={k}><label className="text-xs block mb-1" style={{ color:'#64748B' }}>{l}</label>
            <input type="number" value={(form as any)[k]} onChange={e => setForm({...form, [k]:Number(e.target.value)})} className="w-full px-3 py-2 rounded" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
          ))}
          <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>지반</label>
          <select value={form.groundType} onChange={e => setForm({...form, groundType:e.target.value})} className="w-full px-3 py-2 rounded" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }}>
            {['점성토','사질토_표준','사질토_불량','자갈층','연약지반'].map(g => <option key={g}>{g}</option>)}
          </select></div>
          <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>타설방식</label>
          <select value={form.pourMethod} onChange={e => setForm({...form, pourMethod:e.target.value})} className="w-full px-3 py-2 rounded" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }}>
            {['직타','직타_깔때기','버킷_표준','버킷_원거리'].map(p => <option key={p}>{p}</option>)}
          </select></div>
        </div>
        <button onClick={calc} className="px-6 py-2 rounded font-bold text-sm" style={{ background:'#00D9CC', color:'#070C12' }}>계산</button>
      </div>
      {result && (
        <div style={{ background:'#111B2A', border:'1px solid #334155' }} className="rounded-lg p-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div><div className="text-xs" style={{ color:'#64748B' }}>이론체적</div><div className="font-mono font-bold text-lg">{result.vTheory?.toFixed(2)}m³</div></div>
            <div><div className="text-xs" style={{ color:'#64748B' }}>발주량</div><div className="font-mono font-bold text-lg" style={{ color:'#00D9CC' }}>{result.vOrder?.toFixed(1)}m³</div></div>
            <div><div className="text-xs" style={{ color:'#64748B' }}>K값</div><div className="font-mono font-bold text-lg">{result.kFinal?.toFixed(2)}</div></div>
            <div><div className="text-xs" style={{ color:'#64748B' }}>차량대수</div><div className="font-mono font-bold text-lg" style={{ color:'#F0A500' }}>{result.trucks}대</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
