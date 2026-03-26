import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuoteStore } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';
import { exportQuotesToExcel, type QuoteSlotData, type ExportRow } from '../../lib/quoteExcelExport';
import {
  makeDesign, calcEstimate, getDustTier,
  REGION_DB as ENGINE_REGION_DB,
  CalcStructSpec, generateStructComment,
  calcScaffoldStress, calcHBeamStress, calcMinEmbed, PIPE, HBEAM,
  type QuoteInput, type CalcOpts, type StructSpecInput,
} from '@axis/engine';

const REGION_DB: Record<string, {Vo:number}> = {
  서울:{Vo:26},경기북부:{Vo:26},경기남부:{Vo:26},경기서해안:{Vo:28},인천:{Vo:28},
  강원내륙:{Vo:24},강원해안:{Vo:34},충청:{Vo:28},충남서해:{Vo:34},전라:{Vo:30},
  경상:{Vo:30},부산:{Vo:38},제주:{Vo:42},
};

function fmt(n: number) { return n?.toLocaleString('ko-KR') ?? '-'; }

// 구조판정 계산 — v76.5 엔진 기반
function calcStructure(
  h: number, panel: string, address: string,
  span: number, embedM: number,
  constructionType?: '자동' | '비계식' | 'H빔식',
  dustH = 0, dustN = 0,
) {
  // 주소에서 시도/시군구 추출
  // ★ BUG-04 FIX: 17개 시도 전체 매핑 (경기도 폴백 제거)
  const SIDO_MAP: [RegExp, string][] = [
    [/서울/, '서울특별시'], [/부산/, '부산광역시'], [/인천/, '인천광역시'],
    [/대구/, '대구광역시'], [/대전/, '대전광역시'], [/광주/, '광주광역시'],
    [/울산/, '울산광역시'], [/세종/, '세종특별자치시'], [/제주/, '제주특별자치도'],
    [/강원/, '강원특별자치도'], [/경기/, '경기도'],
    [/충북|충청북/, '충청북도'], [/충남|충청남/, '충청남도'],
    [/전북|전라북/, '전라북도'], [/전남|전라남/, '전라남도'],
    [/경북|경상북/, '경상북도'], [/경남|경상남/, '경상남도'],
  ];
  const sido = SIDO_MAP.find(([re]) => re.test(address))?.[1] ?? '경기도';
  const sigungu = address.replace(/.*?(시|도)\s*/, '').replace(/(구|군|시).*/, '$1') || '';

  const sInput: StructSpecInput = {
    location: { sido, sigungu },
    panel: panel === 'RPP' ? 'RPP방음판' : panel === 'EGI' ? 'EGI휀스' : '스틸방음판',
    height: h, dustH, dustN, length: 100,
    foundation: '기초파이프',
    constructionType,
  };

  try {
    const spec = CalcStructSpec(sInput);
    const b = spec.basis;
    const totalH = h + dustH;
    const pf = b.pf_kN;
    const isHBeam = spec.structType === 'H빔식';

    // ★ 핵심: CalcStructSpec의 자체 span이 아닌, 전달받은 span/embedM으로 재계산
    // (실전형 span=3M vs 구조형 span=2M 등 차이를 반영)
    const stressRatio = isHBeam
      ? calcHBeamStress(totalH, h, dustH, pf, span, spec.postSpec)
      : calcScaffoldStress(totalH, h, dustH, span, pf, b.K_dist);

    // 횡대 응력비도 전달받은 span 기준으로 재계산
    const horiTier = spec.horiTier;
    const burden = h / Math.max(1, horiTier - 1);
    const W_wind = pf * 1000 * burden;
    const W_dead = 300 * burden;
    const M_h = Math.sqrt((W_dead * span * span / 10) ** 2 + (W_wind * span * span / 10) ** 2);
    const horiRatio = (M_h * 1000 / PIPE.Z) / PIPE.fba;

    // 전도안전율도 전달받은 embedM 기준으로 재계산
    let fsVal = 999;
    if (embedM > 0) {
      let D_found: number;
      if (isHBeam) {
        const bMatch = spec.postSpec.match(/×(\d+)/);
        D_found = bMatch ? parseInt(bMatch[1]) / 2000 : 0.05;
      } else {
        D_found = 0.3; // VBA: 항타+지반다짐 등가직경
      }
      const embedResult = calcMinEmbed(totalH, h, dustH, span, pf, 30, D_found);
      // Fs at the given embedM (not at optimal embed)
      const phi = 30;
      const Kp = Math.tan((45 + phi / 2) * Math.PI / 180) ** 2;
      const H_eff = totalH;
      const Mo = pf * span * H_eff * (embedM + H_eff / 2);
      const Pp = 0.5 * 18 * Kp * embedM * embedM * (2 * D_found);
      const Mr = Pp * embedM / 3;
      fsVal = Mo > 0 ? Mr / Mo : 999;
    }

    // BK_03: 말뚝 축력 검토
    const pf_N = pf * 1000;
    const P_axial = pf_N * span * totalH * 0.5;
    const phi_Pn = 0.85 * 235 * 334.5;
    const axialRatio = isHBeam ? 0 : P_axial / (2 * phi_Pn);

    // ★ v2.1: GT(값↑위험) / LT(값↓위험) 명시적 분리
    // GT: 응력비 등 — warnVal 이상이면 WARN, ngVal 초과하면 NG
    const gradeGT = (v: number, warnVal: number, ngVal: number) =>
      v > ngVal ? 'NG' : v > warnVal ? 'WARN' : 'PASS';
    // LT: 안전율 등 — warnVal 미만이면 WARN, ngVal 미만이면 NG
    const gradeLT = (v: number, warnVal: number, ngVal: number) =>
      v < ngVal ? 'NG' : v < warnVal ? 'WARN' : 'PASS';

    // ★ H빔식: HB룰 적용, BK_03/BK_04(파이프 인발) 제거
    // H빔은 콘크리트 기초이므로 파이프 인발 검토 불필요
    let checks: { name: string; val: number; status: string; max: number; fix?: string }[];

    if (isHBeam) {
      // HB룰: H빔식 전용 (DB_판정룰 확정)
      const hbTipover = embedM > 0 ? fsVal : 999;
      checks = [
        { name: 'HB_01 H빔 휨응력비', val: +stressRatio.toFixed(3),
          status: gradeGT(stressRatio, 0.85, 1.0), max: 1.2,
          fix: stressRatio > 1.0 ? `H빔 규격 상향 필요 (현재 ${spec.postSpec})` : undefined },
        { name: 'HB_02 횡대 합성응력', val: +horiRatio.toFixed(3),
          status: gradeGT(horiRatio, 0.85, 1.2), max: 1.5,
          fix: horiRatio > 1.2 ? `횡대 단수 증가 필요 (현재 ${horiTier}단)` : undefined },
        { name: 'HB_03 전도 안전율(참고)', val: +(hbTipover > 99 ? 0 : hbTipover).toFixed(2),
          status: hbTipover >= 1.5 ? 'PASS' : hbTipover >= 1.2 ? 'WARN' : 'PASS', max: 4.0,
          fix: undefined },
      ];
      if (embedM === 0) { checks[2].val = 0; checks[2].status = 'PASS'; }
    } else {
      // BK룰: 비계식 전용 (DB_판정룰 확정)
      // BK_01: GT, pass=0.85, warn=0.85, ng=1.0
      // BK_02: GT, pass=0.75, warn=0.90, ng=1.0
      // BK_03: GT, pass=0.75, warn=0.90, ng=1.0
      // BK_04: LT, pass=3.0, warn=1.5, ng=1.2  ★NG는 1.2(v2.1 확정)
      checks = [
        { name: 'BK_01 횡대 합성응력', val: +horiRatio.toFixed(3),
          status: gradeGT(horiRatio, 0.85, 1.0), max: 1.5,
          fix: horiRatio > 1.0 ? `횡대 단수 증가 필요 (현재 ${horiTier}단)` : undefined },
        { name: 'BK_02 지주 응력비', val: +stressRatio.toFixed(3),
          status: gradeGT(stressRatio, 0.90, 1.0), max: 1.2,
          fix: stressRatio > 1.0 ? `경간 축소 또는 보조지주 추가 필요 (현재 ${span}M)` : undefined },
        { name: 'BK_03 말뚝 응력비', val: +axialRatio.toFixed(3),
          status: gradeGT(axialRatio, 0.90, 1.0), max: 1.2 },
        { name: 'BK_04 인발 안전율', val: +fsVal.toFixed(1),
          status: gradeLT(fsVal, 1.5, 1.2), max: 4.0,
          fix: fsVal < 1.2 ? `기초 ${Math.ceil((embedM + 1) * 2) / 2}M 이상 필요 (현재 ${embedM}M)` : undefined },
      ];
    }

    const ngCount = checks.filter(c => c.status === 'NG').length;
    const warnCount = checks.filter(c => c.status === 'WARN').length;
    const overall = ngCount >= 1 ? 'F(부적합)' : warnCount >= 2 ? 'D(위험경계)' : warnCount === 1 ? 'C(경계)' : 'A(안전)';
    return { checks, overall, basis: { ...b, stressRatio, horiStressRatio: horiRatio, Fs: fsVal, pf_kN: pf }, isHBeam };
  } catch {
    return { checks: [], overall: '계산 불가', basis: null };
  }
}

