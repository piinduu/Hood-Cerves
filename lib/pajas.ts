import { madridWallClockToUtc } from "./madridTime";

export const PAJA_POINTS = 5;

export const PAJA_WEEK_START = madridWallClockToUtc(2026, 9, 14, 0, 0, 0);
export const PAJA_WEEK_END = madridWallClockToUtc(2026, 9, 21, 0, 0, 0);

export function isPajaWeekOpen(date: Date): boolean {
  const time = date.getTime();
  return time >= PAJA_WEEK_START.getTime() && time < PAJA_WEEK_END.getTime();
}

export function pajaPoints(count: number): number {
  return count * PAJA_POINTS;
}
