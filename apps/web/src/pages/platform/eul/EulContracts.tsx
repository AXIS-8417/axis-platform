const routes = [
  { key:'정회원', desc:'정회원 병 사용자 선택', color:'#00D9CC' },
  { key:'간편대면', desc:'현장 대면 터치서명 (GPS+시각 자동)', color:'#3B82F6' },
  { key:'간편원격', desc:'SMS 링크 발송 → 원격 서명', color:'#F0A500' },
  { key:'소개소경유', desc:'직업소개소 경유 계약', color:'#8B5CF6' },
];
export default function EulContracts() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">간편서명</h1>
      <div className="grid grid-cols-2 gap-4">
        {routes.map(r => (
          <div key={r.key} className="rounded-lg p-6 cursor-pointer hover:opacity-90 transition-opacity" style={{ background:'#0C1520', border:`2px solid ${r.color}` }}>
            <div className="font-bold text-lg mb-2" style={{ color:r.color }}>{r.key}</div>
            <div className="text-sm" style={{ color:'#94A3B8' }}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
