export type MilestoneDrink = "beer" | "cubata";

/**
 * Redondea a 2 decimales antes de comparar para evitar que el arrastre de
 * coma flotante (sumar 0.33 muchas veces, etc.) dispare o se salte un hito.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Si al pasar de `before` a `after` litros se cruza un múltiplo de `step`,
 * devuelve ese múltiplo (el más alto alcanzado). Si no se cruza ninguno
 * (o el total sigue en 0), devuelve null.
 */
export function crossedMilestone(
  before: number,
  after: number,
  step: number
): number | null {
  const beforeTier = Math.floor(round2(before) / step);
  const afterTier = Math.floor(round2(after) / step);
  if (afterTier <= beforeTier || afterTier <= 0) return null;
  return round2(afterTier * step);
}

const BEER_MESSAGES: ((liters: number) => string)[] = [
  (l) => `¡${l}L de cerveza! La que te estás dando 🍺`,
  (l) => `${l} litros en el cuerpo. Vaya nivel llevas hoy 🔥`,
  (l) => `¡${l}L! Como sigas así vas a necesitar que te lleven a casa 🍻`,
  (l) => `${l} litros de cerveza y sigues venga a darle. Imparable 💪`,
  (l) => `¡${l}L! Menuda máquina de birras que estás hecho 🐐`,
  (l) => `${l} litros ya. Que alguien te vaya vigilando 👀🍺`,
];

const CUBATA_MESSAGES: ((liters: number) => string)[] = [
  (l) => `¡${l}L de cubatas! La que te estás dando 🍹`,
  (l) => `${l} litros de cubata en el cuerpo. Menudo nivel 🔥`,
  (l) => `¡${l}L! Como sigas así el barman ya te conoce por el nombre 🍸`,
  (l) => `${l} litros de cubata y sigues en pie. Respeto 💪`,
  (l) => `¡${l}L! Vaya puntazo llevas encima 🎉`,
];

export function pickMilestoneMessage(type: MilestoneDrink, liters: number): string {
  const pool = type === "beer" ? BEER_MESSAGES : CUBATA_MESSAGES;
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(liters);
}
