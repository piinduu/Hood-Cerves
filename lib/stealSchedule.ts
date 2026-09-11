/**
 * Franja horaria (hora de Madrid) donde es más probable que caiga la "hora
 * de robos": de 17:00 (la tarde) a 02:00 (la madrugada). Las horas 0 y 1
 * pertenecen a la madrugada del día siguiente al que se programa el evento.
 */
export const STEAL_PEAK_HOURS = [17, 18, 19, 20, 21, 22, 23, 0, 1];

/**
 * Cuántas veces más probable es que la hora de robos caiga en una hora
 * "pico" frente a cualquier otra hora del día (p.ej. el vermú de mediodía
 * sigue pudiendo tocar, solo que con menos frecuencia).
 */
export const STEAL_PEAK_WEIGHT = 4;
const STEAL_OFFPEAK_WEIGHT = 1;

function isPeakHour(hour: number): boolean {
  return STEAL_PEAK_HOURS.includes(hour);
}

function hourWeights(): { hour: number; weight: number }[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    weight: isPeakHour(hour) ? STEAL_PEAK_WEIGHT : STEAL_OFFPEAK_WEIGHT,
  }));
}

/** Elige una hora (0-23) al azar, con sesgo hacia STEAL_PEAK_HOURS. */
export function pickWeightedStealHour(rng: () => number = Math.random): number {
  const weights = hourWeights();
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = rng() * total;
  for (const w of weights) {
    if (r < w.weight) return w.hour;
    r -= w.weight;
  }
  return weights[weights.length - 1].hour;
}

/**
 * Las horas de madrugada (0-3) que salgan sorteadas pertenecen a la noche
 * que empieza HOY, así que el evento debe programarse para el día siguiente
 * en el calendario (ej. si hoy es día 10, "la 1 de la madrugada" es el
 * día 11). El resto de horas se programan el mismo día.
 */
export function stealEventDayOffset(hour: number): 0 | 1 {
  return hour < 4 ? 1 : 0;
}
