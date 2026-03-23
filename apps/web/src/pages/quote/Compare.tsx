import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuoteStore } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';
import api from '../../lib/api';

const fmt = (n: number) => Math.round(n || 0).toLocaleString('ko-KR');

interface CompareRow {
  name: string;
  track: string;
  perM: number;
  total: number;
  spanMode: string;
  specChanged: boolean;
  dev: number;
  memo: string;
  reputationScore: number;
  reputationGrade: string;
}

function getStatus(dv: number) {
  if (Math.abs(dv) <= 15) return { label: '정상범위', color: '#059669', bg: '#d1fae5', bar: '#10b981' };
  if (dv > 30) return { label: '⚠⚠ 매우 높음', color: '#dc2626', bg: '#fee2e2', bar: '#ef4444' };
  if (dv > 15) return { label: '⚠ 높음', color: '#d97706', bg: '#fef3c7', bar: '#f59e0b' };
  return { label: 'ℹ 낮음', color: '#0369a1', bg: '#e0f2fe', bar: '#10b981' };
}

const DEMO_ROWS: CompareRow[] = [
  { name: 'A사(주호건설)', track: '정식', perM: 48500, total: 12125000, spanMode: '3.0M', specChanged: false, dev: -3, memo: '', reputationScore: 88, reputationGrade: '양호' },
  { name: 'B사(NS기업)', track: '간편', perM: 56000, total: 14000000, spanMode: '2.5M', specChanged: true, dev: 12, memo: '경간 좁힘', reputationScore: 72, reputationGrade: '보통' },
  { name: 'C사(엔진승인)', track: '엔진승인', perM: 50000, total: 12500000, spanMode: '3.0M', specChanged: false, dev: 0, memo: '', reputationScore: 95, reputationGrade: '우수' },
  { name: 'D사(파주업체)', track: '간편', perM: 69000, total: 17250000, spanMode: '2.0M', specChanged: true, dev: 38, memo: '경간 2.0M', reputationScore: 45, reputationGrade: '주의' },
];

