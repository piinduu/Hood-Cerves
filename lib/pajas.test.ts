import { describe, expect, it } from "vitest";
import { madridWallClockToUtc } from "./madridTime";
import { PAJA_POINTS, isPajaWeekOpen, pajaPoints } from "./pajas";

describe("isPajaWeekOpen", () => {
  it("está abierta desde el lunes 14 a las 00:00 (hora de Madrid)", () => {
    expect(isPajaWeekOpen(madridWallClockToUtc(2026, 9, 14, 0, 0, 0))).toBe(true);
  });

  it("sigue abierta el domingo 20 a última hora", () => {
    expect(isPajaWeekOpen(madridWallClockToUtc(2026, 9, 20, 23, 59, 59))).toBe(true);
  });

  it("está cerrada justo antes de empezar", () => {
    expect(isPajaWeekOpen(madridWallClockToUtc(2026, 9, 13, 23, 59, 59))).toBe(false);
  });

  it("se cierra el lunes 21 a las 00:00", () => {
    expect(isPajaWeekOpen(madridWallClockToUtc(2026, 9, 21, 0, 0, 0))).toBe(false);
  });
});

describe("pajaPoints", () => {
  it("cada paja vale 5 puntos", () => {
    expect(PAJA_POINTS).toBe(5);
    expect(pajaPoints(1)).toBe(5);
    expect(pajaPoints(7)).toBe(35);
  });

  it("sin pajas no hay puntos", () => {
    expect(pajaPoints(0)).toBe(0);
  });
});
