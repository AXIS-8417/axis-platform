import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuoteStore, type PanelType, type FloorType, type Region, type ConstructionType, type InstallTimeline, type Urgency } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';
import api from '../../lib/api';

const STEPS = [
  { id: 1, label: '현장위치', icon: '📍' },
  { id: 2, label: '연장(M)', icon: '✏️' },
  { id: 3, label: '판넬종류', icon: '🧱' },
  { id: 4, label: '높이+분진망', icon: '📐' },
  { id: 5, label: '기초조건', icon: '⛏' },
  { id: 6, label: '현장+일정', icon: '📋' },
];

const PANEL_OPTIONS: { value: PanelType | 'auto'; label: string; desc: string; icon: string }[] = [
  { value: 'RPP', label: 'RPP방음판', desc: '불투명 흰색 · 강화PVC(강화폴리염화비닐) · W670mm', icon: '⬜' },
  { value: 'EGI', label: 'EGI휀스', desc: '철판도금 · 최대4M · W550mm', icon: '🔲' },
  { value: '스틸', label: '스틸방음판', desc: '갈바늄 · 가로적층 · W1980mm', icon: '⬛' },
  { value: 'auto', label: '모르겠어요', desc: '→ RPP방음판으로 처리', icon: '❓' },
];

const FLOOR_OPTIONS: { value: FloorType; label: string; desc: string; sub: string }[] = [
  { value: '파이프박기', label: '파이프박기', desc: '지반 직접 타입 — 일반 현장', sub: '가장 일반적' },
  { value: '콘크리트', label: '콘크리트', desc: '앙카+베이스판 — 콘크리트 바닥', sub: '도심지/실내' },
  { value: '모름', label: '모르겠어요', desc: '파이프박기로 처리', sub: 'DEFAULT' },
];

const QUICK_LOCS = ['서울시 강남구', '경기도 성남시', '인천광역시', '경기도 파주시', '서울시 강서구'];

const SCALE = [
  { max: 50, c: 1.60, label: '소규모' },
  { max: 150, c: 1.03, label: '중소' },
  { max: 300, c: 1.00, label: '중(기준)' },
  { max: Infinity, c: 0.97, label: '대' },
];
function scaleFn(l: number) {
  for (const s of SCALE) if (l <= s.max) return s;
  return SCALE[SCALE.length - 1];
}

// HWP 확정표 §2.5 — 파이프타입 기준 (사용자 확인 완료 2026-03-21)
// 6M 표준형=5단, 1~3M 표준형=실전형과 동일
const XBAR: Record<string, Record<number, number>> = {
  실전형: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 7, 10: 7 },
  표준형: { 1: 2, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5, 7: 7, 8: 8, 9: 8, 10: 8 },
};

function stType(h: number, mode: string) {
  if (h <= 3) return '비계식';
  if (h <= 4 && mode === '실전형') return '비계식';
  if (h <= 5) return '비계식+보조지주';
  return 'H빔식';
}

function inferRegion(address: string): Region | null {
  const s = address.replace(/\s/g, '');
  if (/제주/.test(s)) return '제주';
  if (/부산/.test(s)) return '부산';
  if (/강릉|속초|동해|삼척/.test(s)) return '강원해안';
  if (/강원|춘천|원주/.test(s)) return '강원내륙';
  if (/서산|태안|당진/.test(s)) return '충남서해';
  if (/충청|충남|충북|세종|대전/.test(s)) return '충청';
  if (/전라|광주|순천|여수/.test(s)) return '전라';
  if (/경상|대구|울산|창원|포항/.test(s)) return '경상';
  if (/안산|시흥|평택|화성|수원/.test(s)) return '경기서해안';
  if (/의정부|파주|고양|포천|양주/.test(s)) return '경기북부';
  if (/인천/.test(s)) return '인천';
  if (/서울/.test(s)) return '서울';
  if (/경기/.test(s)) return '경기남부';
  return null;
}