export default function Compare() {
  const { id } = useParams<{ id: string }>();
  const store = useQuoteStore();
  const length = store.length || 250;

  const [rows, setRows] = useState<CompareRow[]>([]);
  const [engPerM, setEngPerM] = useState(50000);
  const [sel, setSel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setRows(DEMO_ROWS); setLoading(false); return; }

    api.post(`/api/estimates/${id}/compare`)
      .then(r => {
        const data = r.data;
        if (data.enginePerM) setEngPerM(data.enginePerM);
        const mapped: CompareRow[] = (data.comparisons || data.rows || []).map((c: any) => ({
          name: c.contractorName || c.name || c.contractor?.company || '-',
          track: c.responseType || c.track || '정식',
          perM: c.perM || c.pricePerM || 0,
          total: c.totalPrice || c.total || 0,
          spanMode: c.spanMode || c.span || '3.0M',
          specChanged: c.specChanged ?? false,
          dev: c.deviationPercent ?? c.dev ?? 0,
          memo: c.specChangeLog || c.memo || '',
          reputationScore: c.reputationScore ?? c.repScore ?? 0,
          reputationGrade: c.reputationGrade ?? c.repGrade ?? '-',
        }));
        if (mapped.length > 0) {
          setRows(mapped);
        } else {
          return api.get(`/api/estimates/${id}/responses`).then(res => {
            const responses = Array.isArray(res.data) ? res.data : res.data?.items || [];
            const basePerM = data.enginePerM || engPerM;
            setRows(responses.map((resp: any) => {
              const pm = resp.pricePerM || resp.totalPrice / (length || 1);
              const deviation = basePerM > 0 ? Math.round(((pm - basePerM) / basePerM) * 100) : 0;
              return {
                name: resp.contractor?.company || resp.contractorName || resp.companyName || '-',
                track: resp.responseType || '정식',
                perM: Math.round(pm),
                total: Math.round(resp.totalPrice || pm * length),
                spanMode: resp.spanMode || '3.0M',
                specChanged: resp.specChanged ?? false,
                dev: deviation,
                memo: resp.memo || '',
                reputationScore: resp.reputationScore ?? 0,
                reputationGrade: resp.reputationGrade ?? '-',
              };
            }));
          });
        }
      })
      .catch(() => setRows(DEMO_ROWS))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold bg-[#1e40af] text-white px-2 py-0.5 rounded">AXIS v4.7</span>
          <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded font-semibold">STEP 5</span>
          <span className="text-[15px] font-bold text-[#0f172a]">갑 견적 비교표</span>
        </div>
        <p className="text-xs text-[#64748b] mb-4">시장대비% · BB검증 · 스펙변경 감지 (No.65,75)</p>

        <Stepper step={5} />

        {loading && <div className="text-center py-12 text-sm text-[#64748b]">비교 데이터 로딩 중...</div>}

        {!loading && rows.length === 0 && <div className="text-center py-12 text-sm text-[#64748b]">응답 데이터가 없습니다.</div>}

        {/* 상단 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            ['엔진 M당', fmt(engPerM) + '원/M'],
            ['응답 업체', rows.length + '개사'],
            ['최저가', rows.length > 0 ? fmt(Math.min(...rows.map(r => r.perM))) + '원/M' : '-'],
            ['최고가', rows.length > 0 ? fmt(Math.max(...rows.map(r => r.perM))) + '원/M' : '-'],
          ].map(([l, v]) => (
            <div key={l} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-2 text-center">
              <div className="text-[10px] text-[#94a3b8]">{l}</div>
              <div className="font-bold text-[13px] text-[#0f172a] font-mono">{v}</div>
            </div>
          ))}
        </div>

        {/* 안내 */}
        <div className="bg-[#f0f9ff] border-l-[3px] border-[#38bdf8] rounded-r-lg px-3 py-2 text-xs text-[#0369a1] mb-4">
          📊 엔진 기준: {fmt(engPerM)}원/M · 경간 3.0M · 지주 1:1(실전형) · 품목별 단가는 갑 전용 — 을에게 절대 비공개
        </div>

        {/* 비교 테이블 */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc]">
                {['업체', '제출방식', 'M당 단가', '총액(원)', '엔진대비', '편차바', '을 평판', '스펙변경', '상태', '선택'].map(h => (
                  <th key={h} className="px-2 py-2.5 border border-[#e5e7eb] font-bold text-[#334155] text-[11px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const s = getStatus(r.dev);
                const isLowest = r.perM === Math.min(...rows.map(x => x.perM));
                return (
                  <tr key={i} className={`cursor-pointer ${sel === i ? 'bg-[#eff6ff]' : i % 2 ? 'bg-[#fafafa]' : ''} hover:bg-[#f0f9ff]`}
                    onClick={() => setSel(sel === i ? null : i)}>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] font-semibold">
                      {r.name}
                      {isLowest && <span className="ml-1 text-[9px] bg-[#d1fae5] text-[#065f46] px-1.5 py-0.5 rounded-full">최저</span>}
                    </td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${r.track === '정식' ? 'bg-[#dbeafe] text-[#1e40af]' : r.track === '간편' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#d1fae5] text-[#065f46]'}`}>
                        {r.track}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] text-right font-bold font-mono">{fmt(r.perM)}</td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] text-right font-mono">{fmt(r.total)}</td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] text-center font-bold font-mono" style={{ color: r.dev > 0 ? '#dc2626' : '#059669' }}>
                      {r.dev > 0 ? '+' : ''}{r.dev}%
                    </td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] min-w-[72px]">
                      <div className="h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: Math.min(100, Math.abs(r.dev)) + '%', background: s.bar }} />
                      </div>
                      <div className="text-[9px] text-[#94a3b8] mt-0.5">{Math.abs(r.dev)}%</div>
                    </td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] text-center">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                        r.reputationScore >= 90 ? 'bg-[#d1fae5] text-[#065f46]'
                        : r.reputationScore >= 75 ? 'bg-[#dbeafe] text-[#1e40af]'
                        : r.reputationScore >= 60 ? 'bg-[#fef3c7] text-[#92400e]'
                        : r.reputationScore >= 40 ? 'bg-[#fed7aa] text-[#9a3412]'
                        : r.reputationGrade !== '-' ? 'bg-[#fee2e2] text-[#991b1b]'
                        : 'bg-[#f1f5f9] text-[#94a3b8]'
                      }`}>
                        {r.reputationGrade !== '-' ? `${r.reputationGrade} ${r.reputationScore}점` : '미평가'}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] text-center">
                      {r.specChanged ?
                        <span className="text-[11px] bg-[#fef3c7] text-[#92400e] px-1.5 py-0.5 rounded-full font-bold">⚠ {r.spanMode}</span> :
                        <span className="text-[#d1d5db]">—</span>}
                    </td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td className="px-2 py-2.5 border border-[#e5e7eb] text-center">
                      <button onClick={e => { e.stopPropagation(); setSel(sel === i ? null : i); }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold ${sel === i ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                        {sel === i ? '✓' : '선택'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 선택된 업체 상세 */}
        {sel !== null && rows[sel] && (
          <div className="bg-white border-2 border-[#2563eb] rounded-xl p-5 mb-4">
            <div className="font-bold text-[14px] text-[#1e40af] mb-3">상세 검증 — {rows[sel].name}</div>
            {rows[sel].specChanged && (
              <div className="bg-[#fffbeb] border-l-[3px] border-[#fbbf24] rounded-r-lg px-3 py-2 text-xs text-[#92400e] mb-3">
                ⚠ 스펙 변경: 경간 3.0M → {rows[sel].spanMode}. T_SPEC_CHANGE_LOG 기록됨.
              </div>
            )}
            {rows[sel].dev > 30 && (
              <div className="bg-[#fef2f2] border-l-[3px] border-[#f87171] rounded-r-lg px-3 py-2 text-xs text-[#991b1b] mb-3">
                🚨 엔진 기준 대비 +{rows[sel].dev}% — 매우 높음. 구조 변경 및 단가 상향 확인 필요.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {[['을 제출 M당', fmt(rows[sel].perM) + '원/M'], ['엔진 기준 M당', fmt(engPerM) + '원/M'], ['차이', (rows[sel].dev > 0 ? '+' : '') + rows[sel].dev + '%']].map(([l, v]) => (
                <div key={l} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-2 text-center">
                  <div className="text-[10px] text-[#94a3b8]">{l}</div>
                  <div className="font-bold text-[13px] text-[#0f172a] font-mono">{v}</div>
                </div>
              ))}
            </div>
            {rows[sel].memo && <div className="bg-[#f8fafc] rounded-lg p-2 text-xs text-[#334155] mb-3">메모: {rows[sel].memo}</div>}
            <button onClick={() => window.location.href = `/platform/gap/contract/${id}?eul=${sel}`}
              className="w-full py-3 bg-[#059669] text-white rounded-lg font-bold hover:bg-[#047857]">이 업체로 계약 진행 → STEP 6</button>
          </div>
        )}

        {/* 경고 기준 */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
          <div className="text-xs font-bold text-[#334155] mb-2">경고 기준 (No.75 — MVP 소프트 제한)</div>
          <div className="flex gap-1.5 flex-wrap text-[11px] mb-2">
            {[
              ['#d1fae5', '#065f46', '±15% 이내 — 정상범위'],
              ['#fef3c7', '#92400e', '+15~30% — 높음'],
              ['#fee2e2', '#991b1b', '+30% 초과 — 매우 높음'],
              ['#e0f2fe', '#0369a1', '-15% 이하 — 낮음(참고)'],
            ].map(([bg, c, l]) => (
              <span key={l} className="px-2 py-0.5 rounded-full" style={{ background: bg, color: c }}>{l}</span>
            ))}
          </div>
          <div className="text-[11px] text-[#94a3b8]">MVP: 모든 변경 허용 + 경고만 표시. v2.0+에서 하드 제한 검토 예정.</div>
        </div>

        {/* 네비게이션 */}
        <div className="flex gap-2 mt-4 text-xs">
          <Link to="/" className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9]">← 홈</Link>
          <Link to="/quote/new" className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9]">새 견적</Link>
        </div>
      </div>
    </div>
  );
}
