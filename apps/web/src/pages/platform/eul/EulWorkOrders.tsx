import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function EulWorkOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  useEffect(() => { api.get('/api/platform/work-orders').then(r => setOrders(r.data?.data || [])).catch(() => {
    setOrders([
      { workId:'INST-001', workType:'설치', panelType:'RPP', currentStatus:'작업대기', workLengthM:250, siteId:'SITE-001' },
      { workId:'INST-002', workType:'해체', panelType:'스틸', currentStatus:'호출중', workLengthM:160, siteId:'SITE-002' },
    ]);
  }); }, []);

  const statusColor: Record<string,string> = { 지시생성:'#64748B', 호출중:'#F0A500', 매칭완료:'#3B82F6', 작업대기:'#00D9CC', 작업중:'#22C55E', 작업완료:'#10B981', 봉인완료:'#8B5CF6' };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">작업지시</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background:'#00D9CC', color:'#070C12' }}>+ 작업지시 생성</button>
      </div>
      {showCreate && (
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#00D9CC' }}>새 작업지시</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {['현장','작업유형','판넬','경간(M)','기초','연장(M)'].map(f => (
              <div key={f}><label className="text-xs mb-1 block" style={{ color:'#64748B' }}>{f}</label>
              <input className="w-full px-3 py-2 rounded" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
            ))}
          </div>
          <button className="mt-4 px-6 py-2 rounded text-sm font-bold" style={{ background:'#00D9CC', color:'#070C12' }}>생성</button>
        </div>
      )}
      <div className="space-y-2">
        {orders.map(o => (
          <div key={o.workId} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{o.workId} · {o.workType} · {o.panelType} · {o.workLengthM}M</div>
              <div className="text-xs mt-1" style={{ color:'#64748B' }}>{o.siteId}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded font-mono" style={{ background:(statusColor[o.currentStatus]||'#64748B')+'20', color:statusColor[o.currentStatus]||'#64748B' }}>{o.currentStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
