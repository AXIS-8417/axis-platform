export default function ByeongContracts() {
  const contracts = [
    { contractId:'LC-001', contractType:'프리랜서', amount:350000, startDate:'2026-03-15', signMethod:'간편대면', sealId:'SEAL-010' },
    { contractId:'LC-002', contractType:'일용직', amount:280000, startDate:'2026-03-18', signMethod:'정회원', sealId:null },
  ];
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">근로계약</h1>
      <div className="mb-6 p-4 rounded-lg" style={{ background:'#3B82F615', border:'1px solid #3B82F640', color:'#3B82F6' }}>
        <div className="text-sm font-semibold">본 근로계약 내용은 을·병 당사자만 열람 가능합니다.</div>
        <div className="text-xs mt-1 opacity-80">갑(발주자)에게는 제공되지 않습니다.</div>
      </div>
      <div className="space-y-2">
        {contracts.map(c => (
          <div key={c.contractId} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">{c.sealId?'🔒 ':''}{c.contractId} · {c.contractType} · {c.signMethod}</div>
              <div className="text-xs mt-1" style={{ color:'#64748B' }}>{c.startDate} · {c.amount?.toLocaleString()}원</div>
            </div>
            {c.sealId && <span className="text-xs px-2 py-1 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>🔒 봉인</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
