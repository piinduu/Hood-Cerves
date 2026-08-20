import { madridWallClockToUtc } from "./madridTime";

export type WeeklyEvent = {
  id: string;
  label: string;
  multiplier: number;
  start: Date;
  end: Date;
};

/**
 * Eventos temáticos: ventanas de tiempo (hora de Madrid) en las que las
 * cervezas dan puntos extra en la pestaña "Puntos". Esto es una puntuación
 * aparte que arranca igualada a los litros de cerveza — NUNCA toca
 * totalLiters/monthLiters, que siguen siendo los litros reales.
 *
 * Para el evento de una semana nueva, añade (o sustituye) una entrada aquí
 * con el start/end en hora de Madrid y el multiplicador. Si quieres que
 * aplique varios días (p.ej. "entre semana x2"), añade una entrada por cada
 * día — pueden convivir varias a la vez.
 */
export const WEEKLY_EVENTS: WeeklyEvent[] = [
  {
    id: "2026-08-20-noche-doble",
    label: "Noche de doble puntuación",
    multiplier: 2,
    start: madridWallClockToUtc(2026, 8, 20, 20, 0, 0),
    end: madridWallClockToUtc(2026, 8, 21, 0, 0, 0),
  },
];

export function getPointsMultiplier(date: Date): number {
  const time = date.getTime();
  let multiplier = 1;
  for (const event of WEEKLY_EVENTS) {
    if (time >= event.start.getTime() && time < event.end.getTime()) {
      multiplier = Math.max(multiplier, event.multiplier);
    }
  }
  return multiplier;
}

export function getActiveEvent(now: Date): WeeklyEvent | null {
  const time = now.getTime();
  const active = WEEKLY_EVENTS.filter(
    (e) => time >= e.start.getTime() && time < e.end.getTime()
  );
  if (active.length === 0) return null;
  return active.reduce((best, e) => (e.multiplier > best.multiplier ? e : best));
}
