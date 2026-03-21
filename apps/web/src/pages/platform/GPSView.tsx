import { useState, useEffect } from 'react';
import api from '../../lib/api';

const card = { background: '#0C1520', border: '1px solid #1E293B' };
const elevated = { background: '#111B2A', border: '1px solid #1E293B' };

type EventType = 'ARRIVED' | 'START' | 'WAITING' | 'SUSPENDED' | 'RE_ARRIVED' | 'COMPLETED';

const EVENT_COLORS: Record<EventType, string> = {
  ARRIVED: '#00D9CC',
  START: '#22C55E',
  WAITING: '#F0A500',
  SUSPENDED: '#EF4444',
  RE_ARRIVED: '#06B6D4',
  COMPLETED: '#3B82F6',
};

interface GPSEvent {
  type: EventType;
  time: string;
  distance: number;
  trigger: 'AUTO' | 'BUTTON';
}

const MOCK_TIMELINE: GPSEvent[] = [
  { type: 'ARRIVED', time: '08:12:34', distance: 85, trigger: 'AUTO' },
  { type: 'START', time: '08:17:50', distance: 42, trigger: 'AUTO' },
  { type: 'WAITING', time: '10:45:10', distance: 15, trigger: 'AUTO' },
  { type: 'SUSPENDED', time: '11:15:22', distance: 210, trigger: 'AUTO' },
  { type: 'RE_ARRIVED', time: '12:30:05', distance: 78, trigger: 'BUTTON' },
  { type: 'COMPLETED', time: '17:02:18', distance: 30, trigger: 'BUTTON' },
];

const TRANSITION_RULES = [
  { from: 'IDLE', to: 'ARRIVED', condition: 'distance <= ARRIVAL_RADIUS (100m)' },
  { from: 'ARRIVED', to: 'START', condition: 'stay >= AUTO_START (5분) 또는 BUTTON' },
  { from: 'START', to: 'WAITING', condition: '이동없음 >= WAIT_THRESHOLD (30분)' },
  { from: 'START', to: 'SUSPENDED', condition: 'distance > DEPART_RADIUS (200m)' },
  { from: 'SUSPENDED', to: 'RE_ARRIVED', condition: 'distance <= ARRIVAL_RADIUS && elapsed < RE_ARRIVAL (60분)' },
  { from: 'START', to: 'COMPLETED', condition: 'BUTTON 또는 distance > DEPART_RADIUS + 자동종료' },
];

const DEFAULT_GPS_CONFIG = [
  { key: 'ARRIVAL_RADIUS', value: '100m', desc: '도착 판정 반경' },
  { key: 'DEPART_RADIUS', value: '200m', desc: '이탈 판정 반경' },
  { key: 'STAY_MIN', value: '3분', desc: '최소 체류 시간' },
  { key: 'AUTO_START', value: '5분', desc: '자동 시작 대기' },
  { key: 'WAIT_THRESHOLD', value: '30분', desc: '대기 전환 임계' },
  { key: 'SUSPEND_TIMEOUT', value: '15분', desc: '일시중단 타임아웃' },
  { key: 'RE_ARRIVAL', value: '60분', desc: '재도착 유효 시간' },
  { key: 'ACCURACY_MAX', value: '50m', desc: 'GPS 정확도 상한' },
];

