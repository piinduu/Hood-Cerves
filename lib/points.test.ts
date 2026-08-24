import { describe, expect, it } from "vitest";
import {
  computeRawPoints,
  litersToPoints,
  netStolenPoints,
  pointsForSingleEntry,
  type PointStealEntry,
} from "./points";

// Fecha fuera de cualquier WEEKLY_EVENTS conocido -> multiplicador x1.
const NEUTRAL_DATE = new Date("2026-01-15T12:00:00Z");

describe("computeRawPoints / litersToPoints / pointsForSingleEntry", () => {
  it("suma litros sin multiplicador en una fecha neutra", () => {
    const raw = computeRawPoints([
      { liters: 0.33, createdAt: NEUTRAL_DATE },
      { liters: 1, createdAt: NEUTRAL_DATE },
    ]);
    expect(raw).toBeCloseTo(1.33, 5);
  });

  it("convierte litros brutos a puntos redondeando hacia abajo", () => {
    // 1.33 L * 10 pts/L = 13.3 -> floor -> 13
    expect(litersToPoints(1.33)).toBe(13);
  });

  it("pointsForSingleEntry coincide con litersToPoints(liters * multiplicador)", () => {
    expect(pointsForSingleEntry(1, NEUTRAL_DATE)).toBe(10);
    expect(pointsForSingleEntry(0.33, NEUTRAL_DATE)).toBe(3);
  });
});

describe("netStolenPoints", () => {
  function steal(
    fromPersonId: string,
    toPersonId: string,
    points: number,
    success: boolean
  ): PointStealEntry {
    return { fromPersonId, toPersonId, points, success };
  }

  it("un robo con éxito: quien roba gana, la víctima pierde", () => {
    const steals = [steal("thief", "victim", 10, true)];
    expect(netStolenPoints(steals, "thief")).toBe(10);
    expect(netStolenPoints(steals, "victim")).toBe(-10);
  });

  it("un robo fallido: quien roba pierde, la víctima no se ve afectada", () => {
    const steals = [steal("thief", "victim", 10, false)];
    expect(netStolenPoints(steals, "thief")).toBe(-10);
    expect(netStolenPoints(steals, "victim")).toBe(0);
  });

  it("una persona ajena al robo no se ve afectada", () => {
    const steals = [steal("thief", "victim", 10, true)];
    expect(netStolenPoints(steals, "bystander")).toBe(0);
  });

  it("acumula varios robos con éxitos y fallos mezclados", () => {
    const steals = [
      steal("a", "b", 10, true), // a +10, b -10
      steal("a", "c", 5, false), // a -5
      steal("b", "a", 4, true), // b +4, a -4
    ];
    // a: +10 (roba a b) -5 (falla contra c) -4 (b le roba con éxito) = 1
    expect(netStolenPoints(steals, "a")).toBe(1);
    // b: -10 (a le roba) +4 (roba a a con éxito) = -6
    expect(netStolenPoints(steals, "b")).toBe(-6);
    // c: 0 (el robo de a contra c falló, no le afecta)
    expect(netStolenPoints(steals, "c")).toBe(0);
  });

  it("regresión: un robo con éxito ya NO resta a quien roba (bug original)", () => {
    // Antes del fix, quien figuraba como "from" perdía puntos y "to" los
    // ganaba, justo al revés de lo que decía la notificación push.
    const steals = [steal("thief", "victim", 20, true)];
    const thiefNet = netStolenPoints(steals, "thief");
    const victimNet = netStolenPoints(steals, "victim");

    expect(thiefNet).toBeGreaterThan(0);
    expect(victimNet).toBeLessThan(0);
    expect(thiefNet + victimNet).toBe(0);
  });
});
