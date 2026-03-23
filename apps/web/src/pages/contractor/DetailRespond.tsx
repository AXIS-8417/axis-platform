import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface Specs {
  span: string;      // 경간
  column: string;    // 지주
  foundation: string; // 기초
  beam: string;      // 횡대
}

export default function DetailRespond() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [enginePrice, setEnginePrice] = useState(285000);
  const [unitPrice, setUnitPrice] = useState(285000);
  const [workDays, setWorkDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Spec modifications
  const [specs, setSpecs] = useState<Specs>({
    span: '3m',
    column: 'H-200',
    foundation: '독립기초',
    beam: '2단',
  });
  const [originalSpecs, setOriginalSpecs] = useState<Specs>({
    span: '3m',
    column: 'H-200',
    foundation: '독립기초',
    beam: '2단',
  });

  // Cost modifications
  const [laborCost, setLaborCost] = useState(95000);
  const [transportCost, setTransportCost] = useState(15000);
  const [equipmentCost, setEquipmentCost] = useState(25000);
  const [doorCost, setDoorCost] = useState(0);

  const specChanged =
    specs.span !== originalSpecs.span ||
    specs.column !== originalSpecs.column ||
    specs.foundation !== originalSpecs.foundation ||
    specs.beam !== originalSpecs.beam;

  useEffect(() => {
    fetchEstimate();
  }, [id]);

  const fetchEstimate = async () => {
    try {
      const { data } = await api.get(`/api/estimates/${id}`);
      if (data.engineUnitPrice) {
        setEnginePrice(data.engineUnitPrice);
        setUnitPrice(data.engineUnitPrice);
      }
      if (data.specs) {
        setSpecs(data.specs);
        setOriginalSpecs(data.specs);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const resetSpecs = () => {
    setSpecs({ ...originalSpecs });
  };

  const updateSpec = (key: keyof Specs, value: string) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  const deviation = ((unitPrice - enginePrice) / enginePrice) * 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/estimates/${id}/respond`, {
        layer: 'L2',
        unitPrice,
        workDays,
        specs,
        specChanged,
        laborCost,
        transportCost,
        equipmentCost,
        doorCost,
      });
      navigate('/contractor/requests');
    } catch {
      navigate('/contractor/requests');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-axis-bg flex items-center justify-center">
        <div className="text-axis-teal font-mono animate-pulse">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-axis-bg">
      <div className="border-b border-axis-border px-6 py-4">
        <h1 className="text-axis-teal font-mono font-bold text-lg">상세 응답 (Layer 2)</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Engine reference */}
        <div className="axis-card flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs">엔진 기준 M당 단가</div>
            <div className="font-mono text-xl text-axis-teal">
              {enginePrice.toLocaleString()}원
            </div>
          </div>
          <div className={`font-mono font-bold ${
            Math.abs(deviation) <= 15 ? 'text-green-400' :
            Math.abs(deviation) <= 30 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
          </div>
        </div>

        {/* Spec modification */}
        <div className="axis-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-semibold">스펙 변경</h3>
            <button
              onClick={resetSpecs}
              className="text-xs text-axis-teal hover:underline font-mono"
            >
              엔진 기준 초기화
            </button>
          </div>

          {specChanged && (
            <div className="bg-axis-amber/10 border border-axis-amber/30 text-axis-amber rounded-lg px-4 py-3 text-sm mb-4">
              스펙이 엔진 기준과 다릅니다. 갑 측 비교 화면에 "스펙변경" 뱃지가 표시됩니다.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="axis-label">경간</label>
              <select
                value={specs.span}
                onChange={(e) => updateSpec('span', e.target.value)}
                className="axis-input w-full"
              >
                <option value="2m">2m</option>
                <option value="3m">3m</option>
                <option value="4m">4m</option>
                <option value="5m">5m</option>
              </select>
            </div>
            <div>
              <label className="axis-label">지주</label>
              <select
                value={specs.column}
                onChange={(e) => updateSpec('column', e.target.value)}
                className="axis-input w-full"
              >
                <option value="H-150">H-150</option>
                <option value="H-200">H-200</option>
                <option value="H-250">H-250</option>
                <option value="H-300">H-300</option>
              </select>
            </div>
            <div>
              <label className="axis-label">기초</label>
              <select
                value={specs.foundation}
                onChange={(e) => updateSpec('foundation', e.target.value)}
                className="axis-input w-full"
              >
                <option value="독립기초">독립기초</option>
                <option value="연속기초">연속기초</option>
                <option value="말뚝기초">말뚝기초</option>
              </select>
            </div>
            <div>
              <label className="axis-label">횡대</label>
              <select
                value={specs.beam}
                onChange={(e) => updateSpec('beam', e.target.value)}
                className="axis-input w-full"
              >
                <option value="1단">1단</option>
                <option value="2단">2단</option>
                <option value="3단">3단</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cost modifications */}
        <div className="axis-card space-y-4">
          <h3 className="text-slate-300 font-semibold">비용 내역</h3>

          <div>
            <label className="axis-label">M당 단가 (원)</label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="axis-input w-full font-mono"
              min={0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="axis-label">노무비 (원)</label>
              <input
                type="number"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                className="axis-input w-full font-mono"
                min={0}
              />
            </div>
            <div>
              <label className="axis-label">운반비 (원)</label>
              <input
                type="number"
                value={transportCost}
                onChange={(e) => setTransportCost(Number(e.target.value))}
                className="axis-input w-full font-mono"
                min={0}
              />
            </div>
            <div>
              <label className="axis-label">장비비 (원)</label>
              <input
                type="number"
                value={equipmentCost}
                onChange={(e) => setEquipmentCost(Number(e.target.value))}
                className="axis-input w-full font-mono"
                min={0}
              />
            </div>
            <div>
              <label className="axis-label">도어비 (원)</label>
              <input
                type="number"
                value={doorCost}
                onChange={(e) => setDoorCost(Number(e.target.value))}
                className="axis-input w-full font-mono"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Work days */}
        <div className="axis-card">
          <label className="axis-label">예상 공사일수</label>
          <select
            value={workDays}
            onChange={(e) => setWorkDays(Number(e.target.value))}
            className="axis-input w-full"
          >
            {[15, 20, 25, 30, 35, 40, 45, 60].map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="axis-btn-primary w-full"
        >
          {submitting ? '제출 중...' : '상세 응답 제출'}
        </button>
      </div>
    </div>
  );
}
