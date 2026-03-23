import { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';

const ROUTES = [
  { key:'정회원', desc:'정회원 병 사용자 선택 → 앱 내 서명', color:'#00D9CC', fields:['workerUserId'] },
  { key:'간편대면', desc:'현장 대면 터치서명 (GPS+시각 자동)', color:'#3B82F6', fields:['workerName','guestPhone','guestBirth'] },
  { key:'간편원격', desc:'SMS 링크 발송 → 원격 서명', color:'#F0A500', fields:['workerName','guestPhone'] },
  { key:'소개소경유', desc:'직업소개소 경유 계약', color:'#8B5CF6', fields:['workerName','guestPhone','agencyPartyId'] },
];

const FIELD_LABELS: Record<string,string> = {
  workerUserId:'병 사용자 ID', workerName:'이름', guestPhone:'전화번호',
  guestBirth:'생년월일', agencyPartyId:'소개소 주체ID',
};

export default function EulContracts() {
  const [selected, setSelected] = useState<string|null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string,string>>({});
  const [siteId, setSiteId] = useState('');
  const [amount, setAmount] = useState('350000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [proxyForm, setProxyForm] = useState({ contractId:'', proxyUserId:'', proxyRole:'관리감독자' });
  const [linkForm, setLinkForm] = useState({ contractId:'', workerUserId:'' });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  const fetchContracts = async () => {
    try {
      const res = await api.get('/api/platform/contracts');
      setContracts(res.data?.items || []);
    } catch {}
  };

  useEffect(() => { fetchContracts(); }, []);

  // 터치 서명 캔버스
  const startDraw = (e: React.MouseEvent|React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent|React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.strokeStyle = '#00D9CC'; ctx.lineWidth = 2; ctx.lineTo(x, y); ctx.stroke();
  };
  const endDraw = () => setDrawing(false);

  const handleSign = async () => {
    setLoading(true);
    try {
      // 1. 계약 생성
      const createRes = await api.post('/api/platform/contracts', {
        signRoute: selected,
        workerName: formData.workerName || '정회원',
        workerUserId: formData.workerUserId,
        guestPhone: formData.guestPhone,
        guestBirth: formData.guestBirth,
        agencyPartyId: formData.agencyPartyId,
        siteId,
        amount: Number(amount),
        contractType: '프리랜서',
      });
      const contractId = createRes.data?.contractId;

      // 2. 서명 경로별 후속 처리
      if (selected === '간편대면' || selected === '정회원') {
        await api.post(`/api/platform/contracts/${contractId}/sign-face`, {
          gpsLat: 37.5665, gpsLng: 126.9780, // GPS 자동 수집
          workerSignGps: '37.5665,126.9780',
        });
      } else if (selected === '간편원격') {
        const linkRes = await api.post(`/api/platform/contracts/${contractId}/send-link`, {
          guestPhone: formData.guestPhone,
          guestName: formData.workerName,
        });
        setResult({ ...createRes.data, linkUrl: linkRes.data?.linkUrl });
        setLoading(false);
        return;
      }

      setResult(createRes.data);
    } catch (e: any) {
      alert(e?.response?.data?.error || '계약 생성 실패');
    }
    setLoading(false);
  };

  const handleSignProxy = async () => {
    try {
      await api.post(`/api/platform/contracts/${proxyForm.contractId}/sign-proxy`, {
        proxyUserId: proxyForm.proxyUserId,
        proxyRole: proxyForm.proxyRole,
      });
      alert('대행자 서명 완료');
      setProxyForm({ contractId:'', proxyUserId:'', proxyRole:'관리감독자' });
      fetchContracts();
    } catch (e: any) { alert(e?.response?.data?.error || '실패'); }
  };

  const handleLinkMember = async () => {
    try {
      await api.patch(`/api/platform/contracts/${linkForm.contractId}/link-member`, {
        workerUserId: linkForm.workerUserId,
      });
      alert('정회원 전환 완료');
      setLinkForm({ contractId:'', workerUserId:'' });
      fetchContracts();
    } catch (e: any) { alert(e?.response?.data?.error || '실패'); }
  };

  return (
    <div className="p-4 md:p-8" style={{ background:'#070C12', minHeight:'100vh', color:'#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-6">간편서명</h1>

      {/* 기존 계약 목록 */}
      {contracts.length > 0 && !selected && !result && (
        <div className="mb-8">
          <h2 className="text-sm font-bold mb-3" style={{ color:'#94A3B8' }}>계약 이력 ({contracts.length}건)</h2>
          <div className="space-y-2 mb-6">
            {contracts.slice(0,5).map((c: any) => (
              <div key={c.contractId} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">{c.sealId?'🔒 ':''}{c.contractId} · {c.contractType} · {c.signRoute || '-'}</div>
                  <div className="text-xs mt-1" style={{ color:'#64748B' }}>{c.workerName} · {c.amount?.toLocaleString()}원 · {c.status}</div>
                </div>
                {c.sealId && <span className="text-xs px-2 py-1 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>🔒 봉인</span>}
              </div>
            ))}
          </div>

          {/* 대행자 서명 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-lg" style={{ background:'#0C1520', border:'1px solid #F0A500' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color:'#F0A500' }}>대행자기기 서명</h3>
              <input placeholder="계약 ID (LC-...)" value={proxyForm.contractId} onChange={e => setProxyForm({...proxyForm, contractId: e.target.value})}
                className="w-full px-3 py-2 rounded text-sm mb-2" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} />
              <input placeholder="대행자 ID" value={proxyForm.proxyUserId} onChange={e => setProxyForm({...proxyForm, proxyUserId: e.target.value})}
                className="w-full px-3 py-2 rounded text-sm mb-2" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} />
              <select value={proxyForm.proxyRole} onChange={e => setProxyForm({...proxyForm, proxyRole: e.target.value})}
                className="w-full px-3 py-2 rounded text-sm mb-2" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }}>
                {['관리감독자','팀장','현장소장','기타'].map(r => <option key={r}>{r}</option>)}
              </select>
              <button onClick={handleSignProxy} className="w-full py-2 rounded text-sm font-bold" style={{ background:'#F0A500', color:'#070C12' }}>대행 서명</button>
            </div>

            {/* 비회원→정회원 전환 */}
            <div className="p-4 rounded-lg" style={{ background:'#0C1520', border:'1px solid #8B5CF6' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color:'#8B5CF6' }}>비회원→정회원 전환</h3>
              <input placeholder="계약 ID (LC-...)" value={linkForm.contractId} onChange={e => setLinkForm({...linkForm, contractId: e.target.value})}
                className="w-full px-3 py-2 rounded text-sm mb-2" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} />
              <input placeholder="정회원 사용자 ID" value={linkForm.workerUserId} onChange={e => setLinkForm({...linkForm, workerUserId: e.target.value})}
                className="w-full px-3 py-2 rounded text-sm mb-2" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} />
              <button onClick={handleLinkMember} className="w-full py-2 rounded text-sm font-bold" style={{ background:'#8B5CF6', color:'#fff' }}>전환</button>
            </div>
          </div>
        </div>
      )}

      {/* 경로 선택 */}
      {!selected && !result ? (
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color:'#94A3B8' }}>새 계약 생성 — 서명 경로 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROUTES.map(r => (
              <button key={r.key} onClick={() => { setSelected(r.key); setFormData({}); }} className="rounded-lg p-6 text-left transition-all hover:opacity-90"
                style={{ background:'#0C1520', border:`2px solid ${r.color}` }}>
                <div className="font-bold text-lg mb-2" style={{ color:r.color }}>{r.key}</div>
                <div className="text-sm" style={{ color:'#94A3B8' }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : result ? (
        <div style={{ background:'#0C1520', border:'1px solid #22C55E' }} className="rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <div className="text-lg font-bold mb-2">계약 완료</div>
          <div className="text-sm mb-1" style={{ color:'#94A3B8' }}>계약ID: {result.contractId} · 서명경로: {selected}</div>
          <div className="text-sm mb-1" style={{ color:'#22C55E' }}>사본교부여부: Y (근로기준법§17 의무)</div>
          {result.linkUrl && <div className="text-xs mt-2 p-2 rounded" style={{ background:'#111B2A', color:'#F0A500' }}>서명 링크: {result.linkUrl}</div>}
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => { setSelected(null); setResult(null); fetchContracts(); }} className="px-4 py-2 rounded text-sm" style={{ border:'1px solid #334155', color:'#94A3B8' }}>새 계약</button>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="text-sm mb-4 hover:underline" style={{ color:'#64748B' }}>← 경로 선택으로</button>
          <div style={{ background:'#0C1520', border:`1px solid ${ROUTES.find(r=>r.key===selected)?.color||'#1E293B'}` }} className="rounded-lg p-6">
            <h2 className="font-bold mb-4" style={{ color:ROUTES.find(r=>r.key===selected)?.color }}>{selected} 서명</h2>
            <div className="space-y-4 mb-6">
              {ROUTES.find(r=>r.key===selected)?.fields.map(f => (
                <div key={f}><label className="text-xs block mb-1" style={{ color:'#64748B' }}>{FIELD_LABELS[f]||f}</label>
                <input value={formData[f]||''} onChange={e => setFormData({...formData, [f]: e.target.value})}
                  className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
              ))}
              <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>현장 ID</label>
              <input value={siteId} onChange={e => setSiteId(e.target.value)} placeholder="SITE-NNNNNN"
                className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
              <div><label className="text-xs block mb-1" style={{ color:'#64748B' }}>일당/금액</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} /></div>
            </div>

            {(selected === '간편대면' || selected === '정회원') && (
              <div className="mb-6">
                <div className="text-xs mb-2" style={{ color:'#64748B' }}>터치 서명</div>
                <canvas ref={canvasRef} width={400} height={128}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                  className="w-full rounded cursor-crosshair" style={{ background:'#111B2A', border:'2px dashed #334155' }} />
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 text-xs" style={{ color:'#F0A500' }}>
              <input type="checkbox" defaultChecked style={{ accentColor:'#F0A500' }} />
              <span>사본교부 (근로기준법§17 의무)</span>
            </div>
            <button onClick={handleSign} disabled={loading} className="px-6 py-3 rounded font-bold text-sm"
              style={{ background: loading ? '#334155' : '#00D9CC', color:'#070C12' }}>
              {loading ? '처리 중...' : '계약 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
