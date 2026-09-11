import { describe, expect, it } from "vitest";
import {
  STEAL_PEAK_HOURS,
  pickWeightedStealHour,
  stealEventDayOffset,
} from "./stealSchedule";

describe("pickWeightedStealHour", () => {
  it("es determinista dado un rng inyectado", () => {
    // Peso total = 9 horas pico * 4 + 15 horas normales * 1 = 51.
    expect(pickWeightedStealHour(() => 0)).toBe(0); // primera hora pico (0h)
    expect(pickWeightedStealHour(() => 3.99 / 51)).toBe(0);
    expect(pickWeightedStealHour(() => 4 / 51)).toBe(1); // segunda hora pico (1h)
    expect(pickWeightedStealHour(() => 8 / 51)).toBe(2); // primera hora normal (2h)
    expect(pickWeightedStealHour(() => 0.9999)).toBe(23); // última hora pico
  });

  it("nunca devuelve una hora fuera de 0-23", () => {
    for (let i = 0; i < 1000; i++) {
      const hour = pickWeightedStealHour(() => i / 1000);
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
    }
  });

  it("con Math.random por defecto, las horas pico salen claramente más que las demás", () => {
    const trials = 20000;
    let peakHits = 0;
    for (let i = 0; i < trials; i++) {
      if (STEAL_PEAK_HOURS.includes(pickWeightedStealHour())) peakHits++;
    }
    const rate = peakHits / trials;
    // Proporción teórica: 36/51 ≈ 0.706. Margen amplio para evitar flakiness.
    expect(rate).toBeGreaterThan(0.6);
    expect(rate).toBeLessThan(0.8);
  });
});

describe("stealEventDayOffset", () => {
  it("las horas de madrugada (0-3) se programan para el día siguiente", () => {
    expect(stealEventDayOffset(0)).toBe(1);
    expect(stealEventDayOffset(1)).toBe(1);
    expect(stealEventDayOffset(2)).toBe(1);
    expect(stealEventDayOffset(3)).toBe(1);
  });

  it("el resto de horas se programan el mismo día", () => {
    expect(stealEventDayOffset(4)).toBe(0);
    expect(stealEventDayOffset(12)).toBe(0);
    expect(stealEventDayOffset(17)).toBe(0);
    expect(stealEventDayOffset(23)).toBe(0);
  });
});
