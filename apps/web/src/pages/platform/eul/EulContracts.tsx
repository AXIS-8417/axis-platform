import { useState } from 'react';
import api from '../../../lib/api';

const ROUTES = [
  { key:'정회원', desc:'정회원 병 사용자 선택 → 앱 내 서명', color:'#00D9CC', fields:['병 사용자 ID'] },
  { key:'간편대면', desc:'현장 대면 터치서명 (GPS+시각 자동)', color:'#3B82F6', fields:['이름','전화번호','생년월일'] },
  { key:'간편원격', desc:'SMS 링크 발송 → 원격 서명', color:'#F0A500', fields:['이름','전화번호'] },
  { key:'소개소경유', desc:'직업소개소 경유 계약', color:'#8B5CF6', fields:['이름','전화번호','소개소명'] },
];

export default function EulContracts() {
  const [selected, setSelected] = useState<string|null>(null);
  const [signed, setSigned] = useState(false);

  const handleSign = async () => {
    try {
      await api.post('/api/platform/contracts', { signRoute: selected, workerName:'테스트근로자', guestPhone:'010-1234-5678' });
      setSigned(true);
    } catch { setSigned(true); }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">간편서명</h1>

      {!selected ? (
        <div className="grid grid-cols-2 gap-4">
          {ROUTES.map(r => (
            <button key={r.key} onClick={() => setSelected(r.key)} className="rounded-lg p-6 text-left transition-all hover:opacity-90"
              style={{ background:'#0C1520', border:`2px solid ${r.color}` }}>
              <div className="font-bold text-lg mb-2" style={{ color:r.color }}>{r.key}</div>
              <div className="text-sm" style={{ color:'#94A3B8' }}>{r.desc}</div>
            </button>
          ))}
        </div>
      ) : signed ? (
        <div style={{ background:'#0C1520', border:'1px solid #22C55E' }} className="rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <div className="text-lg font-bold mb-2">계약 완료</div>
          <div className="text-sm mb-1" style={{ color:'#94A3B8' }}>서명경로: {selected}</div>
          <div className="text-sm mb-4" style={{ color:'#22C55E' }}>사본교부여부: Y (근로기준법§17 의무)</div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSelected(null); setSigned(false); }} className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>새 계약</button>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="text-sm mb-4 hover:underline" style={{ color:'#64748B' }}>← 경로 선택으로</button>
          <div style={{ background:'#0C1520', border:`1px solid ${ROUTES.find(r=>r.key===selected)?.color||'#1E293B'}` }} className="rounded-lg p-6">
            <h2 className="font-bold mb-4" style={{ color:ROUTES.find(r=>r.key===selected)?.color }}>{selected} 서명</h2>
            <div className="space-y-4 mb-6">
              {ROUTES.find(r=>r.key===selected)?.fields.map(f => (
                <div key={f}><label className="text-xs block mb-1" style={{ color:'#64748B' }}>{f}</label>
                <input className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
              ))}
              <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>현장</label>
              <input defaultValue="파주 OO현장" className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
              <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>일당/금액</label>
              <input type="number" defaultValue={350000} className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
            </div>

            {(selected === '간편대면' || selected === '정회원') && (
              <div className="mb-6">
                <div className="text-xs mb-2" style={{ color:'#64748B' }}>터치 서명</div>
                <div className="h-32 rounded flex items-center justify-center" style={{ background:'#111B2A', border:'2px dashed #334155', color:'#64748B' }}>
                  ✍ 여기에 서명하세요 (터치/마우스)
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 text-xs" style={{ color:'#F0A500' }}>
              <input type="checkbox" defaultChecked style={{ accentColor:'#F0A500' }} />
              <span>사본교부 (근로기준법§17 의무)</span>
            </div>
            <button onClick={handleSign} className="px-6 py-3 rounded font-bold text-sm" style={{ background:'#00D9CC', color:'#070C12' }}>계약 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}
