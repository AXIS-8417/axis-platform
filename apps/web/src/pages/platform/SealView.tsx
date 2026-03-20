import { useState } from 'react';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };

type SealType = 'SINGLE_SEAL' | 'MUTUAL_SEAL' | 'AUTO_SEAL';

const SEAL_TYPE_CONFIG: Record<SealType, { label: string; color: string; desc: string }> = {
  SINGLE_SEAL: { label: '\ub2e8\ub3c5\uc7a0\uae08', color: '#00D9CC', desc: '\ub2e8\uc77c \ub2f9\uc0ac\uc790\uac00 \uc99d\ube59\uc744 \ubd09\uc778. \uc791\uc131\uc790 \ub2e8\ub3c5\uc73c\ub85c \ud655\uc815\ud558\uba70, \uc0c1\ub300\ubc29 \ub3d9\uc758 \uc5c6\uc774 \uc7a0\uae08 \ucc98\ub9ac.' },
  MUTUAL_SEAL: { label: '\uc0c1\ud638\uc7a0\uae08', color: '#F0A500', desc: '\uac11-\uc744 \ub610\ub294 \uc744-\ubcd1 \uc591 \ub2f9\uc0ac\uc790\uac00 \ubaa8\ub450 \uc2b9\uc778\ud574\uc57c \ubd09\uc778 \uc644\ub8cc. \ud55c\ucabd\ub9cc \uc2b9\uc778 \uc2dc PENDING \uc0c1\ud0dc \uc720\uc9c0.' },
  AUTO_SEAL: { label: '\uc790\ub3d9\uc7a0\uae08', color: '#8B5CF6', desc: '\uc2dc\uc2a4\ud15c\uc774 \uc870\uac74 \ucda9\uc871 \uc2dc \uc790\ub3d9 \ubd09\uc778. GPS \uc644\ub8cc, \uc815\uc0b0 \ud655\uc815 \ub4f1 \ud2b8\ub9ac\uac70\uc5d0 \uc758\ud574 \uc790\ub3d9 \uc2e4\ud589.' },
};

interface SealRecord {
  sealId: string;
  targetType: string;
  targetId: string;
  sealType: SealType;
  sealedBy: string;
  timestamp: string;
}

const MOCK_SEALS: SealRecord[] = [
  { sealId: 'SEAL-001', targetType: '\uc2dc\uacf5\uc77c\ubcf4', targetId: 'RPT-2024-0312', sealType: 'SINGLE_SEAL', sealedBy: '\uae40OO (\ubcd1)', timestamp: '2024-03-12 17:05:22' },
  { sealId: 'SEAL-002', targetType: '\uc815\uc0b0\uc11c', targetId: 'SET-2024-0311', sealType: 'MUTUAL_SEAL', sealedBy: '(\uc8fc)\ub300\ud55c\uac74\uc124 (\uc744)', timestamp: '2024-03-11 18:30:15' },
  { sealId: 'SEAL-003', targetType: 'GPS\uae30\ub85d', targetId: 'GPS-2024-0312', sealType: 'AUTO_SEAL', sealedBy: 'SYSTEM', timestamp: '2024-03-12 17:02:18' },
  { sealId: 'SEAL-004', targetType: '\uadfc\ub85c\uacc4\uc57d', targetId: 'CTR-2024-0301', sealType: 'MUTUAL_SEAL', sealedBy: '(\uc8fc)\uc11c\uc6b8\uae30\uacc4 (\uc744)', timestamp: '2024-03-01 09:15:40' },
  { sealId: 'SEAL-005', targetType: '\uc548\uc804\uc810\uac80', targetId: 'SAF-2024-0310', sealType: 'SINGLE_SEAL', sealedBy: '\ubc15OO (\uac11)', timestamp: '2024-03-10 16:45:00' },
  { sealId: 'SEAL-006', targetType: '\uc124\uacc4\ubcc0\uacbd', targetId: 'DCH-2024-0308', sealType: 'MUTUAL_SEAL', sealedBy: '(\uc8fc)\ub300\ud55c\uac74\uc124 (\uc744)', timestamp: '2024-03-08 11:20:33' },
];

interface EvidencePackage {
  pkgId: string;
  sealId: string;
  items: { type: string; name: string }[];
  sizeMB: number;
  createdAt: string;
}

