// AXIS 운반비 V3 엔진 — modTransport_v3_patch.bas 완전 이식
// 8차량 최적배차 + Haversine 거리산출 + 운반요율 테이블

// ══════════════════════════════════════════
// Haversine 거리 계산
// ══════════════════════════════════════════
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const clampedA = Math.min(a, 0.9999999);
  return 2 * R * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
}

// ══════════════════════════════════════════
// 차량 스펙 (VBA vN/vW/vC 배열 이식)
// ══════════════════════════════════════════
export interface VehicleSpec {
  name: string;
  capacity: number;   // kg
  volume: number;      // m³
  ratio: number;       // 5톤 대비 단가 비율
}

export const VEHICLES: VehicleSpec[] = [
  { name: '24톤',  capacity: 24000, volume: 60, ratio: 2.0 },
  { name: '11톤',  capacity: 14000, volume: 45, ratio: 1.55 },
  { name: '5톤축', capacity: 12000, volume: 40, ratio: 1.1 },
  { name: '5톤',   capacity: 8500,  volume: 35, ratio: 1.0 },
  { name: '3.5톤', capacity: 4500,  volume: 30, ratio: 0.86 },
  { name: '2.5톤', capacity: 2500,  volume: 20, ratio: 0.68 },
  { name: '1.4톤', capacity: 1500,  volume: 15, ratio: 0.5 },
  { name: '1톤',   capacity: 1100,  volume: 8,  ratio: 0.5 },
];

// ══════════════════════════════════════════
// 5톤 기준 거리별 단가 산출
// ══════════════════════════════════════════
export function calcBase5tonPrice(distKm: number): number {
  let price: number;
  if (distKm <= 30) {
    price = 140000;
  } else if (distKm <= 80) {
    price = 220000 + 1000 * (distKm - 30);
  } else {
    price = 205000 + 620 * distKm;
  }
  // 만원 올림
  return Math.ceil(price / 10000) * 10000;
}

// ══════════════════════════════════════════
// 차량별 단가 산출
// ══════════════════════════════════════════
export function calcVehiclePrice(distKm: number, ratio: number): number {
  const base = calcBase5tonPrice(distKm);
  const price = Math.round(base * ratio);
  return Math.ceil(price / 10000) * 10000;
}

// ══════════════════════════════════════════
// 운반요율 테이블 (지역별 차량별 직접요율)
// ══════════════════════════════════════════
export interface RateEntry {
  destKey: string;    // "경기도|김포시"
  vehicle: string;    // "5톤"
  rate: number;       // 원
}

// ══════════════════════════════════════════
// 지역 좌표 DB (Haversine 계산용)
// ══════════════════════════════════════════
export interface RegionCoord {
  key: string;        // "경기도|김포시"
  lat: number;
  lon: number;
}

// 주요 지역 좌표 (VBA 지역_마스터 시트 기반)
export const REGION_COORDS: RegionCoord[] = [
  { key: '경기도|김포시', lat: 37.6153, lon: 126.7156 },
  { key: '서울특별시|강남구', lat: 37.5172, lon: 127.0473 },
  { key: '서울특별시|서초구', lat: 37.4837, lon: 127.0324 },
  { key: '서울특별시|송파구', lat: 37.5145, lon: 127.1050 },
  { key: '서울특별시|마포구', lat: 37.5664, lon: 126.9018 },
  { key: '경기도|성남시', lat: 37.4200, lon: 127.1267 },
  { key: '경기도|수원시', lat: 37.2636, lon: 127.0286 },
  { key: '경기도|용인시', lat: 37.2411, lon: 127.1776 },
  { key: '경기도|화성시', lat: 37.1994, lon: 126.8312 },
  { key: '경기도|안산시', lat: 37.3219, lon: 126.8309 },
  { key: '경기도|평택시', lat: 36.9922, lon: 127.1128 },
  { key: '인천광역시|남동구', lat: 37.4488, lon: 126.7316 },
  { key: '충청남도|천안시', lat: 36.8151, lon: 127.1139 },
  { key: '충청북도|청주시', lat: 36.6425, lon: 127.4890 },
  { key: '강원도|원주시', lat: 37.3422, lon: 127.9201 },
  { key: '전라북도|전주시', lat: 35.8242, lon: 127.1480 },
  { key: '경상북도|포항시', lat: 36.0190, lon: 129.3435 },
  { key: '경상남도|창원시', lat: 35.2282, lon: 128.6811 },
  { key: '부산광역시|해운대구', lat: 35.1631, lon: 129.1636 },
  { key: '제주특별자치도|제주시', lat: 33.4996, lon: 126.5312 },
];

