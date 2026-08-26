import { madridWallClockToUtc } from "./madridTime";

export const SIDRA_WEEKEND_START = madridWallClockToUtc(2026, 8, 28, 0, 0, 0);
export const SIDRA_WEEKEND_END = madridWallClockToUtc(2026, 8, 30, 23, 59, 59);
