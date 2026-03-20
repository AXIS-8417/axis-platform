import { useState, useEffect } from 'react';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };

const StatCard = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
  <div style={card} className="rounded-lg p-5">
    <div className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</div>
    <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
    {sub && <div className="text-xs mt-1" style={{ color: '#64748B' }}>{sub}</div>}
  </div>
);

const SITES = [
  { name: '\ud30c\uc8fc OO\uc544\ud30c\ud2b8 \uac00\uc124\uc6b8\ud0c0\ub9ac', panel: 'RPP', len: 160, progress: 72 },
  { name: '\uc218\uc6d0 OO\ud604\uc7a5 \uac00\uc2dc\uc124', panel: 'CLP', len: 240, progress: 45 },
  { name: '\uc778\ucc9c OO\ud604\uc7a5 \ubc29\uc74c\ubca1', panel: 'SNB', len: 80, progress: 100 },
];

const ARCH_LINKS = [
  { code: 'PART258', label: 'GPS \uc5d4\uc9c4', desc: '\uc790\ub3d9\uc804\ud658 \uc0c1\ud0dc\uba38\uc2e0', color: '#00D9CC' },
  { code: 'PART259', label: '\ub9ac\uc2a4\ud06c/TCI', desc: '\uc2e0\ub8b0\uc9c0\uc218 \uc5d4\uc9c4', color: '#F0A500' },
  { code: 'PART263', label: '\uac74\uc124\uae30\uacc4', desc: '\uc7a5\ube44 \ubc30\ucc28\xb7\uc815\uc0b0', color: '#8B5CF6' },
  { code: '\uc0c1\ud0dc\uba38\uc2e0', label: '\ubd09\uc778\xb7\uc99d\ube59', desc: 'SEALED \ubd88\ubcc0 \uc99d\ube59', color: '#3B82F6' },
];

const CANON_V14 = [
  { icon: '\ud83d\udd12', label: '\uae30\ub85d \uc911\uc2ec', desc: '\uc633\uace0 \uadf8\ub984\uc744 \ub9d0\ud558\uc9c0 \uc54a\uace0 \uc0ac\uc2e4\ub9cc \uae30\ub85d', color: '#22C55E' },
  { icon: '\u26a1', label: '\ud310\ub2e8 \ubc30\uc81c', desc: '\uacb0\ub860\xb7\ucd94\ucc9c\xb7\uadc0\ucc45 \ud310\ub2e8 \uc808\ub300 \ubd88\uac00', color: '#F0A500' },
  { icon: '\ud83d\udd17', label: '\ubd09\uc778 \ubd88\ubcc0', desc: 'SEALED \ub808\ucf54\ub4dc\ub294 \uc218\uc815\xb7\uc0ad\uc81c\xb7\uc120\ubcc4 \uc804\ubd80 \ubd88\uac00', color: '#EF4444' },
  { icon: '\ud83d\udc65', label: '3\uc790 \ud22c\uba85', desc: '\uac11\xb7\uc744\xb7\ubcd1 \ubaa8\ub4e0 \uae30\ub85d\uc740 \uad8c\ud55c \ubc94\uc704 \ub0b4 \uc0c1\ud638 \uc870\ud68c', color: '#3B82F6' },
  { icon: '\u23f1', label: '72h \uaddc\uce59', desc: '\uc124\uacc4\ubcc0\uacbd \ubb34\uc751\ub2f5 \u2192 DISAGREEMENT \uc790\ub3d9 \uc804\uc774', color: '#8B5CF6' },
  { icon: '\ud83d\udce6', label: '\uc99d\ube59 \ub2e8\uc704', desc: '\uc678\ubd80 \uc81c\uacf5\uc740 EVIDENCE_PKG_ID \ub2e8\uc704\ub9cc', color: '#00D9CC' },
];

