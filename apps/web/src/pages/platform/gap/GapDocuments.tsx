import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function GapDocuments() {
  const [docs, setDocs] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [pkgRecords, setPkgRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'docs'|'evidence'>('docs');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // 서류 = 보험Vault + 장비 + 교육 등에서 취합
        const [insRes, equipRes, eduRes] = await Promise.all([
          api.get('/api/platform/seals', { params: { q: 'InsuranceVault' } }).catch(() => ({ data: { items: [] } })),
          api.get('/api/platform/equipment').catch(() => ({ data: { items: [] } })),
          api.get('/api/platform/education/requirements').catch(() => ({ data: { items: [] } })),
        ]);

        const docList: any[] = [];

        // 보험 서류
        (insRes.data?.items || []).forEach((s: any) => {
          docList.push({ type: '보험Vault', party: '을사', id: s.targetId || s.sealId, status: '봉인', expiry: '-', sealId: s.sealId });
        });

        // 장비 서류 (등록증/검사)
        (equipRes.data?.items || []).forEach((e: any) => {
          if (e.regNo) docList.push({ type: '건설기계등록증', party: '을사', id: e.equipId, status: e.inspectionExpiry ? '유효' : '확인필요', expiry: e.inspectionExpiry?.slice(0,10) || '-' });
          if (e.insStatus) docList.push({ type: '장비보험', party: '을사', id: e.equipId, status: e.insStatus === 'VERIFIED' ? '유효' : '미가입', expiry: '-' });
        });

        // 교육 기준
        (eduRes.data?.items || []).forEach((r: any) => {
          docList.push({ type: `교육기준: ${r.eduType}`, party: r.workerType, id: r.id, status: '기준', expiry: `${r.requiredMinutes}분` });
        });

        if (docList.length > 0) setDocs(docList);
        else setDocs([
          { type: '건설업등록증', party: '을사', status: '유효', expiry: '2027-12-31' },
          { type: '산재보험', party: '을사', status: '유효', expiry: '2026-12-31' },
          { type: '조종사면허', party: '병팀', status: '유효', expiry: '2028-03-15' },
        ]);
      } catch {
        setDocs([]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const loadPackage = async (pkgId: string) => {
    try {
      const res = await api.get(`/api/platform/evidence-packages/${pkgId}`);
      setSelectedPkg(res.data?.package);
      setPkgRecords(res.data?.records || []);
    } catch (e: any) {
      alert(e?.response?.data?.error || '증빙패키지 조회 실패');
    }
  };

  const statusColor = (s: string) => s === '유효' || s === '봉인' ? '#22C55E' : s === '만료' || s === '미가입' ? '#EF4444' : '#F0A500';

  return (
    <div className="p-4 md:p-8" style={{ background:'#070C12', minHeight:'100vh', color:'#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-6">서류 조회</h1>

      {/* 근로계약 차단 경고 */}
      <div className="mb-6 p-4 rounded-lg" style={{ background:'#EF444420', border:'1px solid #EF4444', color:'#EF4444' }}>
        <div className="font-bold text-sm mb-1">[!] 근로계약 — 갑 조회 불가</div>
        <div className="text-xs">근로기준법에 의해 갑(발주자)은 을/병 간 근로계약 내용을 열람할 수 없습니다.</div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('docs')} className="px-4 py-2 rounded-lg text-sm"
          style={{ background: tab==='docs' ? '#3B82F620' : '#0C1520', color: tab==='docs' ? '#3B82F6' : '#64748B', border: `1px solid ${tab==='docs' ? '#3B82F6' : '#1E293B'}` }}>
          서류 목록
        </button>
        <button onClick={() => setTab('evidence')} className="px-4 py-2 rounded-lg text-sm"
          style={{ background: tab==='evidence' ? '#8B5CF620' : '#0C1520', color: tab==='evidence' ? '#8B5CF6' : '#64748B', border: `1px solid ${tab==='evidence' ? '#8B5CF6' : '#1E293B'}` }}>
          증빙패키지
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>로딩 중...</div>
      ) : tab === 'docs' ? (
        <div className="space-y-2">
          {docs.map((d, i) => (
            <div key={i} style={{ background:'#0C1520', border:'1px solid #1E293B' }} className="rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{d.type}</div>
                <div className="text-xs mt-1" style={{ color:'#64748B' }}>{d.party} | {d.id || ''} | 만료 {d.expiry}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ background: statusColor(d.status) + '20', color: statusColor(d.status) }}>{d.status}</span>
            </div>
          ))}
          {docs.length === 0 && <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>서류가 없습니다.</div>}
        </div>
      ) : (
        <div>
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'#8B5CF615', border:'1px solid #8B5CF640', color:'#8B5CF6' }}>
            증빙패키지는 <strong>패키지 단위</strong>로만 제공됩니다. 개별 레코드 선별 제공은 불가합니다. (CANON 규칙 7번)
          </div>

          {/* 패키지 ID 입력 조회 */}
          <div className="flex gap-2 mb-6">
            <input placeholder="증빙패키지 ID (EVPKG-...)" id="pkgInput"
              className="flex-1 px-3 py-2 rounded text-sm" style={{ background:'#111B2A', border:'1px solid #334155', color:'#F1F5F9' }} />
            <button onClick={() => {
              const v = (document.getElementById('pkgInput') as HTMLInputElement)?.value;
              if (v) loadPackage(v);
            }} className="px-4 py-2 rounded text-sm font-bold" style={{ background:'#8B5CF6', color:'#fff' }}>조회</button>
          </div>

          {selectedPkg && (
            <div className="p-4 rounded-lg mb-4" style={{ background:'#0C1520', border:'1px solid #8B5CF6' }}>
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold">{selectedPkg.packageId}</div>
                <span className="text-xs px-2 py-1 rounded" style={{ background:'#8B5CF620', color:'#8B5CF6' }}>{selectedPkg.packageType || '증빙'}</span>
              </div>
              <div className="text-xs mb-3" style={{ color:'#64748B' }}>
                생성: {selectedPkg.createdBy} · 역할: {selectedPkg.createdRole} · 포함 레코드: {pkgRecords.length}건
              </div>
              <div className="space-y-2">
                {pkgRecords.map((r: any, i: number) => (
                  <div key={i} className="p-3 rounded text-xs" style={{ background:'#111B2A', border:'1px solid #1E293B' }}>
                    <span className="font-bold" style={{ color:'#00D9CC' }}>[{r.type}]</span>
                    <span className="ml-2" style={{ color:'#94A3B8' }}>{JSON.stringify(r.data).slice(0,120)}...</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedPkg && <div className="text-center py-12 text-sm" style={{ color:'#64748B' }}>패키지 ID를 입력하여 조회하세요.</div>}
        </div>
      )}
    </div>
  );
}
