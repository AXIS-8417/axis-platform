import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };
const inputStyle = { background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' };

const MOCK_CHECKS = [
  { checkId: 'SC-MOCK01', checkType: '\uc77c\uc77c', result: '\ud1b5\uacfc', checkerName: '\ud64d\uae38\ub3d9', checkedAt: '2026-03-19', seasonType: '\uc77c\ubc18' },
];

const CHECK_ITEMS = ['\ubc14\ub2e5\uc0c1\ud0dc', '\uc870\uba85', '\uc548\uc804\uc7a5\uad6c', '\uc7a5\ube44\uc0c1\ud0dc', '\ubc29\ud638\uc6b8\ud0c0\ub9ac', '\ub0a0\uc528', '\uc18c\ud654\uae30', '\ube44\uc0c1\uad6c', '\uc2e0\ud638\uccb4\uacc4', '\uc548\uc804\ud45c\uc9c0', '\uac00\uc2a4\uac10\uc9c0', '\uc804\uae30\uc124\ube44'];
const CYCLES = ['\uc77c\uc77c', '\uc8fc\uac04', '\uc6d4\uac04', '\ubd84\uae30', '\ubc18\uae30', '\uc815\ubc00'];
const SEASONS = ['\uc77c\ubc18', '\ud574\ube59\uae30', '\uc7a5\ub9c8', '\ud0dc\ud48d', '\ub3d9\uc808\uae30'];

const BODY_PARTS = ['\uba38\ub9ac', '\uc5bc\uad74', '\ubaa9', '\uc5b4\uae68', '\ud314', '\uc190', '\ud5c8\ub9ac', '\ub2e4\ub9ac', '\ubc1c', '\ud765\ubd80', '\ubcf5\ubd80', '\uae30\ud0c0'];

interface IncidentRecord {
  incidentId: string;
  date: string;
  location: string;
  reporter: string;
  injuredPerson: string;
  bodyPart: string;
  severity: '\uacbd\uc0c1' | '\uc911\uc0c1';
  gpsLat: number;
  gpsLng: number;
  status: '\uc811\uc218' | '\uc870\uc0ac\uc911' | '\uc644\ub8cc';
  description: string;
}

const MOCK_INCIDENTS: IncidentRecord[] = [
  {
    incidentId: 'INC-2026-001',
    date: '2026-03-18',
    location: '\ud30c\uc8fc OO\uc544\ud30c\ud2b8 A\ub3d9 3\uce35',
    reporter: '\ud64d\uae38\ub3d9',
    injuredPerson: '\uae40OO',
    bodyPart: '\uc190',
    severity: '\uacbd\uc0c1',
    gpsLat: 37.7590,
    gpsLng: 126.7800,
    status: '\uc644\ub8cc',
    description: '\uac00\uc124\uc6b8\ud0c0\ub9ac \uc124\uce58 \uc911 \uc190 \ucc30\uacfc\uc0c1',
  },
  {
    incidentId: 'INC-2026-002',
    date: '2026-03-19',
    location: '\uc218\uc6d0 OO\ud604\uc7a5 B\uad6c\uc5ed',
    reporter: '\uc774OO',
    injuredPerson: '\ubc15OO',
    bodyPart: '\ub2e4\ub9ac',
    severity: '\uc911\uc0c1',
    gpsLat: 37.2636,
    gpsLng: 127.0286,
    status: '\uc870\uc0ac\uc911',
    description: '\uc7a5\ube44 \uc774\ub3d9 \uc911 \ub118\uc5b4\uc9d0 - \ud558\uc9c0 \uace8\uc808 \uc758\uc2ec',
  },
];

type MainTab = 'check' | 'issue' | 'action' | 'confirm' | 'incident';

export default function ByeongSafety() {
  const [cycle, setCycle] = useState('\uc77c\uc77c');
  const [season, setSeason] = useState('\uc77c\ubc18');
  const [actionTab, setActionTab] = useState<MainTab>('check');
  const [checks, setChecks] = useState<Record<string, boolean>>(Object.fromEntries(CHECK_ITEMS.map(i => [i, false])));
  const [existingChecks, setExistingChecks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [note, setNote] = useState('');

  // Incident form state
  const [incDate, setIncDate] = useState('');
  const [incLocation, setIncLocation] = useState('');
  const [incReporter, setIncReporter] = useState('');
  const [incInjured, setIncInjured] = useState('');
  const [incBodyPart, setIncBodyPart] = useState('\uc190');
  const [incSeverity, setIncSeverity] = useState<'\uacbd\uc0c1' | '\uc911\uc0c1'>('\uacbd\uc0c1');
  const [incGpsLat, setIncGpsLat] = useState('');
  const [incGpsLng, setIncGpsLng] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incidents, setIncidents] = useState<IncidentRecord[]>(MOCK_INCIDENTS);

  const passCount = Object.values(checks).filter(Boolean).length;

  const loadChecks = () => {
    api.get('/api/platform/safety-checks').then(r => setExistingChecks(r.data?.items || r.data?.data || []))
      .catch(() => setExistingChecks(MOCK_CHECKS));
  };

  useEffect(() => {
    loadChecks();
  }, []);

  const handleSubmitCheck = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/platform/safety-checks', {
        checkType: '\ubc29\ud638\uc7a5\uce58',
        checkCycle: cycle,
        seasonType: season,
        floorStatus: checks['\ubc14\ub2e5\uc0c1\ud0dc'] ? '\uc801\ud569' : '\ubd80\uc801\ud569',
        lightingStatus: checks['\uc870\uba85'] ? '\uc801\ud569' : '\ubd80\uc801\ud569',
        safetyGear: checks['\uc548\uc804\uc7a5\uad6c'] ? '\uc801\ud569' : '\ubd80\uc801\ud569',
        equipStatus: checks['\uc7a5\ube44\uc0c1\ud0dc'] ? '\uc801\ud569' : '\ubd80\uc801\ud569',
        fenceStatus: checks['\ubc29\ud638\uc6b8\ud0c0\ub9ac'] ? '\uc801\ud569' : '\ubd80\uc801\ud569',
        weather: checks['\ub0a0\uc528'] ? '\uc801\ud569' : '\ubd80\uc801\ud569',
        result: passCount === 12 ? '\ud1b5\uacfc' : '\ubbf8\ud1b5\uacfc',
        note,
        issueDesc: issueDesc || undefined,
        issueCount: issueDesc ? 1 : 0,
        actionDesc: actionDesc || undefined,
        actionStatus: actionDesc ? '\uc870\uce58\uc644\ub8cc' : undefined,
      });
      alert('\uc548\uc804\uc810\uac80\uc774 \uc81c\ucd9c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
      setChecks(Object.fromEntries(CHECK_ITEMS.map(i => [i, false])));
      setNote('');
      setIssueDesc('');
      setActionDesc('');
      loadChecks();
    } catch (e: any) {
      alert(e?.response?.data?.error || '\uc81c\ucd9c \uc2e4\ud328');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitIncident = () => {
    if (!incDate || !incLocation || !incReporter || !incInjured) {
      alert('\ud544\uc218 \ud56d\ubaa9\uc744 \ubaa8\ub450 \uc785\ub825\ud574\uc8fc\uc138\uc694.');
      return;
    }
    const newIncident: IncidentRecord = {
      incidentId: `INC-2026-${String(incidents.length + 1).padStart(3, '0')}`,
      date: incDate,
      location: incLocation,
      reporter: incReporter,
      injuredPerson: incInjured,
      bodyPart: incBodyPart,
      severity: incSeverity,
      gpsLat: Number(incGpsLat) || 0,
      gpsLng: Number(incGpsLng) || 0,
      status: '\uc811\uc218',
      description: incDesc,
    };
    setIncidents([newIncident, ...incidents]);
    setIncDate(''); setIncLocation(''); setIncReporter(''); setIncInjured('');
    setIncGpsLat(''); setIncGpsLng(''); setIncDesc('');
    alert('\uc0ac\uace0\uae30\ub85d\uc774 \uc811\uc218\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
  };

  const severityColor = (s: string) => s === '\uc911\uc0c1' ? '#EF4444' : '#F0A500';
  const statusColor = (s: string) => s === '\uc644\ub8cc' ? '#22C55E' : s === '\uc870\uc0ac\uc911' ? '#F0A500' : '#3B82F6';

  return (
    <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <h1 className="text-xl font-bold mb-4">\uc548\uc804\uccb4\ud06c</h1>

      {/* Workflow tabs */}
      <div className="flex gap-2 mb-6">
        {([['check', '1. \uc810\uac80'], ['issue', '2. \uc9c0\uc801'], ['action', '3. \uc870\uce58'], ['confirm', '4. \ud655\uc778'], ['incident', '5. \uc0ac\uace0\uae30\ub85d']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setActionTab(k as MainTab)} className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: actionTab === k ? (k === 'incident' ? '#EF444420' : '#22C55E20') : '#0C1520',
              color: actionTab === k ? (k === 'incident' ? '#EF4444' : '#22C55E') : '#64748B',
              border: `1px solid ${actionTab === k ? (k === 'incident' ? '#EF4444' : '#22C55E') : '#1E293B'}`,
            }}>
            {l}
          </button>
        ))}
      </div>

      {actionTab === 'check' && (
        <>
          <div className="flex gap-4 mb-6">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#64748B' }}>\uc810\uac80\uc8fc\uae30</label>
              <select value={cycle} onChange={e => setCycle(e.target.value)} className="px-3 py-2 rounded text-sm" style={inputStyle}>
                {CYCLES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#64748B' }}>\uacc4\uc808\uc810\uac80</label>
              <select value={season} onChange={e => setSeason(e.target.value)} className="px-3 py-2 rounded text-sm" style={inputStyle}>
                {SEASONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={card} className="rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#22C55E' }}>12\ud56d\ubaa9 \ubc29\ud638\uc7a5\uce58 \uc810\uac80</h2>
              <span className="text-xs font-mono" style={{ color: passCount === 12 ? '#22C55E' : '#F0A500' }}>{passCount}/12</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CHECK_ITEMS.map(item => (
                <label key={item} className="flex items-center gap-2 text-sm cursor-pointer py-1" style={{ color: checks[item] ? '#22C55E' : '#94A3B8' }}>
                  <input type="checkbox" checked={checks[item]} onChange={() => setChecks({ ...checks, [item]: !checks[item] })} style={{ accentColor: '#22C55E' }} />
                  {item}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-xs block mb-1" style={{ color: '#64748B' }}>\ube44\uace0</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full px-3 py-2 rounded text-sm" style={inputStyle} />
            </div>
            <button onClick={handleSubmitCheck} disabled={submitting} className="mt-4 px-6 py-2 rounded font-bold text-sm"
              style={{ background: '#22C55E', color: '#070C12', opacity: submitting ? 0.5 : 1 }}>
              {submitting ? '\uc81c\ucd9c\uc911...' : '\uc810\uac80 \uc81c\ucd9c'}
            </button>
          </div>

          {existingChecks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#64748B' }}>\uc81c\ucd9c\ub41c \uc810\uac80 ({existingChecks.length}\uac74)</h3>
              <div className="space-y-2">
                {existingChecks.map((c: any) => (
                  <div key={c.checkId} className="p-3 rounded flex justify-between items-center" style={card}>
                    <div className="text-sm">
                      {c.checkId} | {c.checkType || c.checkCycle || '-'} | {c.checkerName || '-'}
                      <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{c.checkedAt ? new Date(c.checkedAt).toLocaleDateString() : '-'} | {c.seasonType || '-'}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded" style={{ background: c.result === '\ud1b5\uacfc' ? '#22C55E20' : '#EF444420', color: c.result === '\ud1b5\uacfc' ? '#22C55E' : '#EF4444' }}>{c.result || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {actionTab === 'issue' && (
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>\uc9c0\uc801\uc0ac\ud56d \uc785\ub825</h2>
          <textarea placeholder="\uc9c0\uc801\uc0ac\ud56d\uc744 \uc785\ub825\ud558\uc138\uc694..." rows={4} value={issueDesc} onChange={e => setIssueDesc(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm mb-4" style={inputStyle} />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="text-xs mb-2" style={{ color: '#64748B' }}>\uc870\uce58 \uc804 \uc0ac\uc9c4</div>
              <div className="h-32 rounded flex items-center justify-center" style={{ background: '#111B2A', border: '1px dashed #334155', color: '#64748B' }}>[\uc0ac\uc9c4 \uc5c5\ub85c\ub4dc]</div></div>
            <div><div className="text-xs mb-2" style={{ color: '#64748B' }}>\ud604\uc7a5 \uc804\uacbd</div>
              <div className="h-32 rounded flex items-center justify-center" style={{ background: '#111B2A', border: '1px dashed #334155', color: '#64748B' }}>[\uc0ac\uc9c4 \uc5c5\ub85c\ub4dc]</div></div>
          </div>
          <button className="px-6 py-2 rounded font-bold text-sm" style={{ background: '#F0A500', color: '#070C12' }}>\uc9c0\uc801\uc0ac\ud56d \ub4f1\ub85d</button>
        </div>
      )}

      {actionTab === 'action' && (
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#3B82F6' }}>\uc870\uce58\ub0b4\uc6a9 \uc785\ub825</h2>
          {issueDesc && <div className="mb-4 p-3 rounded text-sm" style={{ background: '#F0A50015', color: '#F0A500' }}>\uc9c0\uc801\uc0ac\ud56d: {issueDesc}</div>}
          <textarea placeholder="\uc870\uce58\ub0b4\uc6a9\uc744 \uc785\ub825\ud558\uc138\uc694..." rows={4} value={actionDesc} onChange={e => setActionDesc(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm mb-4" style={inputStyle} />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="text-xs mb-2" style={{ color: '#64748B' }}>\uc870\uce58 \uc804 \uc0ac\uc9c4</div>
              <div className="h-32 rounded flex items-center justify-center" style={{ background: '#111B2A', border: '1px dashed #EF4444', color: '#EF4444' }}>[\uc870\uce58 \uc804]</div></div>
            <div><div className="text-xs mb-2" style={{ color: '#64748B' }}>\uc870\uce58 \ud6c4 \uc0ac\uc9c4</div>
              <div className="h-32 rounded flex items-center justify-center" style={{ background: '#111B2A', border: '1px dashed #22C55E', color: '#22C55E' }}>[\uc870\uce58 \ud6c4]</div></div>
          </div>
          <button className="px-6 py-2 rounded font-bold text-sm" style={{ background: '#3B82F6', color: '#fff' }}>\uc870\uce58\uc644\ub8cc \ub4f1\ub85d</button>
        </div>
      )}

      {actionTab === 'confirm' && (
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#22C55E' }}>\ud655\uc778 \uc644\ub8cc</h2>
          <div className="space-y-3">
            {existingChecks.filter((c: any) => c.issueDesc).map((c: any, i: number) => (
              <div key={c.checkId || i} className="flex items-center justify-between p-3 rounded" style={elevated}>
                <div className="text-sm">
                  <span style={{ color: '#EF4444' }}>{c.issueDesc || '\uc9c0\uc801\uc0ac\ud56d'}</span> -&gt; <span style={{ color: '#3B82F6' }}>{c.actionDesc || '\uc870\uce58 \ub0b4\uc6a9'}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: c.actionStatus === '\ud655\uc778\uc644\ub8cc' ? '#22C55E20' : '#F0A50020', color: c.actionStatus === '\ud655\uc778\uc644\ub8cc' ? '#22C55E' : '#F0A500' }}>
                  {c.actionStatus || '\ub300\uae30'}
                </span>
              </div>
            ))}
            {existingChecks.filter((c: any) => c.issueDesc).length === 0 && (
              <div className="text-sm" style={{ color: '#64748B' }}>\uc9c0\uc801\uc0ac\ud56d\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>
            )}
          </div>
        </div>
      )}

      {actionTab === 'incident' && (
        <>
          {/* Workflow notice */}
          <div className="mb-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ background: '#EF444410', border: '1px solid #EF444430', color: '#EF4444' }}>
            <span className="font-bold">\uc571\ubc84\ud2bc \u2192 \uc989\uc2dc\uc2e0\uace0</span> | \ud604\uc7a5\uc5d0\uc11c \uc0ac\uace0 \ubc1c\uc0dd \uc2dc \uc571 \ubc84\ud2bc\uc744 \ub204\ub974\uba74 GPS \uc88c\ud45c\uc640 \ud568\uaed8 \uc989\uc2dc \uc2e0\uace0\ub429\ub2c8\ub2e4.
          </div>

          {/* Incident form */}
          <div style={card} className="rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#EF4444' }}>\uc0ac\uace0 \uc2e0\uace0 \uc591\uc2dd</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\uc0ac\uace0 \uc77c\uc2dc *</label>
                <input type="date" value={incDate} onChange={e => setIncDate(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\uc0ac\uace0 \uc7a5\uc18c *</label>
                <input value={incLocation} onChange={e => setIncLocation(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="\ud604\uc7a5\uba85 + \uc704\uce58" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\uc2e0\uace0\uc790 *</label>
                <input value={incReporter} onChange={e => setIncReporter(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\ubd80\uc0c1\uc790 *</label>
                <input value={incInjured} onChange={e => setIncInjured(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\ubd80\uc0c1 \ubd80\uc704</label>
                <select value={incBodyPart} onChange={e => setIncBodyPart(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {BODY_PARTS.map(bp => <option key={bp}>{bp}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\uc911\ub300\uc131</label>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ color: incSeverity === '\uacbd\uc0c1' ? '#F0A500' : '#64748B' }}>
                    <input type="radio" name="severity" checked={incSeverity === '\uacbd\uc0c1'} onChange={() => setIncSeverity('\uacbd\uc0c1')} style={{ accentColor: '#F0A500' }} />
                    \uacbd\uc0c1
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer" style={{ color: incSeverity === '\uc911\uc0c1' ? '#EF4444' : '#64748B' }}>
                    <input type="radio" name="severity" checked={incSeverity === '\uc911\uc0c1'} onChange={() => setIncSeverity('\uc911\uc0c1')} style={{ accentColor: '#EF4444' }} />
                    \uc911\uc0c1
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>GPS \uc704\ub3c4</label>
                <input value={incGpsLat} onChange={e => setIncGpsLat(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="37.xxxx" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>GPS \uacbd\ub3c4</label>
                <input value={incGpsLng} onChange={e => setIncGpsLng(e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="127.xxxx" />
              </div>
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>\uc0ac\uace0 \uc124\uba85</label>
                <textarea value={incDesc} onChange={e => setIncDesc(e.target.value)} rows={3} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="\uc0ac\uace0 \uacbd\uc704\ub97c \uc0c1\uc138\ud788 \uc785\ub825\ud558\uc138\uc694..." />
              </div>
            </div>
            <button onClick={handleSubmitIncident} className="mt-4 px-6 py-2 rounded font-bold text-sm"
              style={{ background: '#EF4444', color: '#fff' }}>
              \uc0ac\uace0 \uc2e0\uace0 \uc811\uc218
            </button>
          </div>

          {/* Incident list */}
          <div style={card} className="rounded-lg p-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#F0A500' }}>\uc0ac\uace0 \uae30\ub85d \ubaa9\ub85d ({incidents.length}\uac74)</h2>
            <div className="space-y-3">
              {incidents.map(inc => (
                <div key={inc.incidentId} style={elevated} className="rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-mono font-semibold" style={{ color: '#F1F5F9' }}>{inc.incidentId}</div>
                      <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                        {inc.date} | {inc.location}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded font-bold"
                        style={{ background: severityColor(inc.severity) + '20', color: severityColor(inc.severity) }}>
                        {inc.severity}
                      </span>
                      <span className="text-xs px-2 py-1 rounded font-bold"
                        style={{ background: statusColor(inc.status) + '20', color: statusColor(inc.status) }}>
                        {inc.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: '#94A3B8' }}>
                    \uc2e0\uace0: {inc.reporter} | \ubd80\uc0c1\uc790: {inc.injuredPerson} | \ubd80\uc704: {inc.bodyPart} | GPS: {inc.gpsLat}, {inc.gpsLng}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>{inc.description}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
