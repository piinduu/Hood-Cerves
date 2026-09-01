import { describe, expect, it } from "vitest";
import { rollStealSuccess } from "./steal";

describe("rollStealSuccess", () => {
  it("es éxito cuando el rng cae por debajo de 0.5", () => {
    expect(rollStealSuccess(() => 0)).toBe(true);
    expect(rollStealSuccess(() => 0.4999)).toBe(true);
  });

  it("es fallo cuando el rng cae en 0.5 o por encima", () => {
    expect(rollStealSuccess(() => 0.5)).toBe(false);
    expect(rollStealSuccess(() => 0.9999)).toBe(false);
  });

  it("con Math.random por defecto, la tasa de éxito ronda el 50%", () => {
    const trials = 20000;
    let successes = 0;
    for (let i = 0; i < trials; i++) {
      if (rollStealSuccess()) successes++;
    }
    const rate = successes / trials;
    expect(rate).toBeGreaterThan(0.4);
    expect(rate).toBeLessThan(0.6);
  });
});
