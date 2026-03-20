export default function GapDocuments() {
  const docs = [
    { type: '건설업등록증', party: '을사', status: '유효', expiry: '2027-12-31' },
    { type: '산재보험', party: '을사', status: '유효', expiry: '2026-12-31' },
    { type: '고용보험', party: '을사', status: '유효', expiry: '2026-12-31' },
    { type: '조종사면허', party: '병팀', status: '유효', expiry: '2028-03-15' },
    { type: '안전교육확인서', party: '병팀', status: '유효', expiry: '2026-09-30' },
  ];
  const statusColor = (s: string) => s === '유효' ? '#22C55E' : s === '만료' ? '#EF4444' : '#64748B';

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">서류 조회</h1>
      {/* 근로계약 차단 경고 */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: '#EF444420', border: '1px solid #EF4444', color: '#EF4444' }}>
        <div className="font-bold text-sm mb-1">⚠ 근로계약 — 갑 조회 불가</div>
        <div className="text-xs">근로기준법에 의해 갑(발주자)은 을·병 간 근로계약 내용을 열람할 수 없습니다.</div>
      </div>
      <div className="space-y-2">
        {docs.map((d, i) => (
          <div key={i} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{d.type}</div>
              <div className="text-xs mt-1" style={{ color: '#64748B' }}>{d.party} · 만료 {d.expiry}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ background: statusColor(d.status) + '20', color: statusColor(d.status) }}>{d.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
