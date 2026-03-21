import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuoteStore } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';
import api from '../../lib/api';

const LEVELS = [
  { id: 'L1' as const, label: 'L1 비공개', desc: '현장 조건만 공개 — 가격 비공개', badge: '~70%' },
  { id: 'L2' as const, label: 'L2 총액', desc: 'A블록 + 총액 + M당 공개', badge: '~25%' },
  { id: 'L3' as const, label: 'L3 항목별', desc: '재/노/경/도어 4분류 공개 (품목단가 없음)', badge: '~5%' },
];

const ROUNDS = [
  { r: 50, t: 'ROUND 1', d: '호출 생성 시 자동 · 60분 마감' },
  { r: 150, t: 'ROUND 2', d: 'R1 응답<3건 시 자동확장 · +60분' },
  { r: 300, t: 'ROUND 3', d: 'R2 응답<3건 시 자동확장 · +60분' },
  { r: 9999, t: 'MANUAL', d: 'R3 이후 · 갑 직접 선택 · 전국' },
];

export default function LevelSelect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useQuoteStore();

  const [selected, setSelected] = useState<'L1' | 'L2' | 'L3'>('L1');
  const [submitting, setSubmitting] = useState(false);

  const panel = store.panelType || 'RPP';
  const h = store.height || 3;
  const len = store.length || 160;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/api/estimates/${id}`, {
        status: 'REQUESTED',
        disclosureLevel: selected,
        selectedCellKey: store.selectedCellKey,
        bbMonths: store.bbMonths,
      });
      navigate(`/quote/sent/${id}`);
    } catch {
      navigate(`/quote/sent/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold bg-[#1e40af] text-white px-2 py-0.5 rounded">AXIS v4.7</span>
          <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded font-semibold">STEP 3</span>
          <span className="text-[15px] font-bold text-[#0f172a]">을에게 견적요청 발송</span>
        </div>
        <p className="text-xs text-[#64748b] mb-4">공개레벨 선택 · 반경 자동확장 (No.54)</p>

        <Stepper step={3} />

        {/* 공개 레벨 선택 */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-3">
          <div className="font-bold text-[14px] text-[#0f172a] mb-2">공개 레벨 선택</div>
          <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1] mb-3">
            🔒 품목별 단가 공개 옵션 없음. AXIS 엔진 단가는 갑(발주처) 전용입니다.
          </div>
          {LEVELS.map(l => (
            <div key={l.id} onClick={() => setSelected(l.id)}
              className={`flex items-center gap-3 p-3 my-1.5 border-2 rounded-lg cursor-pointer transition-all ${
                selected === l.id ? 'border-[#3b82f6] bg-[#eff6ff]' : 'border-[#e2e8f0] bg-white hover:border-[#93c5fd]'
              }`}>
              <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected === l.id ? 'border-[#2563eb] bg-[#2563eb]' : 'border-[#d1d5db]'
              }`}>
                {selected === l.id && <span className="text-white text-[10px]">✓</span>}
              </div>
              <div className="flex-1">
                <div className={`font-bold text-[13px] ${selected === l.id ? 'text-[#1d4ed8]' : 'text-[#0f172a]'}`}>{l.label}</div>
                <div className="text-[11px] text-[#94a3b8]">{l.desc}</div>
              </div>
              <span className="text-[11px] bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded-full font-medium">예상 {l.badge}</span>
            </div>
          ))}
        </div>

        {/* 반경 자동 확장 */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-3">
          <div className="font-bold text-[14px] text-[#0f172a] mb-3">반경 자동 확장 — 을 보호</div>
          {ROUNDS.map((rd, i) => (
            <div key={rd.r} className={`flex gap-3 items-start ${i < ROUNDS.length - 1 ? 'pb-2.5 mb-2.5 border-b border-dashed border-[#e2e8f0]' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                i === 0 ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#94a3b8]'
              }`}>{i + 1}</div>
              <div>
                <div className="font-semibold text-[13px] text-[#0f172a]">{rd.t}{rd.r < 9999 ? ` · ${rd.r}km` : ''}</div>
                <div className="text-[11px] text-[#94a3b8]">{rd.d}</div>
              </div>
            </div>
          ))}
          <div className="mt-3 bg-[#f0f9ff] rounded-lg px-3 py-2 text-[12px] text-[#0369a1]">
            정렬: 금액순 → 거리순 → 응답시간순 (추천 없음 — 사실 기반)
          </div>
        </div>

        {/* A블록 전달 내용 */}
        <div className="bg-[#fafafa] border border-[#e2e8f0] rounded-xl p-4 mb-3">
          <div className="font-bold text-[13px] text-[#0f172a] mb-2">A블록 전달 내용</div>
          <div className="flex flex-wrap gap-1.5">
            {([
              ['panel', panel], ['height', h + 'M'], ['length', len + 'M'],
              ['foundation', store.floorType || '파이프박기'], ['location', store.address || '미입력'],
              ['contract', store.selectedCellKey?.split('_')[1] || '-'],
              ['asset', store.selectedAsset || '-'],
            ] as [string, string][]).map(([k, v]) => (
              <span key={k} className="text-[11px] bg-white border border-[#e2e8f0] px-2 py-0.5 rounded">
                <span className="text-[#94a3b8]">{k}: </span>
                <span className="font-semibold text-[#0f172a]">{v}</span>
              </span>
            ))}
            <span className="text-[11px] bg-[#f1f5f9] border border-[#e2e8f0] px-2 py-0.5 rounded">
              <span className="text-[#94a3b8]">span: </span>
              <span className="text-[#94a3b8]">3.0M (DEFAULT)</span>
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#94a3b8] border-t border-[#e2e8f0] pt-2">
            ⚠ 구조 조건은 AXIS 엔진 과거 데이터 기반 참고 기준. 실제 시공 시 현장 여건에 따라 을과 협의 변경 가능. AXIS는 구조안전 설계를 제공하지 않습니다.
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 bg-[#2563eb] text-white rounded-lg font-bold text-[14px] hover:bg-[#1d4ed8] disabled:opacity-50">
          {submitting ? '발송 중...' : '견적요청 발송 (50km 반경) → STEP 4'}
        </button>

        {/* 네비게이션 */}
        <div className="flex gap-2 mt-4 text-xs">
          <button onClick={() => navigate(-1)} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9]">← 이전</button>
          <button onClick={() => navigate('/')} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9]">홈</button>
        </div>
      </div>
    </div>
  );
}