function getHeightSteps(panel: PanelType | null): number[] {
  if (panel === 'EGI') return [1, 1.8, 2, 2.4, 3, 4, 5, 6, 7, 8, 9, 10];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

export default function NewQuote() {
  const navigate = useNavigate();
  const store = useQuoteStore();
  const [step, setStepLocal] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [autoPanel, setAutoPanel] = useState(false); // '모르겠어요' 선택 여부

  const goNext = () => { if (step < 6) setStepLocal(step + 1); };
  const goBack = () => { if (step > 1) setStepLocal(step - 1); };

  const handleAddressChange = (val: string) => {
    store.setField('address', val);
    const region = inferRegion(val);
    if (region) store.setField('region', region);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/api/estimates', {
        addr: store.address, region: store.region,
        lenM: store.length, panelType: store.panelType,
        heightM: store.height, floorType: store.floorType,
        constructionType: store.constructionType,
        isBedrock: store.isBedrock,
        installTimeline: store.installTimeline,
        urgency: store.urgency,
      });
      store.setEstimateId(data.id);
      navigate(`/quote/matrix/${data.id}`);
    } catch {
      const fallbackId = 'local-' + Date.now();
      store.setEstimateId(fallbackId);
      navigate(`/quote/matrix/${fallbackId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const heightSteps = getHeightSteps(store.panelType);
  const isGangnam = (store.address || '').includes('강남');
  const sc = scaleFn(store.length || 0);
  const hk = Math.min(10, Math.round(store.height || 3));

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!store.address && !!store.region;
      case 2: return store.length > 0;
      case 3: return !!store.panelType || autoPanel;
      case 4: return store.height > 0;
      case 5: return !!store.floorType;
      case 6: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
      {/* Header */}
      <div className="border-b border-[#e2e8f0] px-6 py-4 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-[#1e40af] text-white px-2 py-0.5 rounded">AXIS v4.7</span>
          <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded font-semibold">STEP 1</span>
          <span className="text-[15px] font-bold text-[#0f172a]">현장 조건 입력</span>
        </div>
        <div className="text-[11px] text-[#64748b] mt-1">갑(발주처) · 6개 질문 + 추가 선택 · 약 30초</div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        <Stepper step={1} />

        {/* Progress bar */}
        <div className="h-[3px] bg-[#e5e7eb] rounded-full overflow-hidden mb-1">
          <div className="h-full bg-[#3b82f6] rounded-full transition-all" style={{ width: `${(step / 6) * 100}%` }} />
        </div>
        <div className="flex justify-between mb-4 text-[11px] text-[#94a3b8]">
          <span>{step} / 6</span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-5 h-1 rounded-sm ${i < step ? 'bg-[#3b82f6]' : 'bg-[#e2e8f0]'}`} />
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-4"
          >
            {/* Q1: Address */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2 items-start">
                  <span className="text-xl">📍</span>
                  <div>
                    <h2 className="text-[15px] font-bold text-[#0f172a]">현장 위치는?</h2>
                    <p className="text-xs text-[#64748b]">운반비·풍속·권역 자동 산출에 활용됩니다</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#64748b] mb-1 block">시도 + 시군구 입력</label>
                  <input
                    type="text" value={store.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className="w-full px-3 py-3 border-[1.5px] border-[#e2e8f0] rounded-lg text-[15px] text-[#0f172a] bg-[#fafafa] focus:outline-none focus:border-[#3b82f6]"
                    placeholder="예: 서울시 강남구 삼성동" autoFocus
                  />
                </div>
                {isGangnam && (
                  <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1]">
                    💡 강남 지역 감지 → 홀딩도어 수직포망(2.4M×1M, 25,000원/장) 자동 추천됩니다.
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {QUICK_LOCS.map(loc => (
                    <button key={loc} onClick={() => handleAddressChange(loc)}
                      className="text-[11px] px-2.5 py-1 border border-[#e2e8f0] rounded-full bg-white text-[#475569] hover:border-[#93c5fd]">
                      {loc}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-[#64748b] mb-1 block">
                    지역 {store.region && <span className="text-[#2563eb] ml-1">(자동 추론됨)</span>}
                  </label>
                  <select value={store.region || ''} onChange={(e) => store.setField('region', e.target.value as Region)}
                    className="w-full px-3 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-lg text-sm text-[#0f172a] bg-[#fafafa]">
                    <option value="">지역 선택</option>
                    {['서울','경기남부','경기북부','경기서해안','인천','충청','충남서해','강원내륙','강원해안','전라','경상','부산','제주'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Q2: Length */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex gap-2 items-start">
                  <span className="text-xl">✏️</span>
                  <div>
                    <h2 className="text-[15px] font-bold text-[#0f172a]">방음벽 총 길이는?</h2>
                    <p className="text-xs text-[#64748b]">대략적인 수치 OK — 규모보정계수 자동 적용</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number" value={store.length || ''}
                    onChange={(e) => store.setField('length', Number(e.target.value))}
                    className="flex-1 px-3 py-3 border-[1.5px] border-[#e2e8f0] rounded-lg text-[22px] font-bold text-[#1d4ed8] bg-[#f0f9ff] text-right focus:outline-none focus:border-[#3b82f6]"
                    placeholder="250" min={1}
                  />
                  <span className="text-lg font-bold text-[#334155]">M</span>
                </div>
                {store.length > 0 && (
                  <div className="bg-[#f8fafc] rounded-lg p-3 flex gap-4 flex-wrap">
                    <div>
                      <div className="text-[11px] text-[#94a3b8]">규모</div>
                      <div className="text-[13px] font-semibold text-[#334155]">{sc.label}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#94a3b8]">보정계수</div>
                      <div className="text-[13px] font-semibold text-[#2563eb]">×{sc.c.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#94a3b8]">지주 수(예상)</div>
                      <div className="text-[13px] font-semibold text-[#334155]">약 {Math.ceil(store.length / 3) + 1}개</div>
                    </div>
                  </div>
                )}
                {store.length > 0 && store.length <= 50 && (
                  <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">
                    ⚠ 소규모 현장은 M당 단가가 기준 대비 약 60% 높아질 수 있습니다.
                  </div>
                )}
              </div>
            )}

            {/* Q3: Panel Type */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex gap-2 items-start">
                  <span className="text-xl">🧱</span>
                  <div>
                    <h2 className="text-[15px] font-bold text-[#0f172a]">방음벽 판넬 종류는?</h2>
                    <p className="text-xs text-[#64748b]">선택에 따라 높이 선택지가 달라집니다 (No.70)</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {PANEL_OPTIONS.map((opt) => {
                    const isAuto = opt.value === 'auto';
                    const isSelected = isAuto ? autoPanel : store.panelType === opt.value;
                    return (
                      <button key={opt.value}
                        onClick={() => {
                          if (isAuto) {
                            setAutoPanel(true);
                            store.setField('panelType', 'RPP');
                          } else {
                            setAutoPanel(false);
                            store.setField('panelType', opt.value as PanelType);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 border-[1.5px] rounded-lg text-left transition-all ${
                          isSelected ? 'border-[#3b82f6] bg-[#eff6ff]' : 'border-[#e2e8f0] bg-white hover:border-[#93c5fd]'
                        }`}>
                        <span className="text-xl">{opt.icon}</span>
                        <div className="flex-1">
                          <div className={`font-semibold text-[14px] ${isSelected ? 'text-[#1d4ed8]' : 'text-[#0f172a]'}`}>{opt.label}</div>
                          <div className="text-[11px] text-[#94a3b8]">{opt.desc}</div>
                        </div>
                        {isSelected && <span className="text-[#2563eb]">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {store.panelType === 'EGI' && (
                  <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">
                    ⚠ EGI 원장 최대 4.0M. 4.1M+ 이어붙임 필수 + 횡대 1단 추가. 6M+ RPP 전환 강력 권장.
                  </div>
                )}
              </div>
            )}

            {/* Q4: Height */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex gap-2 items-start">
                  <span className="text-xl">📐</span>
                  <div>
                    <h2 className="text-[15px] font-bold text-[#0f172a]">높이를 선택하세요</h2>
                    <p className="text-xs text-[#64748b]">{store.panelType || 'RPP'} 기준 — 판넬별 선택지 다름</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {heightSteps.map((h) => {
                    const hRound = Math.min(10, Math.round(h));
                    const hwDan = XBAR['실전형'][hRound] || 2;
                    return (
                      <button key={h} onClick={() => store.setField('height', h)}
                        className={`min-w-[54px] px-2 py-2.5 border-[1.5px] rounded-lg text-center transition-all ${
                          store.height === h
                            ? 'border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]'
                            : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#93c5fd]'
                        }`}>
                        <div className="font-bold text-[15px]">{h}M</div>
                        <div className={`text-[10px] ${store.height === h ? 'text-[#3b82f6]' : 'text-[#9ca3af]'}`}>{hwDan}단</div>
                      </button>
                    );
                  })}
                </div>
                {store.height > 0 && (
                  <div className="bg-[#f8fafc] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {([
                      ['구조 타입', stType(store.height, '실전형'), ''],
                      ['횡대(실전형)', (XBAR['실전형'][hk] || 2) + '단', '#2563eb'],
                      ['횡대(표준형)', (XBAR['표준형'][hk] || 3) + '단', '#7c3aed'],
                      ['기초(실전형)', store.height <= 4 ? '1.5M' : store.height <= 6 ? '2.0M' : '2.5M', ''],
                      ['기초(표준형)', store.height <= 2 ? '1.5M' : store.height <= 4 ? '2.0M' : store.height <= 5 ? '2.5M' : '3.0M', ''],
                      ['구조 보정', stType(store.height, '실전형') === 'H빔식' ? '×5.55' : stType(store.height, '실전형').includes('보조') ? '×2.18' : '×1.00', '#0369a1'],
                    ] as [string, string, string][]).map(([l, v, c]) => (
                      <div key={l}>
                        <div className="text-[10px] text-[#94a3b8]">{l}</div>
                        <div className="font-semibold text-[13px]" style={{ color: c || '#334155' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                {store.panelType === 'EGI' && store.height >= 4 && store.height < 6 && (
                  <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">
                    ⚠ EGI {store.height}M: 이어붙임 필수 + 횡대 1단 추가. RPP방음판 전환 권장.
                  </div>
                )}
                {store.panelType === 'EGI' && store.height >= 6 && (
                  <div className="bg-[#fef2f2] border-l-[3px] border-[#f87171] rounded-r-lg px-3 py-2 text-xs text-[#991b1b]">
                    🚨 EGI {store.height}M: RPP방음판 전환 강력 권장. 구조적 안전성 검토 필수.
                  </div>
                )}

                {/* 분진망 (높이와 연관 — Q4에 통합) */}
                <div className="border-t border-[#e5e7eb] pt-4 mt-2">
                  <div className="flex gap-2 items-start mb-3">
                    <span className="text-xl">◫</span>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0f172a]">분진망</h2>
                      <p className="text-xs text-[#64748b]">방음벽 상단에 분진망을 설치하나요?</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 0, label: '없음', tier: 0 },
                      { value: 1.0, label: '1.0M', tier: 1 },
                      { value: 1.5, label: '1.5M', tier: 1 },
                      { value: 2.0, label: '2.0M', tier: 2 },
                      { value: 2.5, label: '2.5M', tier: 2 },
                      { value: 3.0, label: '3.0M', tier: 3 },
                    ].map((opt) => (
                      <button key={opt.label} onClick={() => store.setField('dustH', opt.value)}
                        className={`p-3 rounded-lg border-[1.5px] text-center transition-all ${
                          store.dustH === opt.value
                            ? 'border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]'
                            : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#93c5fd]'
                        }`}>
                        <div className="font-bold">{opt.label}</div>
                        {opt.tier > 0 && <div className="text-xs text-[#94a3b8] mt-0.5">{opt.tier}단</div>}
                      </button>
                    ))}
                  </div>
                  {store.dustH > 0 && (
                    <div className="mt-2 bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1] space-y-0.5">
                      <div>• 분진망 {store.dustH}M → {store.dustH <= 1.6 ? 1 : store.dustH <= 2.6 ? 2 : store.dustH <= 3.6 ? 3 : 4}단 · 횡대 추가</div>
                    </div>
                  )}
                </div>

                {/* 시공방식 선택 (H빔/비계식) */}
                <div className="border-t border-[#e5e7eb] pt-4 mt-2">
                  <div className="flex gap-2 items-start mb-3">
                    <span className="text-xl">🏗</span>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0f172a]">시공 방식</h2>
                      <p className="text-xs text-[#64748b]">7M 이상은 자동으로 H빔식 전환됩니다</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {([
                      { value: '자동' as const, label: '자동 판정', desc: '높이 기준 자동' },
                      { value: '비계식' as const, label: '비계식(파이프)', desc: '일반 구조' },
                      { value: 'H빔식' as const, label: 'H빔식', desc: '중량 구조' },
                    ]).map((opt) => {
                      const autoResult = opt.value === '자동'
                        ? (store.height >= 7 ? 'H빔식' : '비계식')
                        : opt.value;
                      return (
                        <button key={opt.value}
                          onClick={() => store.setField('constructionType', opt.value)}
                          className={`flex-1 p-3 border-[1.5px] rounded-lg text-center transition-all ${
                            store.constructionType === opt.value
                              ? 'border-[#3b82f6] bg-[#eff6ff]'
                              : 'border-[#e2e8f0] bg-white hover:border-[#93c5fd]'
                          }`}>
                          <div className={`font-semibold text-[13px] ${store.constructionType === opt.value ? 'text-[#1d4ed8]' : 'text-[#374151]'}`}>
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-[#94a3b8]">{opt.desc}</div>
                          {opt.value === '자동' && store.height > 0 && (
                            <div className="text-[10px] mt-1 font-medium text-[#0369a1]">→ {autoResult}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {(store.constructionType === 'H빔식' || (store.constructionType === '자동' && store.height >= 7)) && (
                    <div className="mt-2 flex items-center gap-2 bg-[#fff7ed] border border-[#fed7aa] rounded-lg px-3 py-2">
                      <input type="checkbox" id="bedrock"
                        checked={store.isBedrock}
                        onChange={(e) => store.setField('isBedrock', e.target.checked)}
                        className="rounded" />
                      <label htmlFor="bedrock" className="text-xs text-[#9a3412]">
                        암반 지반 (오거 장비 + 에어컴프레셔 추가)
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Q5: Floor Type */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex gap-2 items-start">
                  <span className="text-xl">⛏</span>
                  <div>
                    <h2 className="text-[15px] font-bold text-[#0f172a]">기초 조건은?</h2>
                    <p className="text-xs text-[#64748b]">모르겠어요 → 파이프박기로 처리됩니다</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {FLOOR_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => store.setField('floorType', opt.value)}
                      className={`flex items-center gap-3 p-3 border-[1.5px] rounded-lg text-left transition-all ${
                        store.floorType === opt.value
                          ? 'border-[#3b82f6] bg-[#eff6ff]'
                          : 'border-[#e2e8f0] bg-white hover:border-[#93c5fd]'
                      }`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        store.floorType === opt.value ? 'bg-[#2563eb]' : 'bg-[#d1d5db]'
                      }`} />
                      <div className="flex-1">
                        <div className={`font-semibold text-[14px] ${store.floorType === opt.value ? 'text-[#1d4ed8]' : 'text-[#0f172a]'}`}>{opt.label}</div>
                        <div className="text-[11px] text-[#94a3b8]">{opt.desc}</div>
                      </div>
                      <span className="text-[11px] text-[#94a3b8]">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Q6: 현장조건 S1~S3 + 공사일정 S4~S5 */}
            {step === 6 && (
              <div className="space-y-6">
                {/* 현장 조건 S1~S3 */}
                <div>
                  <div className="flex gap-2 items-start mb-1">
                    <span className="text-xl">📋</span>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0f172a]">현장 조건 <span className="text-xs font-normal text-[#94a3b8]">(선택사항)</span></h2>
                      <p className="text-xs text-[#64748b]">더 정확한 견적 안내를 위한 질문입니다</p>
                    </div>
                  </div>

                  {/* Q-S1 지형 */}
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-[#334155] mb-2">Q-S1. 현장 바닥이 평탄한가요?</div>
                    <div className="flex gap-2">
                      {([
                        { value: false, label: '✓ 평탄', desc: '표준' },
                        { value: true, label: '경사 있음', desc: '+10~40%' },
                        { value: null, label: '모르겠어요', desc: '표준 적용' },
                      ] as { value: boolean | null; label: string; desc: string }[]).map((opt) => (
                        <button key={opt.label} onClick={() => store.setField('siteSlope', opt.value)}
                          className={`flex-1 p-2.5 rounded-lg border-[1.5px] text-center transition-all ${
                            store.siteSlope === opt.value
                              ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]'
                              : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#93c5fd]'
                          }`}>
                          <div className="font-bold text-sm">{opt.label}</div>
                          <div className="text-xs text-[#94a3b8]">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q-S2 선형 */}
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-[#334155] mb-2">Q-S2. 방음벽 구간이 직선인가요?</div>
                    <div className="flex gap-2">
                      {([
                        { value: false, label: '✓ 직선', desc: '표준' },
                        { value: true, label: '곡선 포함', desc: '+5~25%' },
                        { value: null, label: '모르겠어요', desc: '표준 적용' },
                      ] as { value: boolean | null; label: string; desc: string }[]).map((opt) => (
                        <button key={opt.label} onClick={() => store.setField('siteCurve', opt.value)}
                          className={`flex-1 p-2.5 rounded-lg border-[1.5px] text-center transition-all ${
                            store.siteCurve === opt.value
                              ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]'
                              : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#93c5fd]'
                          }`}>
                          <div className="font-bold text-sm">{opt.label}</div>
                          <div className="text-xs text-[#94a3b8]">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q-S3 근접 */}
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-[#334155] mb-2">Q-S3. 인접 건물/구조물이 1M 이내에 있나요?</div>
                    <div className="flex gap-2">
                      {([
                        { value: false, label: '✓ 없음', desc: '표준' },
                        { value: true, label: '있음', desc: '장비+20~50%' },
                        { value: null, label: '모르겠어요', desc: '표준 적용' },
                      ] as { value: boolean | null; label: string; desc: string }[]).map((opt) => (
                        <button key={opt.label} onClick={() => store.setField('siteAdjacent', opt.value)}
                          className={`flex-1 p-2.5 rounded-lg border-[1.5px] text-center transition-all ${
                            store.siteAdjacent === opt.value
                              ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]'
                              : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#93c5fd]'
                          }`}>
                          <div className="font-bold text-sm">{opt.label}</div>
                          <div className="text-xs text-[#94a3b8]">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 특수현장 노티스 (조건 충족 시 즉시 표시) */}
                  {store.siteSlope === true && (
                    <div className="mt-3 bg-[#fffbeb] border-l-[3px] border-[#f59e0b] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">
                      ⚠ 경사지 시공은 M당 +10~40% 추가 비용이 발생할 수 있습니다. 을 실제 견적으로 반드시 확인하세요.
                    </div>
                  )}
                  {store.siteCurve === true && (
                    <div className="mt-3 bg-[#fffbeb] border-l-[3px] border-[#f59e0b] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">
                      ⚠ 곡선 구간은 자재 손율 증가로 M당 +5~25% 추가될 수 있습니다. 을 실제 견적으로 확인하세요.
                    </div>
                  )}
                  {store.siteAdjacent === true && (
                    <div className="mt-3 bg-[#fffbeb] border-l-[3px] border-[#f59e0b] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">
                      ⚠ 인접 구조물이 있는 경우 장비 진입 제한으로 장비비가 +20~50% 증가할 수 있습니다.
                    </div>
                  )}
                  {[store.siteSlope, store.siteCurve, store.siteAdjacent].filter(v => v === true).length >= 2 && (
                    <div className="mt-3 bg-[#fef2f2] border-l-[3px] border-[#ef4444] rounded-r-lg px-3 py-2 text-xs text-[#991b1b] font-bold">
                      ⚠⚠ 복합 특수 조건 현장입니다. 엔진 산출값 편차가 ±40% 이상 날 수 있습니다. 을 현장 확인 견적 필수.
                    </div>
                  )}
                </div>

                {/* 공사 일정 S4~S5 */}
                <div className="border-t border-[#e5e7eb] pt-5">
                  <div className="flex gap-2 items-start mb-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0f172a]">공사 일정 <span className="text-xs font-normal text-[#94a3b8]">(선택사항)</span></h2>
                      <p className="text-xs text-[#64748b]">더 정확한 을 매칭을 위한 일정 정보입니다</p>
                    </div>
                  </div>

                  {/* S4: 설치 예정 시기 */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-[#334155] mb-2">S4. 설치 예정 시기가 있으신가요?</div>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { value: '1개월이내' as InstallTimeline, label: '1개월 이내' },
                        { value: '1~3개월' as InstallTimeline, label: '1~3개월' },
                        { value: '3개월이후' as InstallTimeline, label: '3개월 이후' },
                        { value: '미정' as InstallTimeline, label: '미정' },
                      ]).map((opt) => (
                        <button key={opt.value} onClick={() => store.setField('installTimeline', opt.value)}
                          className={`flex-1 min-w-[70px] p-2.5 rounded-lg border-[1.5px] text-center transition-all ${
                            store.installTimeline === opt.value
                              ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]'
                              : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#93c5fd]'
                          }`}>
                          <div className="font-bold text-sm">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* S5: 견적 긴급도 */}
                  <div>
                    <div className="text-sm font-semibold text-[#334155] mb-2">S5. 견적 긴급도</div>
                    <div className="flex gap-2">
                      {([
                        { value: '긴급' as Urgency, label: '긴급', desc: '빠른 시공 필요' },
                        { value: '일반' as Urgency, label: '일반', desc: '' },
                        { value: '여유있음' as Urgency, label: '여유 있음', desc: '' },
                      ]).map((opt) => (
                        <button key={opt.value} onClick={() => store.setField('urgency', opt.value)}
                          className={`flex-1 p-2.5 rounded-lg border-[1.5px] text-center transition-all ${
                            store.urgency === opt.value
                              ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]'
                              : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#93c5fd]'
                          }`}>
                          <div className="font-bold text-sm">{opt.label}</div>
                          {opt.desc && <div className="text-xs text-[#94a3b8]">{opt.desc}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-2">
          {step > 1 && (
            <button onClick={goBack}
              className="px-4 py-2.5 border border-[#e5e7eb] rounded-lg text-[#6b7280] bg-white text-sm hover:bg-[#f9fafb]">
              ← 이전
            </button>
          )}
          {step < 6 ? (
            <button onClick={goNext} disabled={!canProceed()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                canProceed()
                  ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
                  : 'bg-[#e5e7eb] text-[#94a3b8] cursor-not-allowed'
              }`}>
              다음 →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canProceed() || submitting}
              className="flex-1 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-bold hover:bg-[#1d4ed8] disabled:opacity-50">
              {submitting ? '생성 중...' : '견적 보기 →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
