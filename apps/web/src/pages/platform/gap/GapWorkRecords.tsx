import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const MOCK_WORK_ORDERS = [
  { workId: 'WO-MOCK01', workType: '설치', currentStatus: '작업완료', siteId: 'SITE-001', panelType: 'RPP', workLengthM: 250 },
];
const MOCK_REPORTS = [
  { reportId: 'RPT-MOCK01', workId: 'WO-MOCK01', weather: '맑음', sectionStartM: 0, sectionEndM: 120, sealId: null },
];
const MOCK_CHECKS = [
  { checkId: 'SC-MOCK01', workId: 'WO-MOCK01', result: '통과', checkCycle: '일일', checkerName: '홍길동' },
];

interface SiteGroup {
  siteId: string;
  orders: any[];
}

export default function GapWorkRecords() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [safetyChecks, setSafetyChecks] = useState<any[]>([]);
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/api/platform/work-orders').then(r => setWorkOrders(r.data?.items || r.data?.data || []))
      .catch(() => setWorkOrders(MOCK_WORK_ORDERS));
    api.get('/api/platform/reports').then(r => setReports(r.data?.items || r.data?.data || []))
      .catch(() => setReports(MOCK_REPORTS));
    api.get('/api/platform/safety-checks').then(r => setSafetyChecks(r.data?.items || r.data?.data || []))
      .catch(() => setSafetyChecks(MOCK_CHECKS));
  }, []);

  // Build hierarchical structure: Site -> Work Orders -> Reports + Safety Checks
  const siteGroups: SiteGroup[] = [];
  const siteMap = new Map<string, any[]>();
  workOrders.forEach(wo => {
    const sid = wo.siteId || 'UNKNOWN';
    if (!siteMap.has(sid)) siteMap.set(sid, []);
    siteMap.get(sid)!.push(wo);
  });
  siteMap.forEach((orders, siteId) => siteGroups.push({ siteId, orders }));

  const getReportsForWork = (workId: string) => reports.filter(r => r.workId === workId);
  const getChecksForWork = (workId: string) => safetyChecks.filter(c => c.workId === workId);

  const toggleSite = (siteId: string) => {
    const next = new Set(expandedSites);
    if (next.has(siteId)) next.delete(siteId); else next.add(siteId);
    setExpandedSites(next);
  };

  const toggleOrder = (workId: string) => {
    const next = new Set(expandedOrders);
    if (next.has(workId)) next.delete(workId); else next.add(workId);
    setExpandedOrders(next);
  };

  const statusColor: Record<string, string> = {
    '작업완료': '#22C55E', '작업중': '#00D9CC', '작업대기': '#F0A500', '봉인완료': '#8B5CF6',
  };

  return (
    <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-2">작업기록 조회</h1>
      <p className="text-xs mb-6" style={{ color: '#64748B' }}>현장별 -&gt; 작업지시 -&gt; 시공일보 -&gt; 안전점검 계층 뷰</p>

      {siteGroups.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>작업기록이 없습니다.</div>
      )}

      {siteGroups.map(sg => {
        const isExpanded = expandedSites.has(sg.siteId);
        return (
          <div key={sg.siteId} style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg mb-4">
            <button onClick={() => toggleSite(sg.siteId)} className="w-full p-5 text-left flex justify-between items-center">
              <h2 className="font-semibold" style={{ color: '#F0A500' }}>{sg.siteId} ({sg.orders.length}건)</h2>
              <span className="text-xs" style={{ color: '#64748B' }}>{isExpanded ? '[-]' : '[+]'}</span>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5">
                {sg.orders.map(o => {
                  const woExpanded = expandedOrders.has(o.workId);
                  const woReports = getReportsForWork(o.workId);
                  const woChecks = getChecksForWork(o.workId);
                  const sc = statusColor[o.currentStatus] || '#64748B';

                  return (
                    <div key={o.workId} className="mb-3" style={{ borderLeft: '2px solid #334155', paddingLeft: 12 }}>
                      <button onClick={() => toggleOrder(o.workId)} className="text-left w-full">
                        <div className="text-sm font-medium">
                          {o.workId} | {o.workType} | <span style={{ color: sc }}>{o.currentStatus}</span>
                          {o.panelType ? ` | ${o.panelType}` : ''}
                          {o.workLengthM ? ` | ${o.workLengthM}M` : ''}
                        </div>
                        <div className="text-xs" style={{ color: '#64748B' }}>
                          일보 {woReports.length}건 | 점검 {woChecks.length}건 {woExpanded ? '[-]' : '[+]'}
                        </div>
                      </button>

                      {woExpanded && (
                        <div className="ml-4 mt-2 space-y-1">
                          {woReports.map(r => (
                            <div key={r.reportId} className="text-xs p-2 rounded" style={{ background: '#111B2A', color: '#94A3B8' }}>
                              {r.sealId ? '[SEALED] ' : '[RPT] '}{r.reportId} -- {r.weather || '-'} | {r.sectionStartM ?? '?'}~{r.sectionEndM ?? '?'}M
                            </div>
                          ))}
                          {woChecks.map(c => (
                            <div key={c.checkId} className="text-xs p-2 rounded" style={{ background: '#111B2A', color: '#94A3B8' }}>
                              [SC] {c.checkId} -- {c.result || '-'} ({c.checkCycle || c.checkType || '-'})
                              {c.checkerName ? ` | ${c.checkerName}` : ''}
                            </div>
                          ))}
                          {woReports.length === 0 && woChecks.length === 0 && (
                            <div className="text-xs" style={{ color: '#334155' }}>하위 기록 없음</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
