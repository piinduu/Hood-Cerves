import { getPointsMultiplier, POINTS_PER_LITER } from "./events";

/** El vino no cuenta como cerveza (no suma litros/ranking): solo da puntos, al doble. */
export const VINO_POINTS_MULTIPLIER = 2;

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
