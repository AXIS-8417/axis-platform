import { useState, useEffect } from 'react';
import api from '../../../lib/api';
const fmt = (n: number) => n?.toLocaleString('ko-KR') ?? '-';

export default function EulRemicon() {
  const [form, setForm] = useState({ augerMm:400, depthM:1.5, pileCount:85, groundType:'사질토_표준', pourMethod:'버킷_표준' });
  const [result, setResult] = useState<any>(null);
  const [tab, setTab] = useState<'calc'|'vault'|'curing'>('calc');

  const calc = async () => {
    try { const { data } = await api.post('/api/platform/remicon/calculate', form); setResult(data); }
    catch { const r=0.2; const vt=Math.PI*r*r*form.depthM*form.pileCount; setResult({ vTheory:vt, vOrder:vt*2.31, kFinal:2.31, trucks:Math.ceil(vt*2.31/6) }); }
  };

  const deliveries = [
    { id:'RM-001', spec:'25-18-80', chlorideGrade:'GREEN', chloride:0.18, transport:45, transportGrade:'적합', actualPour:37.2, supplier:'한국레미콘', sealId:'SEAL-020' },
    { id:'RM-002', spec:'25-21-120', chlorideGrade:'YELLOW', chloride:0.28, transport:55, transportGrade:'적합', actualPour:42.1, supplier:'대한레미콘', sealId:null },
    { id:'RM-003', spec:'30-24-80', chlorideGrade:'RED', chloride:0.35, transport:72, transportGrade:'FLAG', actualPour:28.5, supplier:'서울레미콘', sealId:null },
  ];
  const clColor: Record<string,string> = { GREEN:'#22C55E', YELLOW:'#F0A500', RED:'#EF4444' };

  // Curing timer
  const [curingDays] = useState(7);
  const [elapsed] = useState(3);

  return (
    <div className="p-4 md:p-8">
      <div className="flex gap-3 mb-6">
        <h1 className="text-xl font-bold flex-1">레미콘</h1>
        {(['calc','vault','curing'] as const).map((t,i) => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-lg text-sm" style={{ background:tab===t?'#00D9CC20':'#0C1520', color:tab===t?'#00D9CC':'#64748B', border:`1px solid ${tab===t?'#00D9CC':'#1E293B'}` }}>{['발주계산','납품서Vault','양생관리'][i]}</button>
        ))}
      </div>

      {tab === 'calc' && (
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#00D9CC' }}>K×L 발주량 계산기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            {Object.entries({ augerMm:'오거직경(mm)', depthM:'근입깊이(M)', pileCount:'본수' }).map(([k,l]) => (
              <div key={k}><label className="text-xs block mb-1" style={{ color:'#64748B' }}>{l}</label>
              <input type="number" value={(form as any)[k]} onChange={e => setForm({...form,[k]:Number(e.target.value)})} className="w-full px-3 py-2 rounded" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
            ))}
            <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>지반</label>
            <select value={form.groundType} onChange={e => setForm({...form,groundType:e.target.value})} className="w-full px-3 py-2 rounded" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }}>
              {['점성토','사질토_표준','사질토_불량','자갈층','연약지반'].map(g => <option key={g}>{g}</option>)}</select></div>
            <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>타설방식</label>
            <select value={form.pourMethod} onChange={e => setForm({...form,pourMethod:e.target.value})} className="w-full px-3 py-2 rounded" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }}>
              {['직타','직타_깔때기','버킷_표준','버킷_원거리'].map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div className="text-xs mb-4" style={{ color:'#64748B' }}>기본값: 사질토+버킷표준 → K=2.31 (미확인 현장)</div>
          <button onClick={calc} className="px-6 py-2 rounded font-bold text-sm" style={{ background:'#00D9CC', color:'#070C12' }}>계산</button>
          {result && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center rounded-lg p-4" style={{ background:'#111B2A' }}>
              <div className="p-3"><div className="text-xs" style={{ color:'#64748B' }}>이론체적</div><div className="font-mono font-bold text-lg">{result.vTheory?.toFixed(2)}m³</div></div>
              <div className="p-3"><div className="text-xs" style={{ color:'#64748B' }}>발주량</div><div className="font-mono font-bold text-lg" style={{ color:'#00D9CC' }}>{result.vOrder?.toFixed(1)}m³</div></div>
              <div className="p-3"><div className="text-xs" style={{ color:'#64748B' }}>K값</div><div className="font-mono font-bold text-lg">{result.kFinal?.toFixed(2)}</div></div>
              <div className="p-3"><div className="text-xs" style={{ color:'#64748B' }}>차량</div><div className="font-mono font-bold text-lg" style={{ color:'#F0A500' }}>{result.trucks}대</div></div>
            </div>
          )}
        </div>
      )}

      {tab === 'vault' && (
        <div className="space-y-3">
          {deliveries.map(d => (
            <div key={d.id} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div><div className="font-semibold">{d.sealId?'🔒 ':''}{d.id} · {d.spec}</div><div className="text-xs mt-1" style={{ color:'#64748B' }}>{d.supplier} · {d.actualPour}m³</div></div>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded font-bold" style={{ background:clColor[d.chlorideGrade]+'20', color:clColor[d.chlorideGrade] }}>염화물 {d.chlorideGrade} ({d.chloride})</span>
                  <span className="text-xs px-2 py-1 rounded" style={{ background:d.transportGrade==='적합'?'#22C55E20':'#EF444420', color:d.transportGrade==='적합'?'#22C55E':'#EF4444' }}>{d.transport}분 {d.transportGrade}</span>
                </div>
              </div>
              {d.chlorideGrade === 'RED' && <div className="mt-2 p-2 rounded text-xs font-bold" style={{ background:'#EF444420', color:'#EF4444' }}>⚠ 타설 중단 — 염화물 기준 초과 ({'>'} 0.30 kg/m³)</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'curing' && (
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#00D9CC' }}>양생 관리</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2"><span style={{ color:'#94A3B8' }}>양생 진행률</span><span className="font-mono" style={{ color:'#00D9CC' }}>{elapsed}/{curingDays}일</span></div>
            <div className="h-4 rounded-full overflow-hidden" style={{ background:'#1E293B' }}>
              <div className="h-full rounded-full transition-all" style={{ width:`${elapsed/curingDays*100}%`, background:'#00D9CC' }} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm">
            <div className="p-3 rounded" style={{ background:'#111B2A' }}><div className="text-xs" style={{ color:'#64748B' }}>콘크리트</div><div>보통콘크리트</div></div>
            <div className="p-3 rounded" style={{ background:'#111B2A' }}><div className="text-xs" style={{ color:'#64748B' }}>시멘트</div><div>보통포틀랜드</div></div>
            <div className="p-3 rounded" style={{ background:'#111B2A' }}><div className="text-xs" style={{ color:'#64748B' }}>양생모드</div><div style={{ color:'#F0A500' }}>간절기 (7일)</div></div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-3xl font-mono font-bold" style={{ color:'#F0A500' }}>D-{curingDays - elapsed}</div>
            <div className="text-xs mt-1" style={{ color:'#64748B' }}>양생 완료까지</div>
          </div>
        </div>
      )}
    </div>
  );
}