const DOMAIN_MAP: { domain: string; color: string; count: number; tables: string[] }[] = [
  { domain: '\uae30\uc900\xb7\ub9c8\uc2a4\ud130', color: '#00D9CC', count: 6, tables: ['00_\uad8c\ud55c\ub9e4\ud2b8\ub9ad\uc2a4', '01_\ucf54\ub4dc\ub9c8\uc2a4\ud130', '02_\uacf5\ud1b5\uc124\uc815', '03_\uc5ed\ud560\uc815\uc758', '04_\uc54c\ub9bc\uc124\uc815', '05_\uc2dc\uc2a4\ud15c\ucf54\ub4dc'] },
  { domain: '\uc8fc\uccb4\xb7\uc0ac\uc6a9\uc790', color: '#22C55E', count: 5, tables: ['03_\uc8fc\uccb4\ubaa9\ub85d', '04_\uc0ac\uc6a9\uc790\ubaa9\ub85d', '05_\uad8c\ud55c\uadf8\ub8f9', '06_\uc778\uc99d\ub85c\uadf8', '07_\uc138\uc158\uad00\ub9ac'] },
  { domain: '\ud604\uc7a5\xb7\uc124\uacc4', color: '#3B82F6', count: 5, tables: ['08_\ud604\uc7a5\ub9c8\uc2a4\ud130', '09_\uc124\uacc4\ubcc0\uacbd', '10_\ub3c4\uba74\uad00\ub9ac', '11_\uacf5\uc815\uad00\ub9ac', '12_\ud604\uc7a5\uc124\uc815'] },
  { domain: '\ub2e8\uac00\xb7\uacac\uc801', color: '#F0A500', count: 5, tables: ['13_\ub2e8\uac00\ub9c8\uc2a4\ud130', '14_\uacac\uc801\uc11c', '15_\uacac\uc801\ud56d\ubaa9', '16_\ub2e8\uac00\uc774\ub825', '17_\uc2b9\uc778\ub85c\uadf8'] },
  { domain: '\uc791\uc5c5\xb7\ud638\ucd9c', color: '#8B5CF6', count: 4, tables: ['18_\uc791\uc5c5\uc9c0\uc2dc', '19_\ud638\ucd9c\ub9e4\uce6d', '20_\uc7a5\ube44\ubc30\ucc28', '21_\uc791\uc5c5\uc774\ub825'] },
  { domain: '\uc77c\ubcf4\xb7\uc7a0\uae08', color: '#FF7849', count: 6, tables: ['22_\uc2dc\uacf5\uc77c\ubcf4', '23_\uc77c\ubcf4\ud56d\ubaa9', '24_\ubd09\uc778\ub85c\uadf8', '25_\uc7a0\uae08\uc0c1\ud0dc', '26_\ubd09\uc778\uac80\uc99d', '27_\ubd09\uc778\uc774\ub825'] },
  { domain: '\ubcf4\ud5d8\xb7\uc99d\ube59', color: '#EF4444', count: 6, tables: ['28_\ubcf4\ud5d8\ub9c8\uc2a4\ud130', '29_\uc99d\ube59\ud328\ud0a4\uc9c0', '30_\uc99d\ube59\ud56d\ubaa9', '31_\uac10\uc0ac\ub85c\uadf8', '32_\ubcf4\ud5d8\uc0c1\ud0dc', '33_\ubcf4\ud5d8\uc774\ub825'] },
  { domain: '\uc790\uc7ac\xb7\uac8c\uc774\ud2b8', color: '#14B8A6', count: 7, tables: ['34_\uc790\uc7ac\ub9c8\uc2a4\ud130', '35_\uc790\uc7ac\uc785\ucd9c', '36_\uac8c\uc774\ud2b8\ub9c8\uc2a4\ud130', '37_\uac8c\uc774\ud2b8\uc774\ubca4\ud2b8', '38_\uc7ac\uace0\uc774\ub825', '39_\uc785\ucd9c\ub85c\uadf8', '40_\uc790\uc7ac\uc694\uccad'] },
  { domain: '\uc815\uc0b0\xb7\uacb0\uc81c', color: '#EC4899', count: 7, tables: ['41_\uccad\uad6c\uc11c', '42_\ubc14\uc774\ubc31', '43_\uc6d4\uc784\ub300', '44_\uacb0\uc81c\ub9c8\uc2a4\ud130', '45_\uacb0\uc81c\uc0c1\ud0dc', '46_\uc815\uc0b0\uc774\ub825', '47_\uc815\uc0b0\uac80\uc99d'] },
  { domain: '\uc548\uc804\xb7\uacc4\uc57d', color: '#A855F7', count: 6, tables: ['48_\uc548\uc804\uc810\uac80', '49_\uc0ac\uace0\uae30\ub85d', '50_\uacc4\uc57d\ub9c8\uc2a4\ud130', '51_\uacc4\uc57d\uc870\uac74', '52_\uacc4\uc57d\uc0c1\ud0dc', '53_\uacc4\uc57d\uc774\ub825'] },
];

