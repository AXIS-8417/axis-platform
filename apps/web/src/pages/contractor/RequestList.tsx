import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const MOCK_REQUESTS = [
  { id: 'demo-1', addr: '경기도 용인시 수지구', panel: 'RPP', h: 3, len: 250, status: 'NEW', contract: 'BB 6개월', asset: '전체고재', created: '2분 전' },
  { id: 'demo-2', addr: '서울시 강남구 삼성동', panel: '스틸', h: 4, len: 160, status: 'NEW', contract: 'BB 12개월', asset: '전체신재', created: '15분 전' },
  { id: 'demo-3', addr: '경기도 파주시 운정동', panel: 'EGI', h: 2, len: 100, status: 'QUOTED', contract: 'SELL', asset: '전체고재', created: '1시간 전' },
  { id: 'demo-4', addr: '인천 부평구', panel: 'RPP', h: 5, len: 300, status: 'NEW', contract: 'BB 6개월', asset: '판넬만신재', created: '3시간 전' },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return `${Math.floor(hrs / 24)}일 전`;
}

interface EstimateRow {
  id: string;
  addr: string;
  panel: string;
  h: number;
  len: number;
  status: string;
  contract: string;
  asset: string;
  created: string;
}

function mapEstimate(est: any): EstimateRow {
  return {
    id: est.id,
    addr: est.address || est.addr || '-',
    panel: est.panelType || est.panel || '-',
    h: est.height || est.h || 0,
    len: est.length || est.len || 0,
    status: est.status === 'REQUESTED' ? 'NEW' : est.status === 'RESPONDED' ? 'QUOTED' : est.status || 'NEW',
    contract: est.contractType || est.selectedCellKey || est.contract || '-',
    asset: est.assetCondition || est.asset || '-',
    created: est.createdAt ? timeAgo(est.createdAt) : est.created || '-',
  };
}

export default function RequestList() {
  const [requests, setRequests] = useState<EstimateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/estimates', { params: { status: 'REQUESTED' } })
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : r.data?.items || [];
        setRequests(data.map(mapEstimate));
      })
      .catch(() => setRequests(MOCK_REQUESTS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold bg-[#7c3aed] text-white px-2 py-0.5 rounded">을(하도급사)</span>
          <span className="text-[10px] bg-[#f5f3ff] text-[#7c3aed] px-2 py-0.5 rounded font-semibold">STEP 4</span>
          <span className="text-[15px] font-bold text-[#0f172a]">견적요청 수신함</span>
        </div>
        <p className="text-xs text-[#64748b] mb-4">갑이 발송한 견적요청 목록 · E블록 확인 후 제출</p>

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[['신규', requests.filter(r => r.status === 'NEW').length + '건'], ['처리완료', requests.filter(r => r.status === 'QUOTED').length + '건'], ['반경', '50km']].map(([l, v]) => (
            <div key={l} className="bg-white border border-[#e2e8f0] rounded-lg p-2 text-center">
              <div className="text-[10px] text-[#94a3b8]">{l}</div>
              <div className="font-bold text-sm text-[#0f172a]">{v}</div>
            </div>
          ))}
        </div>

        {/* 요청 목록 */}
        {loading ? (
          <div className="text-center py-12 text-sm text-[#94a3b8] animate-pulse">로딩 중...</div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <Link key={req.id} to={`/contractor/respond/${req.id}`}
                className="block bg-white border border-[#e2e8f0] rounded-xl p-4 hover:border-[#7c3aed] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {req.status === 'NEW' && <span className="text-[10px] font-bold bg-[#ef4444] text-white px-1.5 py-0.5 rounded animate-pulse">NEW</span>}
                    {req.status === 'QUOTED' && <span className="text-[10px] font-bold bg-[#10b981] text-white px-1.5 py-0.5 rounded">완료</span>}
                    <span className="text-[13px] font-semibold text-[#0f172a]">{req.addr}</span>
                  </div>
                  <span className="text-[11px] text-[#94a3b8]">{req.created}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[req.panel, `H${req.h}M`, `L${req.len}M`, req.contract, req.asset].map((tag, i) => (
                    <span key={i} className="text-[11px] bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#64748b]">A블록 · E블록 자동산출 완료</span>
                  <span className="text-xs font-semibold text-[#7c3aed]">견적 확인 →</span>
                </div>
              </Link>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-12 text-sm text-[#94a3b8]">수신된 견적요청이 없습니다.</div>
            )}
          </div>
        )}

        {/* 하단 안내 */}
        <div className="mt-4 bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1]">
          ℹ 50km 내 을 먼저 참여. 3건+ 응답 시 자동 마감. 정렬: 금액순 → 거리순 → 응답시간순
        </div>

        {/* 홈 버튼 */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-[#94a3b8] hover:text-[#64748b]">← 홈으로</Link>
        </div>
      </div>
    </div>
  );
}
