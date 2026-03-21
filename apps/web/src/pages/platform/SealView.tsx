import { useState, useEffect } from 'react';
import api from '../../lib/api';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };

type SealType = 'SINGLE_SEAL' | 'MUTUAL_SEAL' | 'AUTO_SEAL' | 'SINGLE' | 'MUTUAL' | 'AUTO';

const SEAL_TYPE_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  SINGLE_SEAL: { label: '단독잠금', color: '#00D9CC', desc: '단일 당사자가 증빙을 봉인. 작성자 단독으로 확정하며, 상대방 동의 없이 잠금 처리.' },
  SINGLE: { label: '단독잠금', color: '#00D9CC', desc: '단일 당사자가 증빙을 봉인. 작성자 단독으로 확정하며, 상대방 동의 없이 잠금 처리.' },
  MUTUAL_SEAL: { label: '상호잠금', color: '#F0A500', desc: '갑-을 또는 을-병 양 당사자가 모두 승인해야 봉인 완료. 한쪽만 승인 시 PENDING 상태 유지.' },
  MUTUAL: { label: '상호잠금', color: '#F0A500', desc: '갑-을 또는 을-병 양 당사자가 모두 승인해야 봉인 완료. 한쪽만 승인 시 PENDING 상태 유지.' },
  AUTO_SEAL: { label: '자동잠금', color: '#8B5CF6', desc: '시스템이 조건 충족 시 자동 봉인. GPS 완료, 정산 확정 등 트리거에 의해 자동 실행.' },
  AUTO: { label: '자동잠금', color: '#8B5CF6', desc: '시스템이 조건 충족 시 자동 봉인. GPS 완료, 정산 확정 등 트리거에 의해 자동 실행.' },
};

function getSealConfig(sealType: string) {
  return SEAL_TYPE_CONFIG[sealType] || { label: sealType, color: '#64748B', desc: '' };
}

const MOCK_SEALS = [
  { sealId: 'SEAL-001', targetType: '시공일보', targetId: 'RPT-2024-0312', sealType: 'SINGLE_SEAL', sealedBy: '김OO (병)', timestamp: '2024-03-12 17:05:22' },
  { sealId: 'SEAL-002', targetType: '정산서', targetId: 'SET-2024-0311', sealType: 'MUTUAL_SEAL', sealedBy: '(주)대한건설 (을)', timestamp: '2024-03-11 18:30:15' },
];

const MOCK_AUDIT = [
  { id: 'AUD-001', action: 'VIEW', targetId: 'EVPKG-2024-001', targetType: '증빙패키지', userId: '김OO (병)', device: 'iPhone 15', ip: '211.45.xx.xx', timestamp: '2024-03-13 09:15:22' },
];

const MOCK_PAYMENTS = [
  { paymentId: 'PAY-001', billingId: 'BIL-001', amount: 2500000, state: 'COMPLETED', pgProvider: 'KG이니시스', createdAt: '2024-03-11 10:00:00', updatedAt: '2024-03-11 10:01:23' },
];

type TabKey = 'seals' | 'evidence' | 'audit' | 'payment';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'seals', label: '봉인 목록' },
  { key: 'evidence', label: '증빙패키지' },
  { key: 'audit', label: '감사로그' },
  { key: 'payment', label: '결제 상태머신' },
];

const ACTION_COLORS: Record<string, string> = { VIEW: '#3B82F6', DOWNLOAD: '#22C55E', SHARE: '#F0A500', INSERT: '#00D9CC', UPDATE: '#8B5CF6', DELETE: '#EF4444' };
const STATE_COLORS: Record<string, string> = { CREATED: '#3B82F6', COMPLETED: '#22C55E', FAILED: '#EF4444', CANCELLED: '#64748B', PAID: '#22C55E', UNPAID: '#F0A500', PENDING: '#3B82F6' };

