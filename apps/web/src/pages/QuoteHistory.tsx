import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface QuoteRecord {
  id: string;
  createdAt: string;
  year: number;
  month: number;
  input: {
    panel: string;
    height: number;
    length: number;
    span: number;
    contract: string;
    months: number;
    asset: string;
    dustH: number;
    dustN: number;
    location: string;
    door: string | null;
  };
  result: {
    matTotal: number;
    labTotal: number;
    equipTotal: number;
    transTotal: number;
    doorTotal: number;
    grandTotal: number;
    bbTotal: number;
    finalTotal: number;
    matPerM: number;
    labPerM: number;
    expPerM: number;
    totalPerM: number;
  };
  bom: any[];
  designComments: string[];
  sends: any[];
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

function fmt(n: number): string {
  return n.toLocaleString('ko-KR');
}

export default function QuoteHistory() {
  const { token } = useAuthStore();
  const [records, setRecords] = useState<QuoteRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRecords = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = { year };
      if (month) params.month = month;
      const { data } = await api.get('/api/quotes', { params });
      setRecords(data.records);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [year, month, token]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 견적 기록을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/api/quotes/${id}`);
      setRecords(prev => prev.filter(r => r.id !== id));
      setTotal(prev => prev - 1);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch { /* silent */ }
  };

  const panelLabel = (p: string) => {
    if (p === 'RPP') return 'RPP방음판';
    if (p === '스틸') return '스틸방음판';
    if (p === 'EGI') return 'EGI휀스';
    return p;
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070C12' }}>
        <div className="text-center">
          <p style={{ color: '#94A3B8' }}>로그인이 필요합니다.</p>
          <Link to="/auth/login" style={{ color: '#00D9CC' }} className="hover:underline">로그인</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#070C12', color: '#F1F5F9' }}>
      {/* Header */}
      <div style={{ background: '#0C1520', borderBottom: '1px solid #1E293B' }} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" style={{ color: '#00D9CC' }} className="font-mono font-bold text-xl tracking-wider">AXIS</Link>
            <span style={{ color: '#64748B' }}>/</span>
            <h1 className="text-lg font-semibold">내 견적 기록</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/quote/new" style={{ background: '#00D9CC', color: '#070C12' }}
              className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
              + 새 견적
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }}
            className="px-3 py-2 rounded-lg text-sm">
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={month ?? ''} onChange={e => setMonth(e.target.value ? Number(e.target.value) : null)}
            style={{ background: '#111B2A', border: '1px solid #334155', color: '#F1F5F9' }}
            className="px-3 py-2 rounded-lg text-sm">
            <option value="">전체 월</option>
            {months.map(m => <option key={m} value={m}>{m}월</option>)}
          </select>
          <span style={{ color: '#64748B' }} className="text-sm ml-2">총 {total}건</span>
        </div>

        {/* Selected actions */}
        {selected.size > 0 && (
          <div style={{ background: '#111B2A', border: '1px solid #334155' }}
            className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm" style={{ color: '#94A3B8' }}>
              {selected.size}개 선택됨 (최대 4개)
            </span>
            <button style={{ background: '#00D9CC', color: '#070C12' }}
              className="px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90"
              onClick={() => alert('합산 견적 기능은 Phase 2에서 구현됩니다.')}>
              합산 견적 만들기
            </button>
          </div>
        )}

        {/* Records List */}
        {loading ? (
          <div className="text-center py-20" style={{ color: '#64748B' }}>불러오는 중...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ color: '#64748B' }} className="text-lg mb-2">저장된 견적이 없습니다.</p>
            <Link to="/quote/new" style={{ color: '#00D9CC' }} className="hover:underline text-sm">
              새 견적을 시작해보세요
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} style={{ background: '#0C1520', border: `1px solid ${selected.has(r.id) ? '#00D9CC' : '#1E293B'}` }}
                className="rounded-lg overflow-hidden transition-colors">
                {/* Row */}
                <div className="flex items-center px-4 py-3 gap-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                  <input type="checkbox" checked={selected.has(r.id)}
                    onChange={e => { e.stopPropagation(); toggleSelect(r.id); }}
                    className="w-4 h-4 rounded" style={{ accentColor: '#00D9CC' }} />
                  <div className="flex-1 flex items-center gap-4 min-w-0">
                    <span className="text-sm" style={{ color: '#64748B' }}>
                      {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {panelLabel(r.input.panel)} H{r.input.height}M {r.input.length}M
                      {r.input.contract === '바이백' ? ` BB${r.input.months}` : ' 판매'}
                      {' '}{r.input.asset}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-semibold" style={{ color: '#00D9CC' }}>
                    {fmt(r.result.finalTotal)}원
                  </span>
                  <span style={{ color: '#64748B' }} className="text-xs">
                    {expandedId === r.id ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded Detail */}
                {expandedId === r.id && (
                  <div style={{ background: '#111B2A', borderTop: '1px solid #1E293B' }} className="px-4 py-4">
                    {/* 재노경 M당 단가 */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-2" style={{ color: '#F0A500' }}>재노경 M당 단가</h3>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div style={{ background: '#0C1520' }} className="rounded p-2 text-center">
                          <div style={{ color: '#64748B' }} className="text-xs">재료비</div>
                          <div className="font-mono">{fmt(r.result.matPerM)}원/M</div>
                        </div>
                        <div style={{ background: '#0C1520' }} className="rounded p-2 text-center">
                          <div style={{ color: '#64748B' }} className="text-xs">노무비</div>
                          <div className="font-mono">{fmt(r.result.labPerM)}원/M</div>
                        </div>
                        <div style={{ background: '#0C1520' }} className="rounded p-2 text-center">
                          <div style={{ color: '#64748B' }} className="text-xs">경비</div>
                          <div className="font-mono">{fmt(r.result.expPerM)}원/M</div>
                        </div>
                        <div style={{ background: '#0C1520', border: '1px solid #334155' }} className="rounded p-2 text-center">
                          <div style={{ color: '#64748B' }} className="text-xs">합계</div>
                          <div className="font-mono font-semibold" style={{ color: '#00D9CC' }}>{fmt(r.result.totalPerM)}원/M</div>
                        </div>
                      </div>
                    </div>

                    {/* 설계 코멘트 */}
                    {r.designComments.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-2" style={{ color: '#F0A500' }}>설계 조건</h3>
                        <div style={{ background: '#0C1520' }} className="rounded p-3">
                          {r.designComments.map((c, i) => (
                            <div key={i} className="text-sm" style={{ color: '#94A3B8' }}>· {c}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 금액 요약 */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-2" style={{ color: '#F0A500' }}>금액 요약</h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm" style={{ color: '#94A3B8' }}>
                        <div className="flex justify-between"><span>자재비</span><span className="font-mono">{fmt(r.result.matTotal)}</span></div>
                        <div className="flex justify-between"><span>노무비</span><span className="font-mono">{fmt(r.result.labTotal)}</span></div>
                        <div className="flex justify-between"><span>장비비</span><span className="font-mono">{fmt(r.result.equipTotal)}</span></div>
                        <div className="flex justify-between"><span>운반비</span><span className="font-mono">{fmt(r.result.transTotal)}</span></div>
                        {r.result.doorTotal > 0 && (
                          <div className="flex justify-between"><span>도어비</span><span className="font-mono">{fmt(r.result.doorTotal)}</span></div>
                        )}
                        {r.result.bbTotal !== 0 && (
                          <div className="flex justify-between" style={{ color: '#EF4444' }}>
                            <span>BB차감</span><span className="font-mono">{fmt(r.result.bbTotal)}</span>
                          </div>
                        )}
                        <div className="flex justify-between col-span-2 pt-2 mt-1" style={{ borderTop: '1px solid #334155', color: '#F1F5F9' }}>
                          <span className="font-semibold">최종금액</span>
                          <span className="font-mono font-semibold" style={{ color: '#00D9CC' }}>{fmt(r.result.finalTotal)}원</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid #1E293B' }}>
                      <button onClick={() => handleDelete(r.id)}
                        style={{ color: '#EF4444' }} className="text-sm hover:underline">삭제</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p style={{ color: '#475569' }} className="text-xs leading-relaxed">
          ※ 본 검토 결과는 AXIS 엔진의 자동 산출값으로, 실제 시공에 적용하기 위한 법적 구조검토서를 대체하지 않습니다.
          현장 조건(지반, 풍하중, 하중조건 등)에 따라 결과가 달라질 수 있으므로, 정밀 시공 시에는 반드시 전문 구조기술사의 검토를 받으시기 바랍니다.
          본 자료는 견적 참고용이며, AXIS 및 제공자는 본 결과의 활용으로 인한 어떠한 손해에 대해서도 책임을 지지 않습니다.
        </p>
      </div>
    </div>
  );
}
