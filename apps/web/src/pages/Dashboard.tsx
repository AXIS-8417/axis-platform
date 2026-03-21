import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface EstimateSummary {
  id: string;
  address: string;
  panelType: string;
  status: string;
  createdAt: string;
  responseCount: number;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  DRAFT: { text: '작성중', color: 'text-slate-400' },
  REQUESTED: { text: '요청됨', color: 'text-axis-teal' },
  RESPONDED: { text: '응답완료', color: 'text-green-400' },
  COMPLETED: { text: '완료', color: 'text-blue-400' },
};

const PANEL_LABELS: Record<string, string> = {
  EGI: 'EGI',
  MEGA_PANEL: '메가패널',
  PIPE_ONLY: '파이프만신재',
  KALZIP: '칼집',
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [estimates, setEstimates] = useState<EstimateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    try {
      const { data } = await api.get('/api/estimates');
      setEstimates(data);
    } catch {
      // Mock
      setEstimates([
        {
          id: 'est-001',
          address: '서울특별시 강남구 삼성동',
          panelType: 'EGI',
          status: 'REQUESTED',
          createdAt: '2026-03-17T10:30:00Z',
          responseCount: 2,
        },
        {
          id: 'est-002',
          address: '경기도 수원시 영통구',
          panelType: 'MEGA_PANEL',
          status: 'RESPONDED',
          createdAt: '2026-03-15T08:00:00Z',
          responseCount: 4,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-axis-bg">
      <div className="border-b border-axis-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-axis-teal font-mono font-bold text-lg">대시보드</h1>
        <div className="text-sm text-slate-500">
          {user?.companyName} ({user?.role})
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="axis-card text-center">
            <div className="text-2xl font-mono text-axis-teal font-bold">{estimates.length}</div>
            <div className="text-xs text-slate-500 mt-1">전체 견적</div>
          </div>
          <div className="axis-card text-center">
            <div className="text-2xl font-mono text-axis-amber font-bold">
              {estimates.filter((e) => e.status === 'REQUESTED').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">진행중</div>
          </div>
          <div className="axis-card text-center">
            <div className="text-2xl font-mono text-green-400 font-bold">
              {estimates.filter((e) => e.status === 'RESPONDED' || e.status === 'COMPLETED').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">완료</div>
          </div>
        </div>

        {/* Quick action */}
        <div className="mb-6">
          <Link to="/quote/new" className="axis-btn-primary inline-block">
            + 새 견적
          </Link>
        </div>

        {/* Estimate list */}
        <h2 className="text-slate-400 font-mono text-sm mb-4">최근 견적</h2>

        {loading ? (
          <div className="text-center text-axis-teal font-mono animate-pulse py-8">
            로딩 중...
          </div>
        ) : estimates.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            아직 견적이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {estimates.map((est) => {
              const status = STATUS_LABELS[est.status] || { text: est.status, color: 'text-slate-400' };
              return (
                <Link
                  key={est.id}
                  to={est.status === 'RESPONDED' ? `/quote/compare/${est.id}` : `/quote/matrix/${est.id}`}
                  className="block axis-card hover:border-axis-teal/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-sm text-slate-400">#{est.id.slice(0, 8)}</span>
                    <span className={`text-xs font-semibold ${status.color}`}>{status.text}</span>
                  </div>
                  <div className="text-slate-300 mb-1">{est.address}</div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>{PANEL_LABELS[est.panelType] || est.panelType}</span>
                    <span>응답 {est.responseCount}건</span>
                    <span>{new Date(est.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
