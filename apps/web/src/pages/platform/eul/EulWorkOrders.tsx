import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const MOCK_ORDERS = [
  { workId: 'WO-MOCK01', workType: '설치', panelType: 'RPP', currentStatus: '작업대기', workLengthM: 250, siteId: 'SITE-001', contractType: '바이백', frameType: 'H빔', tbmCompleted: true },
  { workId: 'WO-MOCK02', workType: '해체', panelType: '스틸', currentStatus: '호출중', workLengthM: 160, siteId: 'SITE-002', contractType: '구매', frameType: '파이프', tbmCompleted: false },
  { workId: 'WO-MOCK03', workType: '보수', panelType: 'RPP', currentStatus: '지시생성', workLengthM: 80, siteId: 'SITE-001', contractType: '월임대', frameType: 'H빔', tbmCompleted: true },
];

const STATUS_FLOW = ['지시생성', '호출중', '매칭완료', '작업대기', '작업중', '작업완료', '일보입력완료', '정산대기', '정산완료', '봉인완료'] as const;

const statusColor: Record<string, string> = {
  '지시생성': '#64748B',
  '호출중': '#F0A500',
  '매칭완료': '#3B82F6',
  '작업대기': '#00D9CC',
  '작업중': '#22C55E',
  '작업완료': '#10B981',
  '일보입력완료': '#8B5CF6',
  '정산대기': '#F0A500',
  '정산완료': '#3B82F6',
  '봉인완료': '#8B5CF6',
};

const WORK_TYPES = ['설치', '해체', '보수'] as const;
const CONTRACT_TYPES = ['바이백', '구매', '월임대'] as const;
const FRAME_TYPES = ['H빔', '파이프'] as const;
const FOUNDATION_TYPES = ['근입', '베이스판', '직타'] as const;
const WORK_DIRECTIONS = ['L->R', 'R->L'] as const;
const POST_ANGLES = ['직각', '경사'] as const;
const POST_RATIOS = ['1:1', '2:1'] as const;
const ASSIGN_METHODS = ['일반', '안심'] as const;
const PAY_METHODS = ['바로지급', '1~15일', '16~말일'] as const;

interface FormData {
  siteId: string;
  workType: string;
  contractType: string;
  panelType: string;
  frameType: string;
  spanM: string;
  postRatio: string;
  foundationType: string;
  embedDepthM: string;
  workDirection: string;
  workLengthM: string;
  crossbarCount: string;
  postAngle: string;
  assignMethod: string;
  payMethod: string;
  supervisorId: string;
  guiderId: string;
  basicEquipNeeded: boolean;
  specialEquipCond: string;
  augerDiameterMm: string;
  note: string;
}

const INITIAL_FORM: FormData = {
  siteId: '', workType: '설치', contractType: '바이백', panelType: '', frameType: 'H빔',
  spanM: '1.8', postRatio: '1:1', foundationType: '근입', embedDepthM: '',
  workDirection: 'L->R', workLengthM: '', crossbarCount: '', postAngle: '직각',
  assignMethod: '일반', payMethod: '바로지급', supervisorId: '', guiderId: '',
  basicEquipNeeded: false, specialEquipCond: '', augerDiameterMm: '', note: '',
};

