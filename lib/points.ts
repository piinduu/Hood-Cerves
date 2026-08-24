import { getPointsMultiplier, POINTS_PER_LITER } from "./events";

type LiquidEntry = { liters: number; createdAt: Date };

export function computeRawPoints(entries: LiquidEntry[]): number {
  return entries.reduce(
    (sum, e) => sum + e.liters * getPointsMultiplier(e.createdAt),
    0
  );
}

export function litersToPoints(rawPoints: number): number {
  return Math.floor(rawPoints * POINTS_PER_LITER);
}

/** Puntos de un único trago concreto (para saber cuánto se puede robar). */
export function pointsForSingleEntry(liters: number, createdAt: Date): number {
  return litersToPoints(liters * getPointsMultiplier(createdAt));
}

export type PointStealEntry = {
  fromPersonId: string;
  toPersonId: string;
  points: number;
  success: boolean;
};

/**
 * Efecto neto de los intentos de robo sobre los puntos de una persona.
 *
 * fromPersonId es quien intenta robar, toPersonId es la víctima elegida.
 * - Robo con éxito: quien roba (from) gana los puntos, la víctima (to) los pierde.
 * - Robo fallido: el plan le sale mal a quien roba (from), que pierde esos
 *   puntos; la víctima (to) no se ve afectada.
 */
export function netStolenPoints(
  steals: PointStealEntry[],
  personId: string
): number {
  let net = 0;
  for (const s of steals) {
    if (s.fromPersonId === personId) {
      net += s.success ? s.points : -s.points;
    }
    if (s.toPersonId === personId && s.success) {
      net -= s.points;
    }
  }
  return net;
}