export default function GPSView() {
  const [selected, setSelected] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<GPSEvent[]>(MOCK_TIMELINE);
  const [gpsConfig, setGpsConfig] = useState(DEFAULT_GPS_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/platform/config'),
      api.get('/api/platform/work-orders', { params: { limit: 1 } }),
    ]).then(([configR, woR]) => {
      // Load GPS config from platform config
      if (configR.status === 'fulfilled' && configR.value.data) {
        const cfg = configR.value.data;
        if (cfg.gpsConfig || cfg.GPS_CONFIG) {
          const raw = cfg.gpsConfig || cfg.GPS_CONFIG;
          if (Array.isArray(raw)) {
            setGpsConfig(raw);
          } else if (typeof raw === 'object') {
            setGpsConfig(Object.entries(raw).map(([key, val]: any) => ({
              key,
              value: typeof val === 'object' ? val.value : String(val),
              desc: typeof val === 'object' ? val.desc : key,
            })));
          }
        }
      }

      // Load recent work order GPS events if available
      if (woR.status === 'fulfilled') {
        const woData = woR.value.data?.items || woR.value.data?.data || [];
        if (woData.length > 0 && woData[0].gpsEvents) {
          const events: GPSEvent[] = woData[0].gpsEvents.map((e: any) => ({
            type: e.type || e.eventType,
            time: e.time || (e.timestamp ? new Date(e.timestamp).toLocaleTimeString('ko-KR') : '-'),
            distance: e.distance || 0,
            trigger: e.trigger || 'AUTO',
          }));
          if (events.length > 0) setTimeline(events);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold mb-2">GPS 엔진</h1>
        <div className="text-sm animate-pulse" style={{ color: '#64748B' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-2">GPS 엔진</h1>
      <div className="text-xs mb-6" style={{ color: '#64748B' }}>PART258 - 자동전환 상태머신 기반 GPS 이벤트 타임라인</div>

      {/* Timeline */}
      <div style={card} className="rounded-lg p-6 mb-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: '#00D9CC' }}>이벤트 타임라인</h2>
        <div className="flex items-center gap-1 mb-6">
          {timeline.map((ev, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => setSelected(selected === i ? null : i)}
                className="flex flex-col items-center cursor-pointer"
                style={{ minWidth: 100 }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: EVENT_COLORS[ev.type] + '20',
                    border: `2px solid ${EVENT_COLORS[ev.type]}`,
                    color: EVENT_COLORS[ev.type],
                    boxShadow: selected === i ? `0 0 12px ${EVENT_COLORS[ev.type]}40` : 'none',
                  }}>
                  {i + 1}
                </div>
                <div className="text-xs font-mono mt-2" style={{ color: EVENT_COLORS[ev.type] }}>{ev.type}</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{ev.time}</div>
              </button>
              {i < timeline.length - 1 && (
                <div className="h-0.5 w-8 flex-shrink-0" style={{ background: '#1E293B' }} />
              )}
            </div>
          ))}
        </div>

        {selected !== null && timeline[selected] && (
          <div style={elevated} className="rounded-lg p-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs" style={{ color: '#64748B' }}>이벤트</span>
                <div className="font-bold" style={{ color: EVENT_COLORS[timeline[selected].type] }}>
                  {timeline[selected].type}
                </div>
              </div>
              <div>
                <span className="text-xs" style={{ color: '#64748B' }}>시간</span>
                <div className="font-mono">{timeline[selected].time}</div>
              </div>
              <div>
                <span className="text-xs" style={{ color: '#64748B' }}>거리</span>
                <div className="font-mono">{timeline[selected].distance}m</div>
              </div>
              <div>
                <span className="text-xs" style={{ color: '#64748B' }}>트리거</span>
                <div className="font-mono" style={{ color: timeline[selected].trigger === 'AUTO' ? '#22C55E' : '#F0A500' }}>
                  {timeline[selected].trigger}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Auto Transition Conditions */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-4" style={{ color: '#F0A500' }}>자동 전환 조건 (6 Rules)</h2>
          <div className="space-y-3">
            {TRANSITION_RULES.map((r, i) => (
              <div key={i} style={elevated} className="rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#1E293B', color: '#94A3B8' }}>{r.from}</span>
                  <span style={{ color: '#64748B' }}>-&gt;</span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: EVENT_COLORS[r.to as EventType] + '20', color: EVENT_COLORS[r.to as EventType] || '#94A3B8' }}>{r.to}</span>
                </div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>{r.condition}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Constants */}
        <div style={card} className="rounded-lg p-6">
          <h2 className="text-sm font-bold mb-4" style={{ color: '#8B5CF6' }}>GPS_CONFIG 정책 상수 ({gpsConfig.length} Values)</h2>
          <div className="space-y-2">
            {gpsConfig.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1E293B' }}>
                <div>
                  <span className="text-sm font-mono font-semibold" style={{ color: '#8B5CF6' }}>{c.key}</span>
                  <span className="text-xs ml-2" style={{ color: '#64748B' }}>{c.desc}</span>
                </div>
                <span className="text-sm font-mono font-bold" style={{ color: '#F1F5F9' }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
