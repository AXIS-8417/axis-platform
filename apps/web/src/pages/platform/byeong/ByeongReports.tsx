import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const MOCK_REPORTS = [
  { reportId: 'RPT-MOCK01', workId: 'WO-001', workType: '설치', weather: '맑음', sealId: 'SEAL-001', sectionStartM: 0, sectionEndM: 120, panelType: 'RPP', createdAt: '2026-03-18' },
  { reportId: 'RPT-MOCK02', workId: 'WO-001', workType: '설치', weather: '흐림', sealId: null, sectionStartM: 120, sectionEndM: 250, panelType: '스틸', createdAt: '2026-03-19' },
];

const MOCK_WORK_ORDERS = [
  { workId: 'WO-001', workType: '설치', siteId: 'SITE-001' },
  { workId: 'WO-002', workType: '해체', siteId: 'SITE-002' },
];

const WEATHER_OPTIONS = ['맑음', '흐림', '비', '눈', '강풍'] as const;
const FOUNDATION_TYPES = ['근입', '베이스판', '직타'] as const;
const POST_ANGLES = ['직각', '경사'] as const;
const WORK_DIRECTIONS = ['L->R', 'R->L'] as const;

interface ReportForm {
  workId: string;
  workType: string;
  workDirection: string;
  sectionStartM: string;
  sectionEndM: string;
  panelType: string;
  panelDesc: string;
  weather: string;
  frameLengthM: string;
  panelLengthM: string;
  foundationType: string;
  embedDepthM: string;
  postAngle: string;
  span: string;
  postRatio: string;
  crossbarCount: string;
  gapDistanceM: string;
  gapReason: string;
  note: string;
}

const INITIAL_FORM: ReportForm = {
  workId: '', workType: '설치', workDirection: 'L->R', sectionStartM: '', sectionEndM: '',
  panelType: '', panelDesc: '', weather: '맑음', frameLengthM: '', panelLengthM: '',
  foundationType: '근입', embedDepthM: '', postAngle: '직각', span: '', postRatio: '1:1',
  crossbarCount: '', gapDistanceM: '', gapReason: '', note: '',
};

