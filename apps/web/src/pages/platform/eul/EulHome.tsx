import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api';
const fmt = (n: number) => n?.toLocaleString('ko-KR') ?? '-';

export default function EulHome() {
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  useEffect(() => {
    api.get('/api/platform/work-orders').then(r => setOrders(r.data?.data || [])).catch(() => setOrders([
      { workId:'INST-001', workType:'설치', currentStatus:'작업대기', workLengthM:250 },
      { workId:'INST-002', workType:'해체', currentStatus:'호출중', workLengthM:160 },
      { workId:'INST-003', workType:'설치', currentStatus:'작업완료', workLengthM:100 },
    ]));
    api.get('/api/quotes?year=2026').then(r => setQuotes(r.data?.records || [])).catch(() => {});
  }, []);

  const statusCount = (s: string) => orders.filter(o => o.currentStatus === s).length;

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">을 대시보드</h1>
        <span className="text-xs" style={{ color:'#64748B' }}>{new Date().toLocaleDateString('ko-KR')}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label:'작업지시', value:`${orders.length}건`, color:'#00D9CC', link:'/platform/eul/work-orders' },
          { label:'호출중', value:`${statusCount('호출중')}건`, color:'#F0A500', link:'/platform/eul/calls' },
          { label:'작업중', value:`${statusCount('작업중')+statusCount('작업대기')}건`, color:'#22C55E', link:'/platform/eul/work-orders' },
          { label:'견적 저장', value:`${quotes.length}건`, color:'#3B82F6', link:'/quotes' },
        ].map(s => (
          <Link key={s.label} to={s.link} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-5 hover:opacity-80">
            <div className="text-xs mb-1" style={{ color:'#64748B' }}>{s.label}</div>
            <div className="text-2xl font-mono font-bold" style={{ color:s.color }}>{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#00D9CC' }}>최근 작업지시</h2>
          {orders.slice(0,4).map(o => {
            const sc: Record<string,string> = { 지시생성:'#64748B', 호출중:'#F0A500', 작업대기:'#00D9CC', 작업중:'#22C55E', 작업완료:'#10B981', 봉인완료:'#8B5CF6' };
            return (
              <div key={o.workId} className="flex justify-between items-center py-2" style={{ borderBottom:'1px solid #1E293B' }}>
                <div><div className="text-sm">{o.workId} · {o.workType} · {o.workLengthM}M</div></div>
                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background:(sc[o.currentStatus]||'#64748B')+'20', color:sc[o.currentStatus]||'#64748B' }}>{o.currentStatus}</span>
              </div>
            );
          })}
        </div>

        <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#00D9CC' }}>견적 연동</h2>
          {quotes.length > 0 ? quotes.slice(0,3).map((q: any) => (
            <div key={q.id} className="flex justify-between items-center py-2" style={{ borderBottom:'1px solid #1E293B' }}>
              <div className="text-sm">{q.projectName || q.input?.panel+' '+q.input?.length+'M'}</div>
              <span className="text-sm font-mono" style={{ color:'#00D9CC' }}>{fmt(q.result?.finalTotal)}원</span>
            </div>
          )) : (
            <div className="py-4 text-center">
              <p className="text-sm mb-2" style={{ color:'#64748B' }}>견적 데이터 없음</p>
              <Link to="/quote/new" className="text-xs px-4 py-2 rounded inline-block" style={{ background:'#00D9CC', color:'#070C12' }}>견적 시작</Link>
            </div>
          )}
        </div>
      </div>

      <div style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color:'#00D9CC' }}>빠른 작업</h2>
        <div className="flex gap-3 flex-wrap">
          <Link to="/platform/eul/work-orders" className="px-4 py-2 rounded text-sm font-semibold" style={{ background:'#00D9CC', color:'#070C12' }}>+ 작업지시</Link>
          <Link to="/platform/eul/calls" className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>📡 호출매칭</Link>
          <Link to="/platform/eul/equipment" className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>🚜 장비검증</Link>
          <Link to="/platform/eul/contracts" className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>✍ 간편서명</Link>
          <Link to="/platform/eul/remicon" className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>🏗 레미콘</Link>
          <Link to="/quote/new" className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>📐 견적엔진</Link>
          <Link to="/contractor/requests" className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>📨 견적응답</Link>
        </div>
      </div>
    </div>
  );
}
