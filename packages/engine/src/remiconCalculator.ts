// ============================================================
// AXIS Platform - Remicon (Ready-Mixed Concrete) Calculator Engine
// ============================================================

/** Ground loss coefficients (K_ground) by soil type */
export const DB_GROUND_LOSS: Record<string, number> = {
  점성토: 1.75,
  사질토_표준: 2.10,
  사질토_불량: 2.43,
  자갈층: 2.78,
  연약지반: 3.20,
};

/** Pour loss rates by pouring method */
export const DB_POUR_LOSS: Record<string, number> = {
  직타_깔때기: 0.01,
  직타: 0.04,
  버킷_표준: 0.10,
  버킷_원거리: 0.15,
};

/** Default ground type */
const DEFAULT_GROUND_TYPE = '사질토_표준';
/** Default pour method */
const DEFAULT_POUR_METHOD = '버킷_표준';
/** Truck capacity in cubic meters */
const TRUCK_CAPACITY_M3 = 6;

export interface RemiconOrderResult {
  /** Theoretical volume per pile (m3) */
  vTheory: number;
  /** Total order volume (m3) */
  vOrder: number;
  /** Combined loss coefficient K_final */
  kFinal: number;
  /** Number of trucks needed (rounded up) */
  trucks: number;
  /** Volume per pile after losses */
  vPerPile: number;
  /** Total theoretical volume (m3) */
  vTheoryTotal: number;
}

/**
 * Calculate the remicon order for auger pile construction.
 *
 * @param augerMm - Auger diameter in millimeters
 * @param depthM - Pile depth in meters
 * @param pileCount - Number of piles
 * @param groundType - Soil type key from DB_GROUND_LOSS
 * @param pourMethod - Pour method key from DB_POUR_LOSS
 * @returns Order calculation result
 */
export function calculateRemiconOrder(
  augerMm: number,
  depthM: number,
  pileCount: number,
  groundType: string = DEFAULT_GROUND_TYPE,
  pourMethod: string = DEFAULT_POUR_METHOD,
): RemiconOrderResult {
  const radiusM = (augerMm / 1000) / 2;

  // Theoretical volume per pile: pi * r^2 * depth
  const vTheory = Math.PI * radiusM * radiusM * depthM;

  // Lookup coefficients (fall back to defaults if unknown key)
  const kGround = DB_GROUND_LOSS[groundType] ?? DB_GROUND_LOSS[DEFAULT_GROUND_TYPE];
  const pourLoss = DB_POUR_LOSS[pourMethod] ?? DB_POUR_LOSS[DEFAULT_POUR_METHOD];

  // Combined coefficient: K_final = K_ground * (1 + pour_loss)
  const kFinal = parseFloat((kGround * (1 + pourLoss)).toFixed(4));

  // Volume per pile including losses
  const vPerPile = vTheory * kFinal;

  // Total theoretical volume
  const vTheoryTotal = vTheory * pileCount;

  // Total order volume
  const vOrder = vPerPile * pileCount;

  // Trucks needed (rounded up)
  const trucks = Math.ceil(vOrder / TRUCK_CAPACITY_M3);

  return {
    vTheory: parseFloat(vTheory.toFixed(4)),
    vOrder: parseFloat(vOrder.toFixed(4)),
    kFinal,
    trucks,
    vPerPile: parseFloat(vPerPile.toFixed(4)),
    vTheoryTotal: parseFloat(vTheoryTotal.toFixed(4)),
  };
}

/**
 * Judge chloride content level.
 * KS F 2515 standard: max 0.30 kg/m3 for reinforced concrete.
 *
 * @param kgm3 - Chloride content in kg/m3
 * @returns GREEN (<=0.25), YELLOW (0.26~0.30), RED (>0.30)
 */
export function judgeChloride(kgm3: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (kgm3 <= 0.25) return 'GREEN';
  if (kgm3 <= 0.30) return 'YELLOW';
  return 'RED';
}

/**
 * Judge transport time compliance.
 * Ready-mixed concrete must arrive within 60 minutes.
 *
 * @param minutes - Transport time in minutes
 * @returns '적합' if within limit, 'FLAG' if exceeded
 */
export function judgeTransport(minutes: number): '적합' | 'FLAG' {
  return minutes > 60 ? 'FLAG' : '적합';
}

/**
 * Determine curing mode based on ambient temperature.
 *
 * @param tempC - Temperature in Celsius
 * @returns Curing mode: 여름 (>=15), 간절기 (4~15 exclusive), 한중 (<=4)
 */
export function getCuringMode(tempC: number): '여름' | '간절기' | '한중' {
  if (tempC >= 15) return '여름';
  if (tempC > 4) return '간절기';
  return '한중';
}
