import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useQuoteStore } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';
import {
  calc8Matrix, getDustTier,
  type CalcOpts,
  CalcStructSpec,
  generateStructComment,
  type StructSpecInput,
} from '@axis/engine';

const ASSETS = ['전체고재', '전체신재', '판넬만신재', '파이프만신재'] as const;
const GATES = [
  { key: '없음', label: '없음' },
  { key: '양개_비계', label: '양개도어(비계식)' },
  { key: '양개_각관', label: '양개도어(각관식)' },
  { key: '홀딩도어', label: '홀딩도어' },
] as const;
const DISCLAIMER = '본 견적은 과거 시공 데이터(759건) 기반 예상 범위이며, 구조설계 도서가 아닙니다. AXIS는 구조안전 설계를 제공하지 않습니다.';

const SCALE = [
  { max: 50, c: 1.60 }, { max: 150, c: 1.03 }, { max: 300, c: 1.00 }, { max: Infinity, c: 0.97 },
];
function scaleFn(l: number) {
  for (const s of SCALE) if (l <= s.max) return s.c;
  return 0.97;
}

function stType(h: number) {
  if (h <= 3) return '비계식';
  if (h <= 4) return '비계식';
  if (h <= 5) return '비계식+보조지주';
  return 'H빔식';
}

const TIER_MAP: Record<string, { tier: string; color: string; bg: string }> = {
  '전체고재':    { tier: 'Tier A', color: '#065f46', bg: '#d1fae5' },
  '전체신재':    { tier: 'Tier A', color: '#065f46', bg: '#d1fae5' },
  '판넬만신재':  { tier: 'Tier A', color: '#065f46', bg: '#d1fae5' },
  '파이프만신재': { tier: 'Tier C', color: '#92400e', bg: '#fef3c7' },
};

const ASSET_RATIO: Record<string, string> = {
  '전체고재': '38.9%재/37.7%노',
  '전체신재': '51.4%재/27.1%노',
  '판넬만신재': '49.0%재/27.0%노',
  '파이프만신재': '참고용(8건)',
};

function fmt(n: number) { return n?.toLocaleString('ko-KR') ?? '-'; }

function genComments(len: number, asset: string|null, contract: string|null, gate: string, trend: string): string[] {
  const c: string[] = [];
  if (len <= 50) c.push('⚠ 데이터 부족. 을 실제 견적을 반드시 받아보세요');
  else if (len <= 150) c.push('참고용 데이터입니다. 을 실제 견적으로 확인을 권합니다');
  else c.push('데이터가 충분한 구간입니다');
  if (len <= 50) c.push('소규모 현장은 M당 단가가 60% 이상 높아질 수 있습니다');
  if (len >= 300) c.push('대규모 현장으로 M당 단가 약 3% 낮아집니다');
  if (asset?.includes('고재') && contract === 'BB') c.push('고재는 BB차감률이 높아 자재비 부담이 줄어듭니다');
  if (asset?.includes('신재') && contract === 'BB') c.push('신재는 감가가 느려 BB차감률 낮음. 자재비 비중 높음');
  if (trend === 'DOWN' && contract === 'BB') c.push('판넬 시세 하락. BB 잔존가↓ 조기 계약 유리');
  if (gate !== '없음') c.push('도어 별도 산출');
  c.push('경비는 현장 접근성에 따라 ±30% 이상 변동 가능');
  c.push('이 견적은 경간 3.0M · 지주간격 1:1 기준(실전형)입니다');
  return c;
}