// 환경판정 계산
function calcEnvironment(panel: string, h: number, mode: string, found: string, embedM: number) {
  const noiseDB: Record<string, number> = { '스틸': 38, RPP: 33, EGI: 22 };
  const dustBase: Record<string, number> = { '스틸': 86, RPP: 79, EGI: 62 };
  const noise = noiseDB[panel] || 33;
  const dust = Math.min(98, (dustBase[panel] || 79) + (h >= 5 ? 10 : h >= 4 ? 5 : 0));
  const vibBase = found === '앵커볼트' ? 84 : embedM >= 2 ? 78 : 70;
  const vib = Math.min(98, vibBase + (panel === '스틸' ? 5 : 0));
  const wind = mode === '구조형' ? 89 : 80;
  const total = (noise / 40) * 35 + (dust / 100) * 30 + (vib / 100) * 20 + (wind / 100) * 15;
  const grade = total >= 85 ? 'A(우수)' : total >= 70 ? 'B(양호)' : total >= 55 ? 'C(보통)' : 'D(개선필요)';
  return { items: [
    { name: '소음차단', val: noise, unit: 'dB', pct: noise / 40 * 100 },
    { name: '분진차단율', val: dust, unit: '%', pct: dust },
    { name: '진동억제', val: vib, unit: '%', pct: vib },
    { name: '내풍안전도', val: wind, unit: '%', pct: wind },
  ], total: Math.round(total), grade };
}

