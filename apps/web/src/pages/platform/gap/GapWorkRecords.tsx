export default function GapWorkRecords() {
  const mock = [
    { site: '파주 OO현장', orders: [
      { id: 'INST-001', type: '설치', status: '작업완료', reports: [
        { id: 'SD-001', weather: '맑음', photos: 3, gps: '37.7°N 126.9°E' },
      ], checks: [{ id: 'SC-001', result: '통과', cycle: '일일' }] },
    ]},
  ];
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">작업기록 조회</h1>
      <p className="text-xs mb-4" style={{ color: '#64748B' }}>현장별 → 작업지시 → 시공일보 → 안전점검 계층 뷰</p>
      {mock.map(s => (
        <div key={s.site} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-5 mb-4">
          <h2 className="font-semibold mb-3" style={{ color: '#F0A500' }}>{s.site}</h2>
          {s.orders.map(o => (
            <div key={o.id} className="ml-4 mb-3" style={{ borderLeft: '2px solid #334155', paddingLeft: 12 }}>
              <div className="text-sm font-medium">{o.id} · {o.type} · <span style={{ color: '#22C55E' }}>{o.status}</span></div>
              {o.reports.map(r => (
                <div key={r.id} className="ml-4 mt-2 text-xs" style={{ color: '#94A3B8' }}>
                  📋 {r.id} — {r.weather} · 사진 {r.photos}장 · GPS {r.gps}
                </div>
              ))}
              {o.checks.map(c => (
                <div key={c.id} className="ml-4 mt-1 text-xs" style={{ color: '#94A3B8' }}>
                  ✅ {c.id} — {c.result} ({c.cycle})
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