export default function Matrix() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useQuoteStore();

  const [bbMonths, setBbMonths] = useState(6);
  const [bbResults, setBbResults] = useState<any>({});
  const [sellResults, setSellResults] = useState<any>({});
  const [design, setDesign] = useState<any>({});
  const [trend, setTrend] = useState('FLAT');
  const [selected, setSelected] = useState<{asset:string;contract:string}|null>(null);
  const [showRatio, setShowRatio] = useState<string|null>(null);
  const [gate, setGate] = useState('없음');
  const [gateGrade, setGateGrade] = useState<'고재'|'신재'>('신재');
  const [gateW, setGateW] = useState(3);
  const [gateH, setGateH] = useState(2);
  const [gateMesh, setGateMesh] = useState(false);
  const [gateSide, setGateSide] = useState<'좌측'|'우측'>('좌측');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [structSpec, setStructSpec] = useState<any>(null);
  const [structComment, setStructComment] = useState<string[]>([]);
  const [showStructDetail, setShowStructDetail] = useState(false);

  const isGangnam = (store.address || '').includes('강남');

  const panel = store.panelType || 'RPP';
  const h = store.height || 3;
  const len = store.length || 160;
  const sf = scaleFn(len);

  // 엔진 직접 계산 (API 불필요)
  useEffect(() => {
    setLoading(true);
    try {
      const input = { region: store.region || '경기남부', len, panel, h, floor: store.floorType || '파이프박기' };
      const floor = store.floorType || '파이프박기';
      const opts: Partial<CalcOpts> = { bbMonths, gate, doorGrade: gateGrade, doorW: gateW, doorMesh: gateMesh, dustH: store.dustH || 0 };
      const result = calc8Matrix(input, floor, opts);
      setBbResults(result.bbResults || {}); setSellResults(result.sellResults || {});
      setDesign(result.design || {}); setTrend('FLAT'); setError('');

      // 구조형 계산 (풍속 DB 기반)
      try {
        const addr = store.address || '';
        const sido = addr.includes('서울') ? '서울특별시'
          : addr.includes('부산') ? '부산광역시'
          : addr.includes('인천') ? '인천광역시'
          : addr.includes('대구') ? '대구광역시'
          : addr.includes('대전') ? '대전광역시'
          : addr.includes('광주') ? '광주광역시'
          : addr.includes('울산') ? '울산광역시'
          : addr.includes('세종') ? '세종특별자치시'
          : addr.includes('제주') ? '제주특별자치도'
          : addr.includes('경기') ? '경기도'
          : addr.includes('강원') ? '강원도'
          : '서울특별시';
        const sigungu = addr.replace(/.*?(시|도)\s*/, '').replace(/(구|군|시).*/, '$1') || '';
        const sInput: StructSpecInput = {
          location: { sido, sigungu },
          panel: panel === 'RPP' ? 'RPP방음판' : panel === 'EGI' ? 'EGI휀스' : '스틸방음판',
          height: h, dustH: store.dustH || 0, dustN: (store.dustH || 0) > 0 ? Math.ceil((store.dustH || 0) / 1.5) : 0,
          length: len, foundation: store.floorType || '기초파이프',
          constructionType: store.constructionType || '자동',
        };
        const spec = CalcStructSpec(sInput);
        setStructSpec(spec);
        setStructComment(generateStructComment(sInput, spec));
      } catch { setStructSpec(null); }
    } catch (err: any) {
      setError(err.message || '계산 오류');
    } finally { setLoading(false); }
  }, [bbMonths, gate, gateGrade, gateW, gateH, gateMesh, h, panel, len]);

  const handleSelect = (asset: string, contract: string) => {
    const key = `${asset}_${contract}`;
    if (selected?.asset === asset && selected?.contract === contract) {
      setShowRatio(showRatio === key ? null : key);
    } else {
      setSelected({asset, contract}); setShowRatio(key);
    }
  };

  // Engine reference for deviation
  const engRef = bbResults?.['전체고재']?.totalPerM || 0;

  const sr = selected ? (selected.contract==='BB' ? bbResults[selected.asset] : sellResults[selected.asset]) : null;
  const comments = genComments(len, selected?.asset||null, selected?.contract||null, gate, trend);

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><div className="text-[#2563eb] font-mono animate-pulse">엔진 계산 중...</div></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold bg-[#1e40af] text-white px-2 py-0.5 rounded">AXIS v4.7</span>
          <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded font-semibold">STEP 2</span>
          <span className="text-[15px] font-bold text-[#0f172a]">간편견적 — 8조합 매트릭스</span>
        </div>
        <p className="text-xs text-[#64748b] mb-4">무료 · 갑이 직접 조합 선택 (No.61)</p>

        <Stepper step={2} />

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

        {/* USER/DEFAULT 조건 태그 */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-3">
          <div className="flex gap-1.5 flex-wrap items-center mb-2">
            <span className="text-[11px] font-semibold bg-[#dbeafe] text-[#1d4ed8] px-2 py-0.5 rounded-full">USER</span>
            {[panel, `H${h}M`, `L${len}M`, store.floorType || '파이프박기', store.address || '위치미입력'].map((t, i) => (
              <span key={i} className="text-[12px] bg-[#f1f5f9] text-[#334155] px-2 py-0.5 rounded-full font-medium">{t}</span>
            ))}
            <span className="text-[11px] font-semibold bg-[#f3f4f6] text-[#6b7280] px-2 py-0.5 rounded-full">DEFAULT</span>
            <span className="text-[12px] bg-[#f1f5f9] text-[#94a3b8] px-2 py-0.5 rounded-full">경간 3.0M · 지주 1:1{(store.dustH && store.dustH > 0) ? ` · 분진망 H:${store.dustH}M` : ''}</span>
          </div>
          <div className="text-[12px] text-[#64748b]">
            규모 보정: <strong className="text-[#2563eb]">×{sf.toFixed(2)}</strong>
            <span className="ml-3">구조 타입: <strong className="text-[#7c3aed]">{stType(h)}</strong></span>
          </div>
        </div>

        {/* 실전형 vs 구조형 비교 */}
        {structSpec && (
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[14px] font-bold text-[#0f172a]">실전형 vs 구조형 비교</span>
              <button onClick={()=>setShowStructDetail(!showStructDetail)} className="text-[11px] text-[#2563eb] hover:underline">
                {showStructDetail ? '접기' : '구조 근거 보기'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f0f9ff] rounded-lg p-3 border border-[#bae6fd]">
                <div className="text-[11px] text-[#0369a1] font-semibold mb-1">■ 실전형</div>
                <div className="text-[12px] space-y-0.5">
                  <div>경간: <strong>3.0M</strong></div>
                  <div>횡대: <strong>{design.hwangdae || '-'}단</strong></div>
                  <div>기초: <strong>{design.gichoLength || 1.5}M</strong></div>
                  <div>지주: <strong>1:1</strong></div>
                </div>
              </div>
              <div className="bg-[#faf5ff] rounded-lg p-3 border border-[#d8b4fe]">
                <div className="text-[11px] text-[#7c3aed] font-semibold mb-1">■ 구조형</div>
                <div className="text-[12px] space-y-0.5">
                  <div>경간: <strong className={structSpec.span < 3 ? 'text-[#dc2626]' : ''}>{structSpec.span}M</strong>
                    {structSpec.span < 3 && <span className="text-[10px] text-[#dc2626] ml-1">(풍속 {structSpec.basis.Vo}m/s)</span>}
                  </div>
                  <div>횡대: <strong>{structSpec.horiTier}단</strong>
                    <span className="text-[10px] text-[#64748b] ml-1">(응력비 {structSpec.basis.horiStressRatio.toFixed(2)})</span>
                  </div>
                  <div>기초: <strong className={structSpec.embedTotal > 2 ? 'text-[#dc2626]' : ''}>{structSpec.embedTotal}M</strong>
                    <span className="text-[10px] text-[#64748b] ml-1">(근입{structSpec.embedDepth}+노출{structSpec.embedExposed})</span>
                  </div>
                  <div>지주: <strong>{structSpec.jijuRatio}</strong>
                    {structSpec.hasBracing && <span className="text-[10px] text-[#7c3aed] ml-1">+보조지주</span>}
                  </div>
                  <div>구조타입: <strong>{structSpec.structType}</strong> ({structSpec.postSpec})</div>
                </div>
              </div>
            </div>
            {structSpec.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {structSpec.warnings.map((w: string, i: number) => (
                  <div key={i} className="bg-[#fef2f2] border-l-[3px] border-[#ef4444] rounded-r-lg px-3 py-1.5 text-[11px] text-[#991b1b]">⚠ {w}</div>
                ))}
              </div>
            )}
            {showStructDetail && (
              <div className="mt-3 bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
                <div className="text-[11px] font-semibold text-[#334155] mb-2">구조 근거</div>
                <div className="text-[11px] text-[#64748b] font-mono whitespace-pre-line leading-5">
                  {structComment.join('\n')}
                </div>
              </div>
            )}
            <div className="mt-2 text-[10px] text-[#94a3b8] leading-4">
              ※ 구조형은 AXIS 엔진이 현장 풍속·높이 기반으로 산출한 참고값이며, 법적 구조검토서를 대체하지 않습니다.
            </div>
          </div>
        )}

        {/* 특수현장 노티스 배너 */}
        {(store.siteSlope === true || store.siteCurve === true || store.siteAdjacent === true) && (
          <div className="mb-3 space-y-1">
            {[store.siteSlope, store.siteCurve, store.siteAdjacent].filter(v => v === true).length >= 2 && (
              <div className="bg-[#fef2f2] border-l-[3px] border-[#ef4444] rounded-r-lg px-3 py-2 text-xs text-[#991b1b] font-bold">
                ⚠⚠ 복합 특수 조건 현장 — 엔진 산출값 편차 ±40% 이상 가능. 을 현장 확인 견적 필수.
              </div>
            )}
            {store.siteSlope === true && (
              <div className="bg-[#fffbeb] border-l-[3px] border-[#f59e0b] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">⚠ 경사지 현장 — M당 +10~40% 추가 가능</div>
            )}
            {store.siteCurve === true && (
              <div className="bg-[#fffbeb] border-l-[3px] border-[#f59e0b] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">⚠ 곡선 구간 — 자재 손율 +5~25% 추가 가능</div>
            )}
            {store.siteAdjacent === true && (
              <div className="bg-[#fffbeb] border-l-[3px] border-[#f59e0b] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">⚠ 인접 구조물 — 장비비 +20~50% 추가 가능</div>
            )}
          </div>
        )}

        {/* BB 슬라이더 */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-3">
          <div className="flex justify-between mb-2 items-center">
            <span className="text-[14px] font-bold text-[#0f172a]">BB 기간 (바이백)</span>
            <span className="text-[22px] font-bold text-[#2563eb] font-mono">{bbMonths}개월</span>
          </div>
          <input type="range" min={1} max={36} value={bbMonths} onChange={e=>setBbMonths(Number(e.target.value))} className="w-full accent-[#3b82f6]"/>
          <div className="flex justify-between text-[11px] text-[#94a3b8] mt-1">
            <span>1개월</span>
            <span>BB행만 실시간 변경 · SELL행 고정</span>
            <span>36개월</span>
          </div>
        </div>

        {/* 매트릭스 테이블 */}
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="text-left py-2.5 px-3 border border-[#e2e8f0] font-bold text-[#334155] text-[12px]">계약방식</th>
                {ASSETS.map(a => {
                  const t = TIER_MAP[a];
                  return (
                    <th key={a} className="py-2 px-2 border border-[#e2e8f0] text-center">
                      <div className="font-bold text-[#0f172a] text-[12px] mb-1">{a}</div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: t.bg, color: t.color }}>{t.tier}</span>
                      <div className="text-[10px] text-[#94a3b8] mt-1">{ASSET_RATIO[a]}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* BB row */}
              <tr className="border-b border-[#e5e7eb]/50">
                <td className="py-3 px-3 border border-[#e2e8f0] bg-[#f8fafc]">
                  <div className="font-bold text-[13px] text-[#0f172a]">BB {bbMonths}개월</div>
                  <div className="text-[10px] text-[#94a3b8]">BB차감 후 잔존가</div>
                </td>
                {ASSETS.map(a => {
                  const r = bbResults[a];
                  const isSel = selected?.asset === a && selected?.contract === 'BB';
                  const key = `${a}_BB`;
                  const perM = r?.totalPerM || 0;
                  const dv = engRef ? Math.round((perM - engRef) / engRef * 100) : 0;
                  return (
                    <td key={a} className="py-2 px-2 text-center border border-[#e2e8f0]" style={{ background: isSel ? '#eff6ff' : a === '파이프만신재' ? '#fffbeb' : '#fff' }}>
                      <button onClick={() => handleSelect(a, 'BB')}
                        className={`w-full py-2 px-2 rounded-lg font-mono text-sm transition-all ${
                          isSel ? 'border-2 border-[#3b82f6]' : 'border border-[#e5e7eb] hover:border-[#3b82f6]/50'
                        }`} style={{ background: 'transparent' }}>
                        <div className={`font-bold text-[16px] font-mono ${isSel ? 'text-[#1d4ed8]' : 'text-[#0f172a]'}`}>
                          {r ? fmt(perM) : '-'}
                        </div>
                        <div className="text-[10px] text-[#94a3b8]">원/M</div>
                        {r && <div className={`text-[10px] font-semibold mt-0.5 ${dv > 10 ? 'text-[#dc2626]' : dv < -10 ? 'text-[#059669]' : 'text-[#94a3b8]'}`}>
                          {dv > 0 ? '+' : ''}{dv}%
                        </div>}
                      </button>
                      {isSel && <div className="text-[10px] text-[#2563eb] font-bold mt-1">✓ 선택됨</div>}
                      {showRatio === key && r && (
                        <div className="mt-1 bg-white border border-[#e5e7eb] rounded p-1.5 text-[10px]">
                          <div>재료 {r.pctMat}% · 노무 {r.pctLab}% · 경비 {r.pctEqp}%</div>
                          <div className="text-[#94a3b8]">BB율 {(r.bbRate * 100).toFixed(1)}%</div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              {/* SELL row */}
              <tr>
                <td className="py-3 px-3 border border-[#e2e8f0] bg-[#f8fafc]">
                  <div className="font-bold text-[13px] text-[#0f172a]">SELL (구매)</div>
                  <div className="text-[10px] text-[#94a3b8]">기간 무관 고정</div>
                </td>
                {ASSETS.map(a => {
                  const r = sellResults[a] || sellResults['전체고재'];
                  const isSel = selected?.asset === a && selected?.contract === 'SELL';
                  const perM = r?.totalPerM || 0;
                  const dv = engRef ? Math.round((perM - engRef) / engRef * 100) : 0;
                  return (
                    <td key={a} className="py-2 px-2 text-center border border-[#e2e8f0]" style={{ background: isSel ? '#eff6ff' : '' }}>
                      <button onClick={() => handleSelect(a, 'SELL')}
                        className={`w-full py-2 px-2 rounded-lg font-mono text-sm transition-all ${
                          isSel ? 'border-2 border-[#F0A500]' : 'border border-[#e5e7eb] hover:border-[#F0A500]/50'
                        }`} style={{ background: 'transparent' }}>
                        <div className={`font-bold text-[16px] font-mono ${isSel ? 'text-[#F0A500]' : 'text-[#0f172a]'}`}>
                          {r ? fmt(perM) : '-'}
                        </div>
                        <div className="text-[10px] text-[#94a3b8]">원/M</div>
                        {r && <div className={`text-[10px] font-semibold mt-0.5 ${dv > 10 ? 'text-[#dc2626]' : dv < -10 ? 'text-[#059669]' : 'text-[#94a3b8]'}`}>
                          {dv > 0 ? '+' : ''}{dv}%
                        </div>}
                      </button>
                      {isSel && <div className="text-[10px] text-[#F0A500] font-bold mt-1">✓ 선택됨</div>}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 선택 합계 카드 */}
        {sr ? (
          <div className="bg-white border-2 border-[#10b981] rounded-xl p-5 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[15px]">✅</span>
              <span className="font-bold text-[14px] text-[#065f46]">
                {selected?.contract === 'BB' ? `BB ${bbMonths}개월` : 'SELL (구매)'} · {selected?.asset}
              </span>
              <span className="ml-auto font-mono font-bold text-[18px] text-[#0f172a]">{fmt(sr.totalPerM)}원/M</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-2.5">
                <div className="text-[11px] text-[#94a3b8]">총 예상 ({gate !== '없음' ? '도어 포함' : '도어 제외'})</div>
                <div className="font-bold text-[15px] text-[#0f172a] font-mono">{fmt(sr.rounded || sr.totalPerM * len)}원</div>
              </div>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-2.5">
                <div className="text-[11px] text-[#94a3b8]">엔진 기준 대비</div>
                <div className={`font-bold text-[15px] ${sr.totalPerM > engRef ? 'text-[#dc2626]' : 'text-[#059669]'}`}>
                  {sr.totalPerM > engRef ? '+' : ''}{engRef ? Math.round((sr.totalPerM - engRef) / engRef * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3 text-xs">
              <div className="bg-[#f9fafb] rounded p-2 text-center">
                <div className="text-[#94a3b8]">재료비</div><div className="font-mono font-bold">{sr.pctMat}%</div>
                <div className="h-1 bg-[#e5e7eb] rounded mt-1"><div className="h-1 rounded bg-[#2563eb]" style={{ width: `${sr.pctMat}%` }} /></div>
              </div>
              <div className="bg-[#f9fafb] rounded p-2 text-center">
                <div className="text-[#94a3b8]">노무비</div><div className="font-mono font-bold">{sr.pctLab}%</div>
                <div className="h-1 bg-[#e5e7eb] rounded mt-1"><div className="h-1 rounded bg-[#F0A500]" style={{ width: `${sr.pctLab}%` }} /></div>
              </div>
              <div className="bg-[#f9fafb] rounded p-2 text-center">
                <div className="text-[#94a3b8]">경비</div><div className="font-mono font-bold">{(sr.pctEqp || 0) + (sr.pctTrans || 0)}%</div>
                <div className="h-1 bg-[#e5e7eb] rounded mt-1"><div className="h-1 rounded bg-[#A78BFA]" style={{ width: `${(sr.pctEqp || 0) + (sr.pctTrans || 0)}%` }} /></div>
              </div>
            </div>
            {selected?.contract === 'BB' && sr.bbRefund > 0 && (
              <div className="text-xs text-[#64748b] mb-3">BB 차감: -{fmt(sr.bbRefund)}원 ({(sr.bbRate * 100).toFixed(1)}%)</div>
            )}
            <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1] mb-3">
              ℹ 경간 3.0M · 지주간격 1:1 기준(실전형). 표준형(경간 2.0M·보조지주) 기준 약 +25% 상승. 상세 구조 조건은 정밀견적(유료)에서 확인 가능합니다.
            </div>
            <button
              onClick={() => {
                store.setField('selectedCellKey', `${selected?.asset}_${selected?.contract}`);
                store.setField('selectedAsset', selected?.asset || null);
                store.setField('bbMonths', bbMonths);
                navigate(`/quote/level/${id}`);
              }}
              className="w-full py-3 bg-[#2563eb] text-white rounded-lg font-bold hover:bg-[#1d4ed8]">
              이 조합으로 을에게 견적요청 → STEP 3
            </button>
          </div>
        ) : (
          <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1] mb-3">
            👆 위 표에서 원하는 조합(계약방식 × 자산구분)을 클릭해 선택하세요.
          </div>
        )}

        {/* 도어 설정 */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-3">
          <h3 className="text-sm font-bold text-[#334155] mb-3">도어 설정</h3>
          {/* 도어 타입 선택 */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {GATES.map(g => (
              <button key={g.key} onClick={() => {
                setGate(g.key);
                if (g.key === '양개_비계') { setGateW(3); setGateH(2); }
                else if (g.key === '양개_각관') { setGateW(4); setGateH(2.4); }
                else if (g.key === '홀딩도어') { setGateW(6); setGateH(6); }
              }}
                className={`px-3 py-2 rounded-lg text-[12px] font-medium ${
                  gate === g.key ? 'bg-[#eff6ff] border-[1.5px] border-[#3b82f6] text-[#2563eb]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#94a3b8]'
                }`}>
                {g.label}
              </button>
            ))}
          </div>

          {/* ── 양개_비계 ── */}
          {gate === '양개_비계' && (
            <div className="space-y-2.5">
              <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1]">
                파이프타입 · 고재 100,000원/M · 신재 130,000원/M · W 최대 4M · H 3M 이하
              </div>
              <div className="flex gap-4 items-center flex-wrap text-sm">
                <div className="flex gap-2">
                  {(['고재', '신재'] as const).map(g => (
                    <button key={g} onClick={() => setGateGrade(g)}
                      className={`px-3 py-1 rounded text-xs font-medium ${gateGrade === g ? 'bg-[#2563eb]/15 text-[#2563eb] border border-[#2563eb]' : 'text-[#94a3b8] border border-[#e5e7eb]'}`}>{g}</button>
                  ))}
                </div>
                <div>
                  <span className="text-[#94a3b8] text-xs">W:</span>
                  <select value={gateW} onChange={e => setGateW(Number(e.target.value))}
                    className="bg-[#f9fafb] border border-[#e5e7eb] rounded px-2 py-1 text-sm ml-1">
                    {[2, 3, 4].map(w => <option key={w} value={w}>{w}M</option>)}
                  </select>
                </div>
                <div>
                  <span className="text-[#94a3b8] text-xs">H:</span>
                  <select value={gateH} onChange={e => setGateH(Number(e.target.value))}
                    className="bg-[#f9fafb] border border-[#e5e7eb] rounded px-2 py-1 text-sm ml-1">
                    {[2, 3].map(hv => <option key={hv} value={hv}>{hv}M</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── 양개_각관 ── */}
          {gate === '양개_각관' && (
            <div className="space-y-2.5">
              <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1]">
                ㅁ각관타입 · 고재/신재 300,000원/M · H 고정: 2.4M
              </div>
              <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">
                ⚠ H 고정: 2.4M — 높이 변경 희망 시 상담 요청
              </div>
              <div className="flex gap-4 items-center flex-wrap text-sm">
                <div className="flex gap-2">
                  {(['고재', '신재'] as const).map(g => (
                    <button key={g} onClick={() => setGateGrade(g)}
                      className={`px-3 py-1 rounded text-xs font-medium ${gateGrade === g ? 'bg-[#2563eb]/15 text-[#2563eb] border border-[#2563eb]' : 'text-[#94a3b8] border border-[#e5e7eb]'}`}>{g}</button>
                  ))}
                </div>
                <div>
                  <span className="text-[#94a3b8] text-xs">W:</span>
                  <select value={gateW} onChange={e => setGateW(Number(e.target.value))}
                    className="bg-[#f9fafb] border border-[#e5e7eb] rounded px-2 py-1 text-sm ml-1">
                    {[3, 4, 5, 6, 7, 8].map(w => <option key={w} value={w}>{w}M</option>)}
                  </select>
                </div>
                <div className="text-[12px] text-[#94a3b8] font-medium">H: 2.4M (고정)</div>
              </div>
            </div>
          )}

          {/* ── 홀딩도어 ── */}
          {gate === '홀딩도어' && (
            <div className="space-y-2.5">
              <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1]">
                홀딩도어 · 고재 270,000원/M · 신재 350,000원/M · 쪽문 필수
              </div>
              <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">
                ⚠ H 고정: 6.0M — 높이 변경 희망 시 상담 요청
              </div>
              {isGangnam && !gateMesh && (
                <div className="bg-[#fef2f2] border-l-[3px] border-[#f87171] rounded-r-lg px-3 py-2 text-xs text-[#991b1b]">
                  🚨 강남 지역: 홀딩도어 수직포망 필수 선택을 권장합니다.
                </div>
              )}
              <div className="flex gap-4 items-center flex-wrap text-sm">
                <div className="flex gap-2">
                  {(['고재', '신재'] as const).map(g => (
                    <button key={g} onClick={() => setGateGrade(g)}
                      className={`px-3 py-1 rounded text-xs font-medium ${gateGrade === g ? 'bg-[#2563eb]/15 text-[#2563eb] border border-[#2563eb]' : 'text-[#94a3b8] border border-[#e5e7eb]'}`}>{g}</button>
                  ))}
                </div>
                <div>
                  <span className="text-[#94a3b8] text-xs">W:</span>
                  <select value={gateW} onChange={e => setGateW(Number(e.target.value))}
                    className="bg-[#f9fafb] border border-[#e5e7eb] rounded px-2 py-1 text-sm ml-1">
                    {[6, 7, 8, 9, 10, 12].map(w => <option key={w} value={w}>{w}M</option>)}
                  </select>
                </div>
                <div className="text-[12px] text-[#94a3b8] font-medium">H: 6.0M (고정)</div>
              </div>

              {/* 쪽문 방향 */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3">
                <div className="text-[12px] font-semibold text-[#334155] mb-2">쪽문 방향 (게이트를 바라볼 때 기준)</div>
                <div className="flex gap-2">
                  {(['좌측', '우측'] as const).map(s => (
                    <button key={s} onClick={() => setGateSide(s)}
                      className={`px-4 py-1.5 rounded-lg text-[12px] font-medium ${
                        gateSide === s ? 'bg-[#2563eb] text-white' : 'bg-white border border-[#e5e7eb] text-[#64748b]'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* 수직포망 */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-[12px] font-semibold text-[#334155]">수직포망</div>
                    <div className="text-[11px] text-[#94a3b8]">게이트 상단 빗살에 먼지 차단 망 설치 · 문짝당 1M폭 · 25,000원/장</div>
                  </div>
                  <button onClick={() => setGateMesh(!gateMesh)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${gateMesh ? 'bg-[#2563eb]' : 'bg-[#d1d5db]'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${gateMesh ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {gateMesh && <div className="text-[11px] text-[#2563eb] font-medium mt-1">✓ {gateW}장 × 25,000원 = {(gateW * 25000).toLocaleString('ko-KR')}원 적용</div>}
              </div>
            </div>
          )}
        </div>

        {/* 설계 조건 */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-3">
          <h3 className="text-sm font-bold text-[#334155] mb-2">기준 설계 조건</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>모드: <span className="text-[#2563eb] font-semibold">{design.mode}</span></div>
            <div>경간: <span className="text-[#2563eb] font-semibold">{design.span}M</span></div>
            <div>횡대: <span className="text-[#2563eb] font-semibold">{design.hwangdae}단</span></div>
            <div>지주: <span className="text-[#2563eb] font-semibold">{design.jiju}</span></div>
            <div>기초: <span className="text-[#2563eb] font-semibold">{design.found}</span></div>
            <div>기초파이프: <span className="text-[#2563eb] font-semibold">{design.gichoLength ? design.gichoLength + 'M' : '앵커볼트'}</span></div>
          </div>
        </div>

        {/* 코멘트 */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-3">
          <h3 className="text-sm font-bold text-[#334155] mb-2">코멘트</h3>
          <ul className="space-y-1 text-xs text-[#0f172a]">{comments.map((c, i) => <li key={i}>• {c}</li>)}</ul>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 mb-3">
          <button
            disabled={!selected}
            onClick={() => {
              store.setField('selectedCellKey', `${selected?.asset}_${selected?.contract}`);
              store.setField('selectedAsset', selected?.asset || null);
              store.setField('bbMonths', bbMonths);
              navigate(`/quote/level/${id}`);
            }}
            className={`flex-1 py-3 rounded-lg font-bold ${selected ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' : 'bg-[#e5e7eb] text-[#94a3b8] cursor-not-allowed'}`}>
            📡 을에게 견적요청
          </button>
          <button onClick={() => navigate(`/quote/premium/${id}`)} className="flex-1 py-3 rounded-lg border border-[#F0A500] text-[#F0A500] font-bold hover:bg-[#F0A500]/10">
            ★ 정밀견적 (유료)
          </button>
        </div>
        {/* 견적 저장 */}
        {selected && sr && (
          <div className="mb-3">
            <input type="text" id="projectNameInput" placeholder="공사명 입력 (선택)"
              className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm mb-2 text-[#0f172a]" />
            <button
              onClick={async () => {
                try {
                  const projectName = (document.getElementById('projectNameInput') as HTMLInputElement)?.value || '';
                  const dustN = store.dustH ? (store.dustH <= 1.6 ? 1 : store.dustH <= 2.6 ? 2 : store.dustH <= 3.6 ? 3 : 4) : 0;
                  const matPerM = Math.floor((sr.matTotal - (sr.gateTotal||0)) / len / 100) * 100;
                  const labPerM = Math.floor(sr.labTotal / len / 100) * 100;
                  const expPerM = Math.floor((sr.eqpTotal + sr.transTotal) / len / 100) * 100;
                  await api.post('/api/quotes', {
                    projectName: projectName || undefined,
                    input: { panel, height: h, length: len, span: design.span||3, contract: selected.contract==='BB'?'바이백':'판매', months: bbMonths, asset: selected.asset, dustH: store.dustH||0, dustN, location: store.address||'', door: gate !== '없음' ? gate : null },
                    result: { matTotal: sr.matTotal, labTotal: sr.labTotal, equipTotal: sr.eqpTotal, transTotal: sr.transTotal, doorTotal: sr.gateTotal||0, grandTotal: sr.subtotal, bbTotal: -(sr.bbRefund||0), finalTotal: sr.total, matPerM, labPerM, expPerM, totalPerM: matPerM+labPerM+expPerM },
                    bom: sr.bom ? Object.entries(sr.bom).map(([k,v]) => ({name:k,...(v as any)})) : [],
                    designComments: [
                      `판넬: ${panel} H${h}M / 총연장 ${len}M`,
                      `경간: ${design.span||3}M`,
                      `주주파이프: ${sr.bom?.juju||''}본`,
                      `횡대파이프: ${design.hwangdae||''}단`,
                      dustN > 0 ? `분진망: 있음 (H:${store.dustH}M, ${dustN}단)` : '분진망: 없음',
                      `기초: ${design.found||'기초파이프'}`,
                      `자산구분: ${selected.asset}`,
                      selected.contract==='BB' ? `계약: 바이백 ${bbMonths}개월` : '계약: 일반판매',
                    ],
                  });
                  alert('견적이 저장되었습니다.');
                } catch { alert('저장에 실패했습니다. 로그인이 필요합니다.'); }
              }}
              className="w-full py-2 rounded-lg border border-[#334155] text-[#94A3B8] text-sm hover:bg-[#111B2A]">
              💾 이 견적 저장하기
            </button>
          </div>
        )}

        {/* 면책 */}
        <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e]">⚠ {DISCLAIMER}</div>
      </div>
    </div>
  );
}
