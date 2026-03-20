import { useState } from 'react';
import api from '../../../lib/api';
export default function EulEquipment() {
  const [validation, setValidation] = useState<any>(null);
  const equips = [
    { equipId:'EQ-001', equipType:'굴착기', tonnage:'0.7톤', regNo:'경기02더5775', isActive:true },
    { equipId:'EQ-002', equipType:'크레인', tonnage:'25톤', regNo:'서울03마1234', isActive:true },
  ];
  const handleValidate = async (id: string) => {
    try { const { data } = await api.post(`/api/platform/equipment/${id}/validate`); setValidation(data); }
    catch { setValidation({ passed:false, items: Array.from({length:13},(_,i) => ({ id:i+1, name:`검증항목 ${i+1}`, status: Math.random()>0.3?'PASS':'FAIL' })) }); }
  };
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">건설기계</h1>
      <div className="space-y-2 mb-6">
        {equips.map(e => (
          <div key={e.equipId} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4 flex justify-between items-center">
            <div><div className="text-sm font-medium">{e.equipType} {e.tonnage}</div><div className="text-xs mt-1" style={{ color:'#64748B' }}>{e.regNo} · {e.equipId}</div></div>
            <button onClick={() => handleValidate(e.equipId)} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background:'#00D9CC', color:'#070C12' }}>투입 검증</button>
          </div>
        ))}
      </div>
      {validation && (
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: validation.passed?'#22C55E':'#EF4444' }}>{validation.passed?'✅ 투입 가능':'❌ 투입 불가'}</h2>
          <div className="grid grid-cols-2 gap-2">
            {validation.items?.map((it: any) => (
              <div key={it.id} className="flex items-center gap-2 text-xs py-1">
                <span style={{ color: it.status==='PASS'?'#22C55E':'#EF4444' }}>{it.status==='PASS'?'✅':'❌'}</span>
                <span style={{ color:'#94A3B8' }}>{it.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