export default function ByeongReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ReportForm>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<string>('GPS 좌표 로딩 중...');

  const loadReports = () => {
    api.get('/api/platform/reports').then(r => setReports(r.data?.items || r.data?.data || []))
      .catch(() => setReports(MOCK_REPORTS));
  };

  useEffect(() => {
    loadReports();
    api.get('/api/platform/work-orders').then(r => setWorkOrders(r.data?.items || r.data?.data || []))
      .catch(() => setWorkOrders(MOCK_WORK_ORDERS));

    // GPS placeholder
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords(`${pos.coords.latitude.toFixed(4)}N, ${pos.coords.longitude.toFixed(4)}E`),
        () => setGpsCoords('37.5665N, 126.9780E (기본값)')
      );
    } else {
      setGpsCoords('37.5665N, 126.9780E (기본값)');
    }
  }, []);

  const updateField = (key: keyof ReportForm, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.workId) { alert('작업지시를 선택하세요.'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/platform/reports', {
        ...form,
        sectionStartM: form.sectionStartM ? Number(form.sectionStartM) : undefined,
        sectionEndM: form.sectionEndM ? Number(form.sectionEndM) : undefined,
        frameLengthM: form.frameLengthM ? Number(form.frameLengthM) : undefined,
        panelLengthM: form.panelLengthM ? Number(form.panelLengthM) : undefined,
        embedDepthM: form.embedDepthM ? Number(form.embedDepthM) : undefined,
        crossbarCount: form.crossbarCount ? Number(form.crossbarCount) : undefined,
        gapDistanceM: form.gapDistanceM ? Number(form.gapDistanceM) : undefined,
      });
      setShowCreate(false);
      setForm({ ...INITIAL_FORM });
      loadReports();
    } catch (e: any) {
      alert(e?.response?.data?.error || '작성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' };
  const labelStyle = { color: '#64748B' };
  const hasGap = Number(form.gapDistanceM) > 0;

  return (
    <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">시공일보</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#22C55E', color: '#070C12' }}>
          {showCreate ? '취소' : '+ 시공일보 작성'}
        </button>
      </div>

      {/* Creation Form */}
      {showCreate && (
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#22C55E' }}>새 시공일보 작성</h2>
          <div className="text-xs mb-4 px-2 py-1 rounded inline-block" style={{ background: '#00D9CC15', color: '#00D9CC' }}>
            GPS: {gpsCoords}
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            {/* Row 1 */}
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>작업지시 (workId)</label>
              <select value={form.workId} onChange={e => { updateField('workId', e.target.value); const wo = workOrders.find(w => w.workId === e.target.value); if (wo) updateField('workType', wo.workType); }}
                className="w-full px-3 py-2 rounded" style={inputStyle}>
                <option value="">선택</option>
                {workOrders.map(w => <option key={w.workId} value={w.workId}>{w.workId} ({w.workType})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>작업유형</label>
              <input value={form.workType} readOnly className="w-full px-3 py-2 rounded" style={{ ...inputStyle, opacity: 0.7 }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>시공방향</label>
              <select value={form.workDirection} onChange={e => updateField('workDirection', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                {WORK_DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Row 2 */}
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>구간 시작(M)</label>
              <input type="number" value={form.sectionStartM} onChange={e => updateField('sectionStartM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>구간 끝(M)</label>
              <input type="number" value={form.sectionEndM} onChange={e => updateField('sectionEndM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>날씨</label>
              <select value={form.weather} onChange={e => updateField('weather', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            {/* Row 3 */}
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>판넬유형</label>
              <input value={form.panelType} onChange={e => updateField('panelType', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="예: RPP" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>판넬설명</label>
              <input value={form.panelDesc} onChange={e => updateField('panelDesc', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>프레임길이(M)</label>
              <input type="number" step="0.1" value={form.frameLengthM} onChange={e => updateField('frameLengthM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>

            {/* Row 4 */}
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>판넬길이(M)</label>
              <input type="number" step="0.1" value={form.panelLengthM} onChange={e => updateField('panelLengthM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>기초유형</label>
              <select value={form.foundationType} onChange={e => updateField('foundationType', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                {FOUNDATION_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>근입깊이(M)</label>
              <input type="number" step="0.1" value={form.embedDepthM} onChange={e => updateField('embedDepthM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>

            {/* Row 5 */}
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>지주각도</label>
              <select value={form.postAngle} onChange={e => updateField('postAngle', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                {POST_ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>경간(span)</label>
              <input value={form.span} onChange={e => updateField('span', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="예: 1.8" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>지주비</label>
              <input value={form.postRatio} onChange={e => updateField('postRatio', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="예: 1:1" />
            </div>

            {/* Row 6 */}
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>횡대수</label>
              <input type="number" value={form.crossbarCount} onChange={e => updateField('crossbarCount', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={labelStyle}>이격거리(M)</label>
              <input type="number" step="0.01" value={form.gapDistanceM} onChange={e => updateField('gapDistanceM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
            {hasGap && (
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#F0A500' }}>이격사유 (필수)</label>
                <input value={form.gapReason} onChange={e => updateField('gapReason', e.target.value)} className="w-full px-3 py-2 rounded" style={{ ...inputStyle, borderColor: '#F0A500' }} />
              </div>
            )}

            {/* Note */}
            <div className={hasGap ? 'col-span-3' : 'col-span-2'}>
              <label className="text-xs mb-1 block" style={labelStyle}>비고</label>
              <textarea value={form.note} onChange={e => updateField('note', e.target.value)} rows={2} className="w-full px-3 py-2 rounded" style={inputStyle} />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 rounded text-sm font-bold" style={{ background: '#22C55E', color: '#070C12', opacity: submitting ? 0.5 : 1 }}>
              {submitting ? '저장중...' : '시공일보 저장'}
            </button>
          </div>
        </div>
      )}

      {/* List view */}
      <div className="space-y-2">
        {reports.map(r => {
          const isSealed = !!r.sealId;
          return (
            <div key={r.reportId} style={{ background: '#0C1520', border: `1px solid ${isSealed ? '#8B5CF6' : '#1E293B'}` }} className="rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">
                  {isSealed ? '[SEALED] ' : ''}{r.reportId} | {r.workType || '-'} | {r.sectionStartM ?? '?'}~{r.sectionEndM ?? '?'}M
                </div>
                <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                  {r.weather || '-'} | {r.panelType || '-'} | {r.workId || '-'} | {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                </div>
              </div>
              {isSealed ? (
                <span className="text-xs px-2 py-1 rounded" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>[SEALED] 봉인</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded" style={{ background: '#22C55E20', color: '#22C55E' }}>수정가능</span>
              )}
            </div>
          );
        })}
        {reports.length === 0 && <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>시공일보가 없습니다.</div>}
      </div>
    </div>
  );
}