const TECH_LAYERS = [
  { layer: 'UI', desc: 'React + Tailwind + \ub2e4\ud06c\ud14c\ub9c8', color: '#00D9CC' },
  { layer: 'API', desc: 'Express REST + JWT \uc778\uc99d', color: '#3B82F6' },
  { layer: 'State Machine', desc: '\ubd09\uc778\xb7\uc815\uc0b0\xb7\ud638\ucd9c \uc0c1\ud0dc\uc804\uc774', color: '#F0A500' },
  { layer: 'Data', desc: 'PostgreSQL 60\ud14c\uc774\ube14 + Redis \uce90\uc2dc', color: '#22C55E' },
  { layer: 'GPS Engine', desc: '\uc704\uce58\uae30\ubc18 \uc790\ub3d9\uc804\ud658 \uc5d4\uc9c4', color: '#8B5CF6' },
  { layer: 'PG Integration', desc: '\uacb0\uc81c \uac8c\uc774\ud2b8\uc6e8\uc774 \uc5f0\ub3d9', color: '#EC4899' },
  { layer: 'Gate Engine', desc: '\uc790\uc7ac \uc785\ucd9c\xb7\uac8c\uc774\ud2b8 \uad00\ub9ac', color: '#14B8A6' },
];

export default function PlatformDash() {
  const [tick, setTick] = useState(0);
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);

  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 60000); return () => clearInterval(t); }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-2">AXIS Platform Dashboard</h1>
      <div className="text-xs mb-6" style={{ color: '#64748B' }}>
        \uc2e4\uc2dc\uac04 \ud604\ud669 (\ub9c8\uc9c0\ub9c9 \uac31\uc2e0: {new Date().toLocaleTimeString('ko-KR')})
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="\ud604\uc7a5" value={3} color="#00D9CC" sub="\uc9c4\ud589 2 / \uc644\ub8cc 1" />
        <StatCard label="\uc791\uc5c5\uc9c0\uc2dc" value={3} color="#22C55E" sub="\uae08\uc77c \ubc30\uc815" />
        <StatCard label="\uc7a5\ube44" value={2} color="#8B5CF6" sub="\uac00\ub3d9\uc911" />
        <StatCard label="\ubd09\uc778" value={3} color="#F0A500" sub="SEALED \uac74\uc218" />
        <StatCard label="\uc815\uc0b0" value="11.6M" color="#FF7849" sub="\uc774\ubc88\ub2ec \ub204\uc801 (KRW)" />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Left: \ud604\uc7a5 \ud604\ud669 */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>\ud604\uc7a5 \ud604\ud669</h2>
          <div className="space-y-4">
            {SITES.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs font-mono" style={{ color: '#64748B' }}>{s.panel} \xb7 {s.len}m</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: '#1E293B' }}>
                  <div className="h-2 rounded-full" style={{
                    width: `${s.progress}%`,
                    background: s.progress === 100 ? '#64748B' : s.progress >= 70 ? '#22C55E' : '#F0A500',
                  }} />
                </div>
                <div className="text-right text-xs mt-1" style={{ color: s.progress === 100 ? '#64748B' : '#94A3B8' }}>
                  {s.progress}%{s.progress === 100 ? ' (\uc644\ub8cc)' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Architecture */}
        <div className="space-y-6">
          <div style={card} className="rounded-lg p-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#F0A500' }}>\uc544\ud0a4\ud14d\ucc98</h2>
            <div className="grid grid-cols-2 gap-3">
              {ARCH_LINKS.map((a, i) => (
                <div key={i} style={elevated} className="rounded-lg p-3">
                  <div className="text-xs font-mono mb-1" style={{ color: a.color }}>{a.code}</div>
                  <div className="text-sm font-semibold">{a.label}</div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CANON v14 */}
      <div style={card} className="rounded-lg p-6 mb-8">
        <h2 className="text-sm font-bold mb-1" style={{ color: '#22C55E' }}>CANON v14 &mdash; \ud5cc\ubc95\uc801 \uc6d0\uce59</h2>
        <div className="text-xs mb-4" style={{ color: '#64748B' }}>\ud50c\ub7ab\ud3fc\uc774 \uc808\ub300 \uc704\ubc18\ud560 \uc218 \uc5c6\ub294 6\ub300 \uc6d0\uce59</div>
        <div className="grid grid-cols-3 gap-4">
          {CANON_V14.map((c, i) => (
            <div key={i} style={elevated} className="rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{c.icon}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: c.color }}>{c.label}</div>
                  <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{c.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 60 \ud14c\uc774\ube14 \ub3c4\uba54\uc778 \ub9f5 */}
      <div style={card} className="rounded-lg p-6 mb-8">
        <h2 className="text-sm font-bold mb-1" style={{ color: '#8B5CF6' }}>60 \ud14c\uc774\ube14 \ub3c4\uba54\uc778 \ub9f5</h2>
        <div className="text-xs mb-4" style={{ color: '#64748B' }}>10\uac1c \ub3c4\uba54\uc778 \xb7 60\uac1c \ud14c\uc774\ube14 \u2014 \ud074\ub9ad\ud558\uc5ec \ud14c\uc774\ube14 \ubaa9\ub85d \ud655\uc778</div>
        <div className="grid grid-cols-5 gap-3">
          {DOMAIN_MAP.map((d, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedDomain(expandedDomain === i ? null : i)}
                className="w-full text-left rounded-lg p-3 transition-colors"
                style={{
                  background: expandedDomain === i ? d.color + '15' : '#111B2A',
                  border: `1px solid ${expandedDomain === i ? d.color + '50' : '#1E293B'}`,
                  cursor: 'pointer',
                }}
              >
                <div className="text-xs font-bold" style={{ color: d.color }}>{d.domain}</div>
                <div className="text-xs mt-1" style={{ color: '#64748B' }}>{d.count}\uac1c \ud14c\uc774\ube14</div>
              </button>
              {expandedDomain === i && (
                <div className="mt-2 rounded-lg p-3 space-y-1" style={{ background: '#0A1018', border: `1px solid ${d.color}30` }}>
                  {d.tables.map((t, ti) => (
                    <div key={ti} className="text-xs font-mono" style={{ color: '#94A3B8' }}>{t}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* \uae30\uc220 \uc2a4\ud0dd \ub808\uc774\uc5b4 */}
      <div style={card} className="rounded-lg p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>\uae30\uc220 \uc2a4\ud0dd \ub808\uc774\uc5b4</h2>
        <div className="space-y-2">
          {TECH_LAYERS.map((t, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg p-3" style={elevated}>
              <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                style={{ background: t.color + '20', color: t.color, border: `1px solid ${t.color}40` }}>
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: t.color }}>{t.layer}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