const MOCK_PACKAGES: EvidencePackage[] = [
  {
    pkgId: 'EVPKG-2024-001',
    sealId: 'SEAL-001',
    items: [
      { type: '\uc2dc\uacf5\uc77c\ubcf4', name: 'RPT-2024-0312.pdf' },
      { type: '\ud638\ucd9c\ub9e4\uce6d', name: 'MATCH-2024-0312.json' },
      { type: '\uc0c1\ud0dc\ud750\ub984\ub85c\uadf8', name: 'FLOW-2024-0312.log' },
      { type: 'GPS\uae30\ub85d', name: 'GPS-2024-0312.gpx' },
      { type: '\uc11c\uba85', name: 'SIG-KIM-0312.sig' },
      { type: '\uc0ac\uc9c4', name: 'PHOTO-SITE-0312.zip' },
    ],
    sizeMB: 24.7,
    createdAt: '2024-03-12 17:10:00',
  },
  {
    pkgId: 'EVPKG-2024-002',
    sealId: 'SEAL-002',
    items: [
      { type: '\uc2dc\uacf5\uc77c\ubcf4', name: 'RPT-2024-0311.pdf' },
      { type: '\ud638\ucd9c\ub9e4\uce6d', name: 'MATCH-2024-0311.json' },
      { type: 'GPS\uae30\ub85d', name: 'GPS-2024-0311.gpx' },
      { type: '\uc0ac\uc9c4', name: 'PHOTO-SITE-0311.zip' },
    ],
    sizeMB: 18.3,
    createdAt: '2024-03-11 18:35:00',
  },
  {
    pkgId: 'EVPKG-2024-003',
    sealId: 'SEAL-003',
    items: [
      { type: 'GPS\uae30\ub85d', name: 'GPS-AUTO-0312.gpx' },
      { type: '\uc0c1\ud0dc\ud750\ub984\ub85c\uadf8', name: 'FLOW-AUTO-0312.log' },
    ],
    sizeMB: 2.1,
    createdAt: '2024-03-12 17:05:00',
  },
];

interface AuditEntry {
  id: string;
  action: 'VIEW' | 'DOWNLOAD' | 'SHARE';
  targetId: string;
  targetType: string;
  userId: string;
  device: string;
  ip: string;
  timestamp: string;
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'AUD-001', action: 'VIEW', targetId: 'EVPKG-2024-001', targetType: '\uc99d\ube59\ud328\ud0a4\uc9c0', userId: '\uae40OO (\ubcd1)', device: 'iPhone 15', ip: '211.45.xx.xx', timestamp: '2024-03-13 09:15:22' },
  { id: 'AUD-002', action: 'DOWNLOAD', targetId: 'EVPKG-2024-001', targetType: '\uc99d\ube59\ud328\ud0a4\uc9c0', userId: '\ubc15OO (\uac11)', device: 'Chrome/Win', ip: '175.23.xx.xx', timestamp: '2024-03-13 10:02:45' },
  { id: 'AUD-003', action: 'SHARE', targetId: 'EVPKG-2024-002', targetType: '\uc99d\ube59\ud328\ud0a4\uc9c0', userId: '(\uc8fc)\ub300\ud55c\uac74\uc124', device: 'Android App', ip: '121.67.xx.xx', timestamp: '2024-03-13 14:30:10' },
  { id: 'AUD-004', action: 'VIEW', targetId: 'SEAL-005', targetType: '\ubd09\uc778\ub808\ucf54\ub4dc', userId: '\ubc15OO (\uac11)', device: 'Chrome/Win', ip: '175.23.xx.xx', timestamp: '2024-03-14 08:45:00' },
];

interface PaymentRecord {
  paymentId: string;
  billingId: string;
  amount: number;
  state: 'CREATED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  pgProvider: string;
  createdAt: string;
  updatedAt: string;
}

const MOCK_PAYMENTS: PaymentRecord[] = [
  { paymentId: 'PAY-001', billingId: 'BIL-001', amount: 2500000, state: 'COMPLETED', pgProvider: 'KG\uc774\ub2c8\uc2dc\uc2a4', createdAt: '2024-03-11 10:00:00', updatedAt: '2024-03-11 10:01:23' },
  { paymentId: 'PAY-002', billingId: 'BIL-002', amount: 1800000, state: 'FAILED', pgProvider: 'NHN KCP', createdAt: '2024-03-12 14:00:00', updatedAt: '2024-03-12 14:00:45' },
  { paymentId: 'PAY-003', billingId: 'BIL-002', amount: 1800000, state: 'COMPLETED', pgProvider: 'NHN KCP', createdAt: '2024-03-12 14:05:00', updatedAt: '2024-03-12 14:05:32' },
  { paymentId: 'PAY-004', billingId: 'BIL-003', amount: 3200000, state: 'CANCELLED', pgProvider: '\ud1a0\uc2a4\ud398\uc774\uba3c\uce20', createdAt: '2024-03-13 09:00:00', updatedAt: '2024-03-13 09:10:00' },
];