// ══════════════════════════════════════════
// Transport Input/Output
// ══════════════════════════════════════════
export interface TransportInput {
  warehouseKey: string;       // 출발지 "경기도|김포시"
  destKey: string;            // 도착지 "서울특별시|강남구"
  totalWeight: number;        // kg
  totalVolume: number;        // m³
  contractMode: '바이백' | '일반판매' | '월임대';
  noLargeTruck: boolean;      // 대형차 진입불가
  rateTable?: RateEntry[];    // 운반요율 테이블 (있으면 우선)
}

export interface TransportResult {
  vehicleName: string;
  qty: number;
  unitRate: number;
  totalCost: number;
  distKm: number;
  trips: number;
  allOptions: TransportOption[];
}

export interface TransportOption {
  vehicleName: string;
  qty: number;
  rate: number;
  totalCost: number;
}

// ══════════════════════════════════════════
// 거리 산출 (좌표 기반)
// ══════════════════════════════════════════
function findCoord(key: string, extraCoords?: RegionCoord[]): RegionCoord | undefined {
  const all = extraCoords ? [...REGION_COORDS, ...extraCoords] : REGION_COORDS;
  return all.find((c) => c.key === key);
}

export function calcDistance(
  srcKey: string,
  destKey: string,
  extraCoords?: RegionCoord[],
): number {
  const src = findCoord(srcKey, extraCoords);
  const dest = findCoord(destKey, extraCoords);
  if (!src || !dest) return 0;
  // 직선거리 × 1.35 도로보정계수
  return haversine(src.lat, src.lon, dest.lat, dest.lon) * 1.35;
}

// ══════════════════════════════════════════
// 요율 조회 (테이블 우선 → Haversine 폴백)
// ══════════════════════════════════════════
function getRate(
  srcKey: string,
  destKey: string,
  vehicleName: string,
  distKm: number,
  rateTable?: RateEntry[],
): number {
  // 1) 요율 테이블 조회
  if (rateTable && rateTable.length > 0) {
    const entry = rateTable.find(
      (r) => r.destKey === destKey && r.vehicle === vehicleName,
    );
    if (entry && entry.rate > 0) return entry.rate;
  }

  // 2) Haversine 기반 폴백
  if (distKm <= 0) return 0;
  const vehicle = VEHICLES.find((v) => v.name === vehicleName);
  if (!vehicle) return 0;
  return calcVehiclePrice(distKm, vehicle.ratio);
}

// ══════════════════════════════════════════
// 메인: 최적 운반 배차
// ══════════════════════════════════════════
export function calcTransportV3(input: TransportInput): TransportResult | null {
  if (input.totalWeight <= 0 && input.totalVolume <= 0) return null;

  const distKm = calcDistance(input.warehouseKey, input.destKey);
  const trips = input.contractMode === '바이백' ? 2 : 1;

  const allOptions: TransportOption[] = [];
  let bestOption: TransportOption | null = null;

  for (const v of VEHICLES) {
    // 대형차 제한
    if (input.noLargeTruck && (v.name === '24톤' || v.name === '11톤')) continue;

    // 필요 대수 산출 (중량 기준, 부피 기준 중 큰 값)
    const qtyByWeight = v.capacity > 0 ? Math.ceil(input.totalWeight / v.capacity) : 99;
    const qtyByVolume = v.volume > 0 ? Math.ceil(input.totalVolume / v.volume) : 99;
    let qty = Math.max(qtyByWeight, qtyByVolume);
    if (qty <= 0) qty = 1;

    const rate = getRate(input.warehouseKey, input.destKey, v.name, distKm, input.rateTable);
    if (rate <= 0) continue;

    const totalCost = qty * rate * trips;
    const option: TransportOption = {
      vehicleName: v.name,
      qty: qty * trips,
      rate,
      totalCost,
    };
    allOptions.push(option);

    if (!bestOption || totalCost < bestOption.totalCost) {
      bestOption = option;
    }
  }

  if (!bestOption) return null;

  return {
    vehicleName: bestOption.vehicleName,
    qty: bestOption.qty,
    unitRate: bestOption.rate,
    totalCost: bestOption.totalCost,
    distKm: Math.round(distKm * 10) / 10,
    trips,
    allOptions,
  };
}