export default function EulWorkOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [sites, setSites] = useState<any[]>([]);

  const loadOrders = () => {
    api.get('/api/platform/work-orders').then(r => setOrders(r.data?.items || r.data?.data || []))
      .catch(() => setOrders(MOCK_ORDERS));
  };

  useEffect(() => {
    loadOrders();
    api.get('/api/platform/sites').then(r => setSites(r.data?.items || [])).catch(() => {});
  }, []);

  const updateField = (key: keyof FormData, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/platform/work-orders', {
        ...form,
        spanM: form.spanM ? Number(form.spanM) : undefined,
        embedDepthM: form.embedDepthM ? Number(form.embedDepthM) : undefined,
        workLengthM: form.workLengthM ? Number(form.workLengthM) : undefined,
        crossbarCount: form.crossbarCount ? Number(form.crossbarCount) : undefined,
        augerDiameterMm: form.augerDiameterMm ? Number(form.augerDiameterMm) : undefined,
      });
      setShowCreate(false);
      setForm({ ...INITIAL_FORM });
      setWizardStep(0);
      loadOrders();
    } catch (e: any) {
      alert(e?.response?.data?.error || '생성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (workId: string, currentStatus: string) => {
    const idx = STATUS_FLOW.indexOf(currentStatus as any);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const targetStatus = STATUS_FLOW[idx + 1];
    try {
      await api.patch(`/api/platform/work-orders/${workId}/status`, { targetStatus });
      loadOrders();
    } catch (e: any) {
      alert(e?.response?.data?.error || '상태 전이 실패');
    }
  };

  const inputStyle = { background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' };
  const labelStyle = { color: '#64748B' };
  const wizardLabels = ['기본', '구조', '배정'];

  return (
    <div className="p-8" style={{ background: '#070C12', minHeight: '100vh', color: '#F1F5F9' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">작업지시</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#00D9CC', color: '#070C12' }}>
          {showCreate ? '취소' : '+ 작업지시 생성'}
        </button>
      </div>

      {/* 10-state flow visual */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max px-2 py-3 rounded-lg" style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
          {STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="text-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto" style={{ background: statusColor[s] + '30', color: statusColor[s], border: `1px solid ${statusColor[s]}` }}>
                  {i + 1}
                </div>
                <div className="text-xs mt-1 whitespace-nowrap" style={{ color: statusColor[s], fontSize: '10px' }}>{s}</div>
              </div>
              {i < STATUS_FLOW.length - 1 && <div className="w-4 h-px mx-0.5" style={{ background: '#334155' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Creation Wizard */}
      {showCreate && (
        <div style={{ background: '#0C1520', border: '1px solid #1E293B' }} className="rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#00D9CC' }}>새 작업지시 (3단계 입력)</h2>

          {/* Wizard steps */}
          <div className="flex gap-2 mb-6">
            {wizardLabels.map((label, i) => (
              <button key={label} onClick={() => setWizardStep(i)} className="px-4 py-2 rounded text-sm font-medium"
                style={{ background: wizardStep === i ? '#00D9CC' : '#1E293B', color: wizardStep === i ? '#070C12' : '#64748B' }}>
                {i + 1}. {label}
              </button>
            ))}
          </div>

          {/* Step 0: 기본 */}
          {wizardStep === 0 && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>현장 (siteId)</label>
                <select value={form.siteId} onChange={e => updateField('siteId', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  <option value="">선택</option>
                  {sites.map(s => <option key={s.siteId} value={s.siteId}>{s.siteName || s.siteId}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>작업유형</label>
                <select value={form.workType} onChange={e => updateField('workType', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>계약유형</label>
                <select value={form.contractType} onChange={e => updateField('contractType', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <label className="text-xs mb-1 block" style={labelStyle}>비고</label>
                <textarea value={form.note} onChange={e => updateField('note', e.target.value)} rows={2} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Step 1: 구조 */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>판넬유형</label>
                <input value={form.panelType} onChange={e => updateField('panelType', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="예: RPP, 스틸" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>프레임유형</label>
                <select value={form.frameType} onChange={e => updateField('frameType', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {FRAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>경간(M) 1.5~3.0</label>
                <input type="number" step="0.1" min="1.5" max="3.0" value={form.spanM} onChange={e => updateField('spanM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>지주비</label>
                <select value={form.postRatio} onChange={e => updateField('postRatio', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {POST_RATIOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>기초유형</label>
                <select value={form.foundationType} onChange={e => updateField('foundationType', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {FOUNDATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>근입깊이(M)</label>
                <input type="number" step="0.1" value={form.embedDepthM} onChange={e => updateField('embedDepthM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>시공방향</label>
                <select value={form.workDirection} onChange={e => updateField('workDirection', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {WORK_DIRECTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>시공연장(M)</label>
                <input type="number" value={form.workLengthM} onChange={e => updateField('workLengthM', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>횡대수</label>
                <input type="number" value={form.crossbarCount} onChange={e => updateField('crossbarCount', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>지주각도</label>
                <select value={form.postAngle} onChange={e => updateField('postAngle', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {POST_ANGLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: 배정 */}
          {wizardStep === 2 && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>배정방법</label>
                <select value={form.assignMethod} onChange={e => updateField('assignMethod', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {ASSIGN_METHODS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>결제방법</label>
                <select value={form.payMethod} onChange={e => updateField('payMethod', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle}>
                  {PAY_METHODS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>감독자ID</label>
                <input value={form.supervisorId} onChange={e => updateField('supervisorId', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>유도자ID</label>
                <input value={form.guiderId} onChange={e => updateField('guiderId', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>기본장비 필요</label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={form.basicEquipNeeded} onChange={e => updateField('basicEquipNeeded', e.target.checked)} style={{ accentColor: '#00D9CC' }} />
                  <span style={{ color: form.basicEquipNeeded ? '#00D9CC' : '#64748B' }}>{form.basicEquipNeeded ? '필요' : '불필요'}</span>
                </label>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>특수장비 조건</label>
                <input value={form.specialEquipCond} onChange={e => updateField('specialEquipCond', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={labelStyle}>오거직경(mm)</label>
                <input type="number" value={form.augerDiameterMm} onChange={e => updateField('augerDiameterMm', e.target.value)} className="w-full px-3 py-2 rounded" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <button onClick={() => setWizardStep(Math.max(0, wizardStep - 1))} disabled={wizardStep === 0}
              className="px-4 py-2 rounded text-sm" style={{ background: '#1E293B', color: wizardStep === 0 ? '#334155' : '#F1F5F9' }}>
              이전
            </button>
            <div className="flex gap-2">
              {wizardStep < 2 ? (
                <button onClick={() => setWizardStep(wizardStep + 1)} className="px-6 py-2 rounded text-sm font-bold" style={{ background: '#00D9CC', color: '#070C12' }}>
                  다음
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 rounded text-sm font-bold" style={{ background: '#00D9CC', color: '#070C12', opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? '생성중...' : '작업지시 생성'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List view */}
      <div className="space-y-2">
        {orders.map(o => {
          const color = statusColor[o.currentStatus] || '#64748B';
          const tbmWarning = o.tbmCompleted === false;
          const statusIdx = STATUS_FLOW.indexOf(o.currentStatus);
          const canAdvance = statusIdx >= 0 && statusIdx < STATUS_FLOW.length - 1;

          return (
            <div key={o.workId} style={{ background: '#0C1520', border: `1px solid ${tbmWarning ? '#EF4444' : '#1E293B'}` }} className="rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{o.workId} | {o.workType} | {o.panelType || '-'} | {o.workLengthM || '-'}M</div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {o.siteId} | {o.contractType || '-'} | {o.frameType || '-'}
                  </div>
                  {tbmWarning && (
                    <div className="text-xs mt-1 font-bold" style={{ color: '#EF4444' }}>
                      [!] TBM 미완료 - 작업 전환 차단
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded font-mono" style={{ background: color + '20', color }}>
                    {o.currentStatus}
                  </span>
                  {canAdvance && (
                    <button onClick={() => handleTransition(o.workId, o.currentStatus)}
                      className="text-xs px-3 py-1 rounded font-bold" style={{ background: '#1E293B', color: '#00D9CC', border: '1px solid #00D9CC' }}>
                      상태 전이
                    </button>
                  )}
                </div>
              </div>
              {/* Mini status flow */}
              <div className="flex items-center gap-0.5 mt-2">
                {STATUS_FLOW.map((s, i) => (
                  <div key={s} className="h-1 flex-1 rounded-full" style={{ background: i <= statusIdx ? color : '#1E293B' }} />
                ))}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <div className="text-center py-12 text-sm" style={{ color: '#64748B' }}>작업지시가 없습니다.</div>}
      </div>
    </div>
  );
}