type TabKey = 'seals' | 'evidence' | 'audit' | 'payment';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'seals', label: '\ubd09\uc778 \ubaa9\ub85d' },
  { key: 'evidence', label: '\uc99d\ube59\ud328\ud0a4\uc9c0' },
  { key: 'audit', label: '\uac10\uc0ac\ub85c\uadf8' },
  { key: 'payment', label: '\uacb0\uc81c \uc0c1\ud0dc\uba38\uc2e0' },
];

const ACTION_COLORS: Record<string, string> = {
  VIEW: '#3B82F6',
  DOWNLOAD: '#22C55E',
  SHARE: '#F0A500',
};

const STATE_COLORS: Record<string, string> = {
  CREATED: '#3B82F6',
  COMPLETED: '#22C55E',
  FAILED: '#EF4444',
  CANCELLED: '#64748B',
};

export default function SealView() {
  const [activeTab, setActiveTab] = useState<TabKey>('seals');
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-2">\ubd09\uc778 / \uc99d\ube59</h1>
      <div className="text-xs mb-6" style={{ color: '#64748B' }}>SEALED \ubd88\ubcc0\uc131 \uae30\ubc18 \uc99d\ube59 \uad00\ub9ac \uc2dc\uc2a4\ud15c</div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
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

      {/* Tab: \ubd09\uc778 \ubaa9\ub85d */}
      {activeTab === 'seals' && (
        <>
          {/* Seal Types */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(Object.entries(SEAL_TYPE_CONFIG) as [SealType, typeof SEAL_TYPE_CONFIG[SealType]][]).map(([type, cfg]) => (
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
            ))}
          </div>

          {/* Immutability note */}
          <div className="mb-6 p-3 rounded-lg text-xs" style={{ background: '#EF444410', border: '1px solid #EF444430', color: '#EF4444' }}>
            * SEALED \uc0c1\ud0dc\uc758 \uc99d\ube59\uc740 \uc218\uc815, \uc0ad\uc81c, \ub36e\uc5b4\uc4f0\uae30\uac00 \ubd88\uac00\ub2a5\ud569\ub2c8\ub2e4. \ubaa8\ub4e0 \ubcc0\uacbd\uc740 \uc0c8\ub85c\uc6b4 \ubc84\uc804\uc73c\ub85c \uc0dd\uc131\ub429\ub2c8\ub2e4.
          </div>

          {/* Seal History */}
          <div style={card} className="rounded-lg p-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>\ubd09\uc778 \uc774\ub825</h2>
            <div className="space-y-3">
              {MOCK_SEALS.map((seal) => {
                const cfg = SEAL_TYPE_CONFIG[seal.sealType];
                return (
                  <div key={seal.sealId} style={elevated} className="rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm font-mono font-semibold" style={{ color: '#F1F5F9' }}>{seal.sealId}</div>
                        <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                          {seal.targetType} \xb7 <span className="font-mono">{seal.targetId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2 py-1 rounded font-bold"
                        style={{ background: cfg.color + '20', color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: '#94A3B8' }}>{seal.sealedBy}</div>
                        <div className="text-xs font-mono" style={{ color: '#64748B' }}>{seal.timestamp}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Tab: \uc99d\ube59\ud328\ud0a4\uc9c0 */}
      {activeTab === 'evidence' && (
        <>
          <div className="mb-6 p-3 rounded-lg text-xs" style={{ background: '#EF444410', border: '1px solid #EF444430', color: '#EF4444' }}>
            \uc99d\ube59\ud328\ud0a4\uc9c0\ub294 EVIDENCE_PKG_ID \ub2e8\uc704\ub85c \uad00\ub9ac\ub429\ub2c8\ub2e4. \uc0ad\uc81c\xb7\uc120\ubcc4\xb7\ud3b8\uc9d1 \ubd88\uac00 \u2014 \uc804\uccb4 \ud328\ud0a4\uc9c0\ub97c \uadf8\ub300\ub85c \uc81c\uacf5\ud569\ub2c8\ub2e4.
          </div>
          <div className="space-y-4">
            {MOCK_PACKAGES.map(pkg => (
              <div key={pkg.pkgId} style={card} className="rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-mono font-bold" style={{ color: '#F1F5F9' }}>{pkg.pkgId}</div>
                    <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                      \ubd09\uc778: {pkg.sealId} \xb7 {pkg.sizeMB} MB \xb7 {pkg.createdAt}
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
                <button
                  onClick={() => setExpandedPkg(expandedPkg === pkg.pkgId ? null : pkg.pkgId)}
                  className="text-xs mb-2 cursor-pointer"
                  style={{ color: '#00D9CC', background: 'none', border: 'none', padding: 0 }}
                >
                  {expandedPkg === pkg.pkgId ? '\u25bc' : '\u25b6'} \ud3ec\ud568 \ud56d\ubaa9 ({pkg.items.length}\uac74)
                </button>
                {expandedPkg === pkg.pkgId && (
                  <div className="mt-2 space-y-1">
                    {pkg.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-3 p-2 rounded" style={elevated}>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#00D9CC15', color: '#00D9CC' }}>{item.type}</span>
                        <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab: \uac10\uc0ac\ub85c\uadf8 */}
      {activeTab === 'audit' && (
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-4" style={{ color: '#F0A500' }}>\uac10\uc0ac \ub85c\uadf8</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  {['ID', '\uc561\uc158', '\ub300\uc0c1', '\ub300\uc0c1\uc720\ud615', '\uc0ac\uc6a9\uc790', '\uae30\uae30', 'IP', '\uc2dc\uac01'].map(h => (
                    <th key={h} className="text-left py-3 px-2 font-semibold" style={{ color: '#64748B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_AUDIT.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #1E293B10' }}>
                    <td className="py-3 px-2 font-mono" style={{ color: '#F1F5F9' }}>{entry.id}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded font-bold"
                        style={{ background: (ACTION_COLORS[entry.action] || '#3B82F6') + '20', color: ACTION_COLORS[entry.action] || '#3B82F6' }}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono" style={{ color: '#94A3B8' }}>{entry.targetId}</td>
                    <td className="py-3 px-2" style={{ color: '#94A3B8' }}>{entry.targetType}</td>
                    <td className="py-3 px-2" style={{ color: '#F1F5F9' }}>{entry.userId}</td>
                    <td className="py-3 px-2" style={{ color: '#64748B' }}>{entry.device}</td>
                    <td className="py-3 px-2 font-mono" style={{ color: '#64748B' }}>{entry.ip}</td>
                    <td className="py-3 px-2 font-mono" style={{ color: '#64748B' }}>{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: \uacb0\uc81c \uc0c1\ud0dc\uba38\uc2e0 */}
      {activeTab === 'payment' && (
        <>
          {/* State Machine Diagram */}
          <div style={card} className="rounded-lg p-6 mb-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#8B5CF6' }}>\uacb0\uc81c \uc0c1\ud0dc \uc804\uc774\ub3c4</h2>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#3B82F620', color: '#3B82F6', border: '1px solid #3B82F640' }}>
                CREATED
              </div>
              <div className="flex flex-col gap-2 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5" style={{ background: '#22C55E' }} />
                  <span className="text-xs" style={{ color: '#22C55E' }}>\uc131\uacf5</span>
                  <div className="w-12 h-0.5" style={{ background: '#22C55E' }} />
                  <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#22C55E20', color: '#22C55E', border: '1px solid #22C55E40' }}>
                    COMPLETED
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5" style={{ background: '#EF4444' }} />
                  <span className="text-xs" style={{ color: '#EF4444' }}>\uc2e4\ud328</span>
                  <div className="w-12 h-0.5" style={{ background: '#EF4444' }} />
                  <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444440' }}>
                    FAILED
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5" style={{ background: '#64748B' }} />
                  <span className="text-xs" style={{ color: '#64748B' }}>\ucde8\uc18c</span>
                  <div className="w-12 h-0.5" style={{ background: '#64748B' }} />
                  <div className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#64748B20', color: '#64748B', border: '1px solid #64748B40' }}>
                    CANCELLED
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg text-xs" style={{ background: '#F0A50010', border: '1px solid #F0A50030', color: '#F0A500' }}>
              \ub418\ub3cc\ub9bc/\uc7ac\uc2dc\ub3c4 = \uc0c8 PAYMENT_ID \uc0dd\uc131. \uae30\uc874 \uacb0\uc81c \ub808\ucf54\ub4dc\ub294 \uc218\uc815\ub418\uc9c0 \uc54a\uc73c\uba70, \uc0c8 \ud2b8\ub79c\uc7ad\uc158\uc73c\ub85c \uae30\ub85d\ub429\ub2c8\ub2e4.
            </div>
          </div>

          {/* Payment Records */}
          <div style={card} className="rounded-lg p-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>\uacb0\uc81c \ub808\ucf54\ub4dc</h2>
            <div className="space-y-3">
              {MOCK_PAYMENTS.map(pay => {
                const stateColor = STATE_COLORS[pay.state] || '#64748B';
                return (
                  <div key={pay.paymentId} style={elevated} className="rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-mono font-semibold" style={{ color: '#F1F5F9' }}>{pay.paymentId}</div>
                      <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                        {pay.billingId} \xb7 {Number(pay.amount).toLocaleString()}\uc6d0 \xb7 {pay.pgProvider}
                      </div>
                      <div className="text-xs mt-0.5 font-mono" style={{ color: '#475569' }}>
                        {pay.createdAt} \u2192 {pay.updatedAt}
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded font-bold"
                      style={{ background: stateColor + '20', color: stateColor, border: `1px solid ${stateColor}40` }}>
                      {pay.state}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
