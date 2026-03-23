import { useState } from 'react';
import api from '../../../lib/api';

export default function EulEquipment() {
  const [validation, setValidation] = useState<any>(null);
  const [tab, setTab] = useState<'list'|'survey'>('list');

  const equips = [
    { equipId:'EQ-001', equipType:'굴착기', tonnage:'0.7톤', regNo:'경기02더5775', manufacturer:'두산', mfgYear:2021, driveType:'무한궤도식', chassisNo:'DX55-12345' },
    { equipId:'EQ-002', equipType:'크레인', tonnage:'25톤', regNo:'서울03마1234', manufacturer:'타다노', mfgYear:2019, driveType:'타이어식', chassisNo:'GR-250N-67890' },
  ];

  const ITEMS = ['장비 정기검사 유효','장비 내구연한','건설기계등록증','보험 가입','조종사 면허 유효','특별교육 이수','기초안전보건교육','건설기계조종사안전교육','특수형태근로종사자교육','작업지휘자 배정(§39)','유도자 배정(§40)','사전조사 봉인','방호장치 점검 완료'];

  const handleValidate = async (id: string) => {
    try { const { data } = await api.post(`/api/platform/equipment/${id}/validate`); setValidation(data); }
    catch { setValidation({ passed:false, items: ITEMS.map((name,i) => ({ id:i+1, name, status:i===11?'FAIL':'PASS', reason:i===11?'사전조사 미완료':undefined })) }); }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex gap-3 mb-6">
        <h1 className="text-xl font-bold flex-1">건설기계</h1>
        {['list','survey'].map((t,i) => <button key={t} onClick={() => setTab(t as any)} className="px-4 py-2 rounded-lg text-sm" style={{ background:tab===t?'#00D9CC20':'#0C1520', color:tab===t?'#00D9CC':'#64748B', border:`1px solid ${tab===t?'#00D9CC':'#1E293B'}` }}>{['장비 목록','사전조사'][i]}</button>)}
      </div>

      {tab === 'list' && <>
        <div className="space-y-2 mb-6">
          {equips.map(e => (
            <div key={e.equipId} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <div><div className="font-semibold">{e.equipType} {e.tonnage}</div><div className="text-xs mt-1" style={{ color:'#64748B' }}>{e.regNo} · {e.chassisNo}</div></div>
                <button onClick={() => handleValidate(e.equipId)} className="px-4 py-2 rounded text-sm font-bold" style={{ background:'#00D9CC', color:'#070C12' }}>투입 검증</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs" style={{ color:'#94A3B8' }}><div>제조사: {e.manufacturer}</div><div>제작: {e.mfgYear}</div><div>구동: {e.driveType}</div><div>차대: {e.chassisNo}</div></div>
            </div>
          ))}
        </div>
        {validation && (
          <div style={{ background:'#0C1520', border:`1px solid ${validation.passed?'#22C55E':'#EF4444'}` }} className="rounded-lg p-6">
            <h2 className="font-bold mb-4" style={{ color:validation.passed?'#22C55E':'#EF4444' }}>{validation.passed?'✅ 투입 가능':'❌ 투입 불가 — 1개 이상 FAIL'}</h2>
            {!validation.passed && <div className="mb-4 p-3 rounded text-sm" style={{ background:'#EF444415', color:'#EF4444' }}>1개라도 FAIL이면 작업 시작이 차단됩니다.</div>}
            <div className="space-y-1">{validation.items?.map((it:any) => (
              <div key={it.id} className="flex items-center gap-2 py-1.5 text-sm" style={{ borderBottom:'1px solid #1E293B' }}>
                <span style={{ color:it.status==='PASS'?'#22C55E':'#EF4444' }}>{it.status==='PASS'?'✅':'❌'}</span>
                <span className="flex-1" style={{ color:'#94A3B8' }}>{it.id}. {it.name}</span>
                <span className="text-xs" style={{ color:it.status==='PASS'?'#22C55E':'#EF4444' }}>{it.status}</span>
                {it.reason && <span className="text-xs" style={{ color:'#F0A500' }}>({it.reason})</span>}
              </div>
            ))}</div>
          </div>
        )}
      </>}

      {tab === 'survey' && (
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#00D9CC' }}>사전조사 등록 (27항목)</h2>
          <div className="mb-4"><div className="text-xs font-semibold mb-2" style={{ color:'#F0A500' }}>지하매설물 6종</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{['가스관','통신선','전력선','상수도','하수도','기타'].map(l => (
              <label key={l} className="flex items-center gap-2 text-sm" style={{ color:'#94A3B8' }}>
                <select className="px-2 py-1 rounded text-xs" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }}><option>해당</option><option>비해당</option><option>확인불가</option></select>{l}
              </label>
            ))}</div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">{[['지반종류','토사/암반/혼합'],['지반상태','견고/연약/동결'],['배수상태','양호/불량'],['보강방법','철판설치/지반개량/양질토사']].map(([l,h]) => (
            <div key={l}><label className="text-xs block mb-1" style={{ color:'#64748B' }}>{l}</label><input placeholder={h} className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
          ))}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>소요지내력(kN/m²)</label><input type="number" className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div><div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>실측지내력(kN/m²)</label><input type="number" className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div></div>
          <div className="flex gap-3 mb-4">{['가공선로 존재','장애물 존재','관계기관 입회'].map(c => <label key={c} className="flex items-center gap-2 text-sm" style={{ color:'#94A3B8' }}><input type="checkbox" style={{ accentColor:'#00D9CC' }} />{c}</label>)}</div>
          <button className="px-6 py-2 rounded font-bold text-sm" style={{ background:'#00D9CC', color:'#070C12' }}>사전조사 등록 및 봉인</button>
        </div>
      )}
    </div>
  );
}