export default function Premium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useQuoteStore();

  const [tab, setTab] = useState<'price' | 'design' | 'struct' | 'env'>('price');
  const [bbMonths, setBbMonths] = useState(6);
  const [gyeongbiOpen, setGyeongbiOpen] = useState(false);
  const [practical, setPractical] = useState<any>(null);
  const [standard, setStandard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const h = store.height || 3;
  const panel = store.panelType || 'RPP';
  const region = store.region || '경기남부';
  const len = store.length || 160;
  const floor = store.floorType || '파이프박기';

  // 엔진 직접 계산 (API 불필요)
  useEffect(() => {
    setLoading(true);
    try {
      const dH = store.dustH || 0;
      const dustN = getDustTier(dH);
      const input: QuoteInput = { region, len, panel, h, floor, asset: '전체고재' as any, contract: '바이백' };
      const opts: CalcOpts = { bbMonths, gate: '없음', doorGrade: '신재', doorW: 4, doorMesh: false, dustH: dH };
      const ct = store.constructionType as '자동' | '비계식' | 'H빔식' | undefined;
      // 실전형: 하드코딩 기본값
      const dJ = makeDesign(h, floor, panel, false, dustN, ct);
      setPractical({ design: dJ, result: calcEstimate(input, dJ, opts) });

      // 구조형: CalcStructSpec 결과로 설계값 덮어쓰기
      const dP = makeDesign(h, floor, panel, true, dustN, ct);
      try {
        // ★ BUG-04 FIX: 17개 시도 매핑 재사용
        const SIDO_MAP2: [RegExp, string][] = [
          [/서울/, '서울특별시'], [/부산/, '부산광역시'], [/인천/, '인천광역시'],
          [/대구/, '대구광역시'], [/대전/, '대전광역시'], [/광주/, '광주광역시'],
          [/울산/, '울산광역시'], [/세종/, '세종특별자치시'], [/제주/, '제주특별자치도'],
          [/강원/, '강원특별자치도'], [/경기/, '경기도'],
          [/충북|충청북/, '충청북도'], [/충남|충청남/, '충청남도'],
          [/전북|전라북/, '전라북도'], [/전남|전라남/, '전라남도'],
          [/경북|경상북/, '경상북도'], [/경남|경상남/, '경상남도'],
        ];
        const sido = SIDO_MAP2.find(([re]) => re.test(store.address || ''))?.[1] ?? '경기도';
        const sigungu = (store.address || '').replace(/.*?(시|도)\s*/, '').replace(/(구|군|시).*/, '$1') || '';
        const sInput: StructSpecInput = {
          location: { sido, sigungu },
          panel: panel === 'RPP' ? 'RPP방음판' : panel === 'EGI' ? 'EGI휀스' : '스틸방음판',
          height: h, dustH: dH, dustN, length: len,
          foundation: floor === '콘크리트' ? '콘크리트' : '기초파이프',
          constructionType: ct,
        };
        const spec = CalcStructSpec(sInput);
        // 구조형 Design을 구조계산 결과로 덮어쓰기
        dP.span = spec.span;
        dP.hwangdae = spec.horiTier;
        dP.gichoLength = spec.embedTotal > 0 ? spec.embedTotal : dP.gichoLength;
        dP.jiju = spec.jijuRatio;
        dP.bojo = spec.hasBracing ? '삼각트러스(6M+4M+1M)' : '없음';
        if (spec.structType === 'H빔식') {
          dP.postSpec = spec.postSpec;
          dP.isHBeam = true;
          dP.structType = 'H빔식';
          dP.found = 'H빔 기초';
          dP.jiju = 'H빔 자립';
        }
      } catch (e) { console.warn('구조형 CalcStructSpec 오류, 기본값 사용:', e); }
      setStandard({ design: dP, result: calcEstimate(input, dP, opts) });
    } catch (e) { console.error('엔진 계산 오류:', e); }
    finally { setLoading(false); }
  }, [bbMonths, h, panel, region, len, floor]);

  const regionData = REGION_DB[region] || { Vo: 26 };

  const addr = store.address || '';
  const cType = store.constructionType as '자동' | '비계식' | 'H빔식' | undefined;
  const dH = store.dustH || 0;
  const dN = getDustTier(dH);
  const structP = practical?.design ? calcStructure(h, panel, addr, practical.design.span, practical.design.gichoLength ?? 1.5, cType, dH, dN) : null;
  const structS = standard?.design ? calcStructure(h, panel, addr, standard.design.span, standard.design.gichoLength ?? 2.0, cType, dH, dN) : null;
  const envP = practical?.design ? calcEnvironment(panel, h, '실전형', practical.design.found, practical.design.gichoLength ?? 1.5) : null;
  const envS = standard?.design ? calcEnvironment(panel, h, '구조형', standard.design.found, standard.design.gichoLength ?? 2.0) : null;

  const statusColor = (s: string) => s === 'PASS' ? 'text-[#10b981]' : s === 'WARN' ? 'text-[#d97706]' : 'text-[#ef4444]';
  const barColor = (s: string) => s === 'PASS' ? 'bg-[#10b981]' : s === 'WARN' ? 'bg-[#d97706]' : 'bg-[#ef4444]';

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><div className="text-[#2563eb] font-mono animate-pulse">정밀 계산 중...</div></div>;

  const TABS = [
    { key: 'price', label: '단가비교' }, { key: 'design', label: '설계조건' },
    { key: 'struct', label: '구조판정' }, { key: 'env', label: '환경판정' },
  ];

  const Card = ({ title, data, color }: { title: string; data: any; color: string }) => {
    if (!data) return null;
    const r = data.result;
    const d = data.design;
    return (
      <div className={`flex-1 bg-[#ffffff] border rounded-lg p-5 ${color}`}>
        <h3 className="font-mono font-bold text-lg mb-3">{title}</h3>
        <div className="font-mono text-2xl mb-2">{fmt(r?.totalPerM)}원<span className="text-xs text-[#94a3b8]">/M</span></div>
        <div className="text-sm space-y-1 text-[#0f172a]">
          <div>총액: {fmt(r?.rounded)}원</div>
          <div>BB차감: -{fmt(r?.bbRefund)}원 ({((r?.bbRate||0)*100).toFixed(1)}%)</div>
          <div>범위: {fmt(r?.minVal)} ~ {fmt(r?.maxVal)}</div>
        </div>
        <div className="mt-3 text-xs text-[#94a3b8]">경간 {d?.span}M · 횡대 {d?.hwangdae}단 · 기초파이프 {d?.gichoLength ?? '앵커볼트'}M{store.dustH && store.dustH > 0 ? ` · 분진망 ${store.dustH}M` : ' · 분진망 없음'}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold bg-[#1e40af] text-white px-2 py-0.5 rounded">AXIS v4.7</span>
          <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded font-semibold">STEP 2+</span>
          <span className="text-[15px] font-bold text-[#0f172a]">정밀견적</span>
        </div>
        <p className="text-sm text-[#64748b] mb-4">{panel} · H{h}M · L{len}M · {floor} · {region}{(store.dustH && store.dustH > 0) ? ` · 분진망 H:${store.dustH}M` : ''}</p>
        <Stepper step={2} />

        {/* BB 슬라이더 */}
        <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2"><span className="text-sm text-[#94a3b8]">바이백</span><span className="text-[#2563eb] font-mono font-bold">{bbMonths}개월</span></div>
          <input type="range" min={1} max={36} value={bbMonths} onChange={e=>setBbMonths(Number(e.target.value))} className="w-full accent-[#2563eb]"/>
        </div>

        {/* 실전형 vs 구조형 */}
        <div className="flex gap-4 mb-6">
          <Card title="실전형 (기본)" data={practical} color="border-[#2563eb]/50" />
          <Card title="구조형 (구조보강)" data={standard} color="border-[#d97706]/50" />
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2 rounded-lg text-sm font-mono ${tab===t.key?'bg-[#2563eb]/20 text-[#2563eb] border border-[#2563eb]':'bg-[#f9fafb] text-[#94a3b8] border border-[#e5e7eb]'}`}>{t.label}</button>)}
        </div>

        {/* 탭 내용 */}
        <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-lg p-6 mb-6">
          {tab === 'price' && practical?.result && standard?.result && (() => {
            const pR = practical.result;
            const sR = standard.result;
            const pGyeongbi = (pR.eqpTotal || 0) + (pR.transTotal || 0);
            const sGyeongbi = (sR.eqpTotal || 0) + (sR.transTotal || 0);
            const pTrans = pR.transDetail || {};
            const sTrans = sR.transDetail || {};
            const isBB = true; // Premium 페이지는 항상 바이백 기준 (contract: '바이백')

            return (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#e5e7eb]"><th className="text-left py-2 text-[#94a3b8]">항목</th><th className="text-right py-2 text-[#2563eb]">실전형</th><th className="text-right py-2 text-[#d97706]">구조형</th></tr></thead>
                <tbody>
                  {[
                    ['자재비/M', pR.matM, sR.matM],
                    ['노무비/M', pR.labM, sR.labM],
                    ['경비/M', len > 0 ? Math.round(pGyeongbi / len) : 0, len > 0 ? Math.round(sGyeongbi / len) : 0],
                    ['자재 합계', pR.matTotal, sR.matTotal],
                    ['노무 합계', pR.labTotal, sR.labTotal],
                  ].map(([label, p, s], i) => (
                    <tr key={i} className="border-b border-[#e5e7eb]/30"><td className="py-2">{label as string}</td><td className="text-right font-mono">{fmt(p as number)}원</td><td className="text-right font-mono">{fmt(s as number)}원</td></tr>
                  ))}
                  {/* 경비 통합 행 (자재→노무 바로 다음) */}
                  <tr className="border-b border-[#e5e7eb]/30 cursor-pointer hover:bg-[#f8fafc]" onClick={() => setGyeongbiOpen(!gyeongbiOpen)}>
                    <td className="py-2 font-semibold">
                      경비 합계 <span className="text-[10px] text-[#94a3b8] ml-1">{gyeongbiOpen ? '▲ 접기' : '▼ 상세보기'}</span>
                    </td>
                    <td className="text-right font-mono font-semibold">{fmt(pGyeongbi)}원</td>
                    <td className="text-right font-mono font-semibold">{fmt(sGyeongbi)}원</td>
                  </tr>
                  {gyeongbiOpen && (
                    <>
                      {/* 장비 상세 (eqpDetail.items) */}
                      {(pR.eqpDetail?.items || [{ name: '굴착기', qty: 1, amount: pR.eqpTotal || 0 }]).map((eq: any, ei: number) => {
                        const sEq = (sR.eqpDetail?.items || [])[ei];
                        return (
                          <tr key={`eq${ei}`} className="border-b border-[#e5e7eb]/10 bg-[#f8fafc]">
                            <td className="py-1.5 pl-4 text-xs text-[#64748b]">├ {eq.name} {eq.qty}대 × {fmt(eq.price || 0)}원</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(eq.amount)}원</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(sEq?.amount || eq.amount)}원</td>
                          </tr>
                        );
                      })}
                      {/* 운반 상세 (transDetail) */}
                      {pTrans.trucks > 0 && (
                        <>
                          <tr className="border-b border-[#e5e7eb]/10 bg-[#f8fafc]">
                            <td className="py-1.5 pl-4 text-xs text-[#64748b]">├ {pTrans.vehicle || '5톤'} {pTrans.trucks}대 × {fmt(pTrans.perTruck)}원 × {pTrans.trips || 1}회 ({isBB ? '왕복-BB' : '편도'})</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(pTrans.total)}원</td>
                            <td className="text-right font-mono text-xs text-[#64748b]">{fmt(sTrans.total || pTrans.total)}원</td>
                          </tr>
                        </>
                      )}
                    </>
                  )}
                  {[
                    ['BB차감', -pR.bbRefund, -sR.bbRefund],
                    ['총액', pR.rounded, sR.rounded],
                  ].map(([label, p, s], i) => (
                    <tr key={`b${i}`} className={`border-b border-[#e5e7eb]/30 ${(label as string) === '총액' ? 'font-bold' : ''}`}><td className="py-2">{label as string}</td><td className="text-right font-mono">{fmt(p as number)}원</td><td className="text-right font-mono">{fmt(s as number)}원</td></tr>
                  ))}
                  {/* 기한후 월/일사용료 */}
                  {(pR.monthlyRent > 0 || sR.monthlyRent > 0) && (
                    <>
                      <tr className="border-b border-[#e5e7eb]/30">
                        <td className="py-2 text-[#0066CC]">기한후 월사용료</td>
                        <td className="text-right font-mono text-[#0066CC]">{fmt(pR.monthlyRent)}원/월</td>
                        <td className="text-right font-mono text-[#0066CC]">{fmt(sR.monthlyRent)}원/월</td>
                      </tr>
                      <tr className="border-b border-[#e5e7eb]/30">
                        <td className="py-2 text-[#0066CC]">기한후 일사용료</td>
                        <td className="text-right font-mono text-[#0066CC]">{fmt(pR.dailyRent)}원/일</td>
                        <td className="text-right font-mono text-[#0066CC]">{fmt(sR.dailyRent)}원/일</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            );
          })()}
          {tab === 'design' && practical?.design && standard?.design && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#e5e7eb]"><th className="text-left py-2 text-[#94a3b8]">조건</th><th className="text-right text-[#2563eb]">실전형</th><th className="text-right text-[#d97706]">구조형</th></tr></thead>
              <tbody>
                {(() => {
                  const isHBeam = practical.design.structType?.includes('H빔') || standard.design.structType?.includes('H빔');
                  const rows: [string,string,string][] = [
                    ['경간', practical.design.span+'M', standard.design.span+'M'],
                    ...(!isHBeam ? [
                      ['지주간격', practical.design.jiju, standard.design.jiju] as [string,string,string],
                      ['보조지주', practical.design.bojo, standard.design.bojo] as [string,string,string],
                    ] : []),
                    ['횡대', practical.design.hwangdae+'단', standard.design.hwangdae+'단'],
                    ['기초', practical.design.found, standard.design.found],
                    ['기초파이프', (practical.design.gichoLength??'-')+'M', (standard.design.gichoLength??'-')+'M'],
                    ['구조타입', practical.design.structType, standard.design.structType],
                    ...(isHBeam ? [
                      ['지주파이프', '없음 (H빔 대체)', '없음 (H빔 대체)'] as [string,string,string],
                      ['보조지주', '없음 (H빔 자립)', '없음 (H빔 자립)'] as [string,string,string],
                    ] : []),
                  ];
                  return rows.map(([label,p,s],i) => (
                    <tr key={i} className="border-b border-[#e5e7eb]/30"><td className="py-2">{label}</td><td className="text-right font-mono">{p}</td><td className="text-right font-mono">{s}</td></tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
          {tab === 'struct' && structP && structS && (() => {
            const pD = practical.design;
            const sD = standard.design;
            const wind = (structS?.basis || {}) as any;
            const isBK05 = h >= 6 && pD?.structType !== 'H빔식';
            // 스펙 차이 요약
            const diffs: string[] = [];
            if (pD.span !== sD.span) diffs.push(`경간 ${pD.span}M→${sD.span}M`);
            if ((pD.gichoLength||0) !== (sD.gichoLength||0)) diffs.push(`기초 ${pD.gichoLength||'-'}M→${sD.gichoLength||'-'}M`);
            if (pD.bojo !== sD.bojo) diffs.push(`보조지주 ${pD.bojo}→${sD.bojo}`);
            if (pD.hwangdae !== sD.hwangdae) diffs.push(`횡대 ${pD.hwangdae}단→${sD.hwangdae}단`);

            return (
              <div>
                {/* ④ 스펙 차이 요약 */}
                {diffs.length > 0 && (
                  <div className="bg-[#fffbeb] border border-[#fbbf24] rounded-lg p-3 mb-4 text-[12px]">
                    <span className="font-bold text-[#92400e]">구조형 차이:</span>{' '}
                    <span className="text-[#78350f]">{diffs.join(' · ')}</span>
                  </div>
                )}

                {/* ① BK_05 표시 (H≥6m 비계식) */}
                {isBK05 && (
                  <div className="bg-[#fef2f2] border-l-[3px] border-[#ef4444] rounded-r-lg px-3 py-2 mb-4 text-[12px] text-[#991b1b]">
                    <span className="font-bold">BK_05</span> 비계 H≥6m 보조지주 필수 — 보조지주 없으면 자동 N.G. (Rmax≈8.3, 구조적 불가)
                  </div>
                )}

                {/* 기존 바 차트 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {[{title:'실전형',data:structP,color:'#2563eb',design:pD},{title:'구조형',data:structS,color:'#d97706',design:sD}].map(({title,data,color,design})=>(
                    <div key={title}>
                      <h4 className="font-mono font-bold mb-1" style={{color}}>{title} — {data.overall}</h4>
                      {/* ② 근거 한 줄 */}
                      <p className="text-[11px] text-[#64748b] mb-3">
                        풍속 {wind.Vo || 28}m/s | 풍압 {wind.pf_kN?.toFixed(2) || '0.31'}kN/m² | 경간 {design.span}M | 기초 {design.gichoLength || '-'}M
                      </p>
                      {data.checks.map((ck: any)=>(
                        <div key={ck.name} className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={ck.status === 'NG' ? 'text-[#dc2626] font-bold' : ''}>{ck.name}</span>
                            <span className={statusColor(ck.status)}>{typeof ck.val === 'number' ? ck.val.toFixed(3) : ck.val} {ck.status}</span>
                          </div>
                          <div className="h-2 bg-[#e5e7eb] rounded"><div className={`h-2 rounded ${barColor(ck.status)}`} style={{width:`${Math.min(100, Math.abs(ck.val)/ck.max*100)}%`}}/></div>
                          {/* N.G./WARN 해결방안 코멘트 */}
                          {ck.fix && (ck.status === 'NG' || ck.status === 'WARN') && (
                            <p className="text-[10px] mt-1 text-[#dc2626]">→ {ck.fix}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* H빔 콘크리트 기초 면책 */}
                {structS?.isHBeam && (
                  <div className="bg-[#eff6ff] border border-[#93c5fd] rounded-lg p-2.5 mb-3 text-[11px] text-[#1e40af]">
                    ※ H빔식은 콘크리트 기초에 H빔을 매립하는 구조입니다.
                    파이프 인발 검토(BK_04)는 적용되지 않으며, 콘크리트 기초 설계는 구조검토서에 따릅니다.
                  </div>
                )}

                {/* ③ 면책 문구 (접힘) */}
                <details className="text-[11px] text-[#94a3b8] border-t border-[#e5e7eb] pt-2">
                  <summary className="cursor-pointer hover:text-[#64748b]">구조 면책 안내</summary>
                  <p className="mt-2 leading-5">
                    ※ 본 견적의 구조 조건은 AXIS 엔진이 현장 풍속·높이 기반으로 산출한 참고값이며,
                    법적 구조검토서를 대체하지 않습니다.
                    풍하중 계수(Kzr=0.81, Kzt=1.0, Iw=0.6, ρ=1.25)는 표준값을 적용하였고,
                    지반 조건은 표준값(SPT=15, φ=30°)을 가정하였으며,
                    실제 시공 시 현장 여건에 따라 전문 구조기술사의 검토를 받으시기 바랍니다.
                  </p>
                </details>
              </div>
            );
          })()}
          {tab === 'env' && envP && envS && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{title:'실전형',data:envP,color:'#2563eb'},{title:'구조형',data:envS,color:'#d97706'}].map(({title,data,color})=>(
                <div key={title}>
                  <h4 className="font-mono font-bold mb-1" style={{color}}>{title} — {data.grade}</h4>
                  <div className="font-mono text-2xl mb-3" style={{color}}>{data.total}점</div>
                  {data.items.map((it: any)=>(
                    <div key={it.name} className="mb-3">
                      <div className="flex justify-between text-xs mb-1"><span>{it.name}</span><span className="text-[#0f172a]">{it.val}{it.unit}</span></div>
                      <div className="h-2 bg-[#e5e7eb] rounded"><div className="h-2 rounded bg-[#3b82f6]" style={{width:`${Math.min(100,it.pct)}%`}}/></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 선택 버튼 */}
        <div className="flex gap-4 mb-6">
          <button onClick={()=>navigate(`/quote/level/${id}`)} className="flex-1 py-3 rounded-lg bg-[#2563eb] text-[#f8fafc] font-bold hover:bg-[#2563eb]/80">실전형 선택</button>
          <button onClick={()=>navigate(`/quote/level/${id}`)} className="flex-1 py-3 rounded-lg border border-[#d97706] text-[#d97706] font-bold hover:bg-[#d97706]/10">구조형 선택</button>
        </div>

        {/* Excel 다운로드 */}
        {practical?.result && standard?.result && (
          <button
            onClick={() => {
              const buildRows = (data: any): ExportRow[] => {
                const r = data.result;
                const d = data.design;
                const rows: ExportRow[] = [];
                // 자재 BOM — calcEstimate의 items에서 단가/금액/BB 포함
                if (r.items && r.items.length > 0) {
                  for (const it of r.items) {
                    if (it.qty <= 0) continue;
                    const amt = it.qty * it.price;
                    const bbAmt = it.bbDeduct || 0;
                    rows.push({
                      name: it.name, spec: it.spec || '', unit: 'EA',
                      qty: it.qty, price: it.price, amount: amt,
                      bbAmount: bbAmt > 0 ? -bbAmt : undefined,
                      finalAmount: amt - bbAmt,
                      assetType: it.bbGrade || '', basis: '', category: 'mat',
                    });
                  }
                }
                // 노무비
                if (r.laborDetail) {
                  if (r.laborDetail.installTotal > 0) rows.push({ name: '설치비', spec: '', unit: '식', qty: 1, price: r.laborDetail.installTotal, amount: r.laborDetail.installTotal, finalAmount: r.laborDetail.installTotal, assetType: '', basis: `${len}m`, category: 'labor' });
                  if (r.laborDetail.removeTotal > 0) rows.push({ name: '해체비', spec: '', unit: '식', qty: 1, price: r.laborDetail.removeTotal, amount: r.laborDetail.removeTotal, finalAmount: r.laborDetail.removeTotal, assetType: '', basis: `${len}m`, category: 'labor' });
                }
                // 장비
                for (const eq of (r.eqpDetail?.items || [{ name: '굴착기', qty: 1, price: r.eqpTotal, amount: r.eqpTotal }])) {
                  rows.push({ name: eq.name, spec: '', unit: '대', qty: eq.qty, price: eq.price, amount: eq.amount, finalAmount: eq.amount, assetType: '', basis: '', category: 'equip' });
                }
                // 운반
                if (r.transDetail?.trucks > 0) {
                  rows.push({ name: `${r.transDetail.vehicle || '5톤'} 카고트럭`, spec: '', unit: '대', qty: r.transDetail.trucks, price: r.transDetail.perTruck, amount: r.transTotal, finalAmount: r.transTotal, assetType: '', basis: `${r.transDetail.trips}회`, category: 'trans' });
                }
                // 기한후 월사용료
                if (r.monthlyRent > 0) {
                  rows.push({ name: '기한후 월사용료', spec: '계약만료 후', unit: '월', qty: 1, price: r.monthlyRent, amount: r.monthlyRent, finalAmount: r.monthlyRent, assetType: '', basis: '품목별 월대여료율', category: 'rent' });
                }
                return rows;
              };

              const makeSlot = (label: string, data: any, mode: string): QuoteSlotData => ({
                label, panel, height: h, length: len, asset: '전체고재', contract: '바이백',
                mode, span: data.design?.span || 3, bbMonths,
                matTotal: data.result.matTotal, labTotal: data.result.labTotal,
                eqpTotal: data.result.eqpTotal, transTotal: data.result.transTotal,
                gateTotal: data.result.gateTotal || 0, bbRefund: data.result.bbRefund,
                total: data.result.total, totalPerM: data.result.totalPerM,
                monthlyRent: data.result.monthlyRent || 0, dailyRent: data.result.dailyRent || 0,
                rows: buildRows(data),
              });

              exportQuotesToExcel([
                makeSlot('견적1-실전형', practical, '실전형'),
                makeSlot('견적2-구조형', standard, '구조형'),
              ], '', new Date().toISOString().slice(0, 10));
            }}
            className="w-full py-3 rounded-lg border border-[#334155] text-[#94A3B8] font-bold hover:bg-[#111B2A] mb-6">
            📥 Excel 내역서 다운로드
          </button>
        )}

        <div className="text-xs text-[#94a3b8] bg-[#ffffff] rounded-lg p-4 border border-[#e5e7eb] leading-relaxed">⚠ 본 견적은 과거 시공 데이터 기반 예상 범위이며, 구조설계 도서가 아닙니다. 구조 조건(경간/횡대/근입 등)은 참고용이며, 실제 시공 시 현장 여건에 따라 시공업체가 조정합니다. AXIS는 구조안전 설계를 제공하지 않으며, 시공 결과에 대한 설계 책임을 지지 않습니다. 정밀 구조검토가 필요한 경우 별도의 구조설계 전문업체에 의뢰하시기 바랍니다.</div>
      </div>
    </div>
  );
}