export default function SealView() {
  const [activeTab, setActiveTab] = useState<TabKey>('seals');
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  const [seals, setSeals] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load seals
  useEffect(() => {
    if (activeTab === 'seals') {
      setLoading(true);
      api.get('/api/platform/seals').then(r => setSeals(r.data?.items || []))
        .catch(() => setSeals(MOCK_SEALS))
        .finally(() => setLoading(false));
    }
  }, [activeTab === 'seals']);

  // Load audit logs
  useEffect(() => {
    if (activeTab === 'audit') {
      setLoading(true);
      api.get('/api/platform/audit-logs').then(r => setAuditLogs(r.data?.items || []))
        .catch(() => setAuditLogs(MOCK_AUDIT))
        .finally(() => setLoading(false));
    }
  }, [activeTab === 'audit']);

  // Load payments (billings)
  useEffect(() => {
    if (activeTab === 'payment') {
      setLoading(true);
      api.get('/api/platform/billings').then(r => {
        const items = r.data?.items || [];
        setPayments(items.map((b: any) => ({
          paymentId: b.paymentId || b.billingId,
          billingId: b.billingId,
          amount: b.amount || 0,
          state: b.payStatus || b.state || 'CREATED',
          pgProvider: b.pgProvider || '-',
          createdAt: b.createdAt ? new Date(b.createdAt).toLocaleString('ko-KR') : '-',
          updatedAt: b.updatedAt ? new Date(b.updatedAt).toLocaleString('ko-KR') : '-',
        })));
      })
        .catch(() => setPayments(MOCK_PAYMENTS))
        .finally(() => setLoading(false));
    }
  }, [activeTab === 'payment']);

  // Load evidence packages from seals
  useEffect(() => {
    if (activeTab === 'evidence' && seals.length > 0) {
      setLoading(true);
      const pkgPromises = seals.slice(0, 5).map(s =>
        api.get(`/api/platform/evidence-packages/${s.sealId}`).then(r => r.data).catch(() => null)
      );
      Promise.all(pkgPromises)
        .then(results => setPackages(results.filter(Boolean)))
        .catch(() => setPackages([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab === 'evidence', seals.length]);

  const LoadingSpinner = () => (
    <div className="text-center py-8 text-sm animate-pulse" style={{ color: '#64748B' }}>로딩 중...</div>
  );

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl font-bold mb-2">봉인 / 증빙</h1>
      <div className="text-xs mb-6" style={{ color: '#64748B' }}>SEALED 불변성 기반 증빙 관리 시스템</div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: activeTab === tab.key ? '#00D9CC20' : '#0C1520',
              color: activeTab === tab.key ? '#00D9CC' : '#64748B',
              border: `1px solid ${activeTab === tab.key ? '#00D9CC' : '#1E293B'}`,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: 봉인 목록 */}
      {activeTab === 'seals' && (
        <>
          {/* Seal Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {(['SINGLE_SEAL', 'MUTUAL_SEAL', 'AUTO_SEAL'] as const).map(type => {
              const cfg = SEAL_TYPE_CONFIG[type];
              return (
                <div key={type} style={card} className="rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono px-2 py-1 rounded font-bold"
                      style={{ background: cfg.color + '20', color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                      {type}
                    </span>
                  </div>
                  <div className="text-sm font-bold mb-2" style={{ color: cfg.color }}>{cfg.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{cfg.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Immutability note */}
          <div className="mb-6 p-3 rounded-lg text-xs" style={{ background: '#EF444410', border: '1px solid #EF444430', color: '#EF4444' }}>
            * SEALED 상태의 증빙은 수정, 삭제, 덮어쓰기가 불가능합니다. 모든 변경은 새로운 버전으로 생성됩니다.
          </div>

          {loading ? <LoadingSpinner /> : (
            <div style={card} className="rounded-lg p-6">
              <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>봉인 이력 ({seals.length}건)</h2>
              <div className="space-y-3">
                {seals.map((seal: any) => {
                  const cfg = getSealConfig(seal.sealType);
                  return (
                    <div key={seal.sealId} style={elevated} className="rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-sm font-mono font-semibold" style={{ color: '#F1F5F9' }}>{seal.sealId}</div>
                          <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                            {seal.targetType} · <span className="font-mono">{seal.targetId || seal.sealTargetId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs px-2 py-1 rounded font-bold"
                          style={{ background: cfg.color + '20', color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: '#94A3B8' }}>{seal.sealedBy || seal.sealParty || '-'}</div>
                          <div className="text-xs font-mono" style={{ color: '#64748B' }}>
                            {seal.sealedAt ? new Date(seal.sealedAt).toLocaleString('ko-KR') : seal.timestamp || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {seals.length === 0 && <div className="text-center py-8 text-sm" style={{ color: '#64748B' }}>봉인 기록이 없습니다.</div>}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: 증빙패키지 */}
      {activeTab === 'evidence' && (
        <>
          <div className="mb-6 p-3 rounded-lg text-xs" style={{ background: '#EF444410', border: '1px solid #EF444430', color: '#EF4444' }}>
            증빙패키지는 EVIDENCE_PKG_ID 단위로 관리됩니다. 삭제·선별·편집 불가 — 전체 패키지를 그대로 제공합니다.
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="space-y-4">
              {packages.map((pkg: any) => (
                <div key={pkg.pkgId || pkg.id} style={card} className="rounded-lg p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-mono font-bold" style={{ color: '#F1F5F9' }}>{pkg.pkgId || pkg.id}</div>
                      <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                        봉인: {pkg.sealId} · {pkg.sizeMB ? `${pkg.sizeMB} MB` : ''} · {pkg.createdAt ? new Date(pkg.createdAt).toLocaleString('ko-KR') : '-'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded text-xs font-bold"
                        style={{ background: '#3B82F620', color: '#3B82F6', border: '1px solid #3B82F640' }}>
                        Preview
                      </button>
                      <button className="px-3 py-1 rounded text-xs font-bold"
                        style={{ background: '#22C55E20', color: '#22C55E', border: '1px solid #22C55E40' }}>
                        Download
                      </button>
                    </div>
                  </div>
                  {pkg.items && (
                    <>
                      <button
                        onClick={() => setExpandedPkg(expandedPkg === (pkg.pkgId || pkg.id) ? null : (pkg.pkgId || pkg.id))}
                        className="text-xs mb-2 cursor-pointer"
                        style={{ color: '#00D9CC', background: 'none', border: 'none', padding: 0 }}
                      >
                        {expandedPkg === (pkg.pkgId || pkg.id) ? '▼' : '▶'} 포함 항목 ({pkg.items.length}건)
                      </button>
                      {expandedPkg === (pkg.pkgId || pkg.id) && (
                        <div className="mt-2 space-y-1">
                          {pkg.items.map((item: any, ii: number) => (
                            <div key={ii} className="flex items-center gap-3 p-2 rounded" style={elevated}>
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#00D9CC15', color: '#00D9CC' }}>{item.type}</span>
                              <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {packages.length === 0 && <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>증빙패키지가 없습니다.</div>}
            </div>
          )}
        </>
      )}

      {/* Tab: 감사로그 */}
      {activeTab === 'audit' && (
        loading ? <LoadingSpinner /> : (
          <div style={card} className="rounded-lg p-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#F0A500' }}>감사 로그 ({auditLogs.length}건)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E293B' }}>
                    {['ID', '액션', '대상', '대상유형', '사용자', '기기', 'IP', '시각'].map(h => (
                      <th key={h} className="text-left py-3 px-2 font-semibold" style={{ color: '#64748B' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((entry: any) => (
                    <tr key={entry.id || entry.logId} style={{ borderBottom: '1px solid #1E293B10' }}>
                      <td className="py-3 px-2 font-mono" style={{ color: '#F1F5F9' }}>{entry.id || entry.logId}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded font-bold"
                          style={{ background: (ACTION_COLORS[entry.action] || '#3B82F6') + '20', color: ACTION_COLORS[entry.action] || '#3B82F6' }}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono" style={{ color: '#94A3B8' }}>{entry.targetId || entry.recordId}</td>
                      <td className="py-3 px-2" style={{ color: '#94A3B8' }}>{entry.targetType || entry.tableName}</td>
                      <td className="py-3 px-2" style={{ color: '#F1F5F9' }}>{entry.userId || entry.changedBy}</td>
                      <td className="py-3 px-2" style={{ color: '#64748B' }}>{entry.device || '-'}</td>
                      <td className="py-3 px-2 font-mono" style={{ color: '#64748B' }}>{entry.ip || '-'}</td>
                      <td className="py-3 px-2 font-mono" style={{ color: '#64748B' }}>
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('ko-KR') : entry.timestamp || '-'}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8" style={{ color: '#64748B' }}>감사 로그가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab: 결제 상태머신 */}
      {activeTab === 'payment' && (
        <>
          {/* State Machine Diagram */}
          <div style={card} className="rounded-lg p-6 mb-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#8B5CF6' }}>결제 상태 전이도</h2>
            <div className="flex items-center justify-center gap-4 mb-4 overflow-x-auto">
              <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#3B82F620', color: '#3B82F6', border: '1px solid #3B82F640' }}>
                CREATED
              </div>
              <div className="flex flex-col gap-2 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5" style={{ background: '#22C55E' }} />
                  <span className="text-xs" style={{ color: '#22C55E' }}>성공</span>
                  <div className="w-12 h-0.5" style={{ background: '#22C55E' }} />
                  <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#22C55E20', color: '#22C55E', border: '1px solid #22C55E40' }}>
                    COMPLETED
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5" style={{ background: '#EF4444' }} />
                  <span className="text-xs" style={{ color: '#EF4444' }}>실패</span>
                  <div className="w-12 h-0.5" style={{ background: '#EF4444' }} />
                  <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444440' }}>
                    FAILED
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5" style={{ background: '#64748B' }} />
                  <span className="text-xs" style={{ color: '#64748B' }}>취소</span>
                  <div className="w-12 h-0.5" style={{ background: '#64748B' }} />
                  <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#64748B20', color: '#64748B', border: '1px solid #64748B40' }}>
                    CANCELLED
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg text-xs" style={{ background: '#F0A50010', border: '1px solid #F0A50030', color: '#F0A500' }}>
              되돌림/재시도 = 새 PAYMENT_ID 생성. 기존 결제 레코드는 수정되지 않으며, 새 트랜잭션으로 기록됩니다.
            </div>
          </div>

          {/* Payment Records */}
          {loading ? <LoadingSpinner /> : (
            <div style={card} className="rounded-lg p-6">
              <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>결제 레코드 ({payments.length}건)</h2>
              <div className="space-y-3">
                {payments.map((pay: any) => {
                  const stateColor = STATE_COLORS[pay.state] || '#64748B';
                  return (
                    <div key={pay.paymentId || pay.billingId} style={elevated} className="rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-mono font-semibold" style={{ color: '#F1F5F9' }}>{pay.paymentId || pay.billingId}</div>
                        <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                          {pay.billingId} · {Number(pay.amount).toLocaleString()}원 · {pay.pgProvider}
                        </div>
                        <div className="text-xs mt-0.5 font-mono" style={{ color: '#475569' }}>
                          {pay.createdAt} → {pay.updatedAt}
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded font-bold"
                        style={{ background: stateColor + '20', color: stateColor, border: `1px solid ${stateColor}40` }}>
                        {pay.state}
                      </span>
                    </div>
                  );
                })}
                {payments.length === 0 && <div className="text-center py-8 text-sm" style={{ color: '#64748B' }}>결제 기록이 없습니다.</div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
