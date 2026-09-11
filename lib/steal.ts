/**
 * Resultado de un intento de robo: 50/50 entre éxito (robas los puntos)
 * y fallo (el plan te sale mal y pierdes tú esos puntos).
 */
export function rollStealSuccess(rng: () => number = Math.random): boolean {
  return rng() < 0.5;
}
