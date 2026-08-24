import { describe, expect, it } from "vitest";
import { crossedMilestone, pickMilestoneMessage } from "./milestones";

describe("crossedMilestone", () => {
  it("returns null when no whole step is crossed", () => {
    expect(crossedMilestone(0.2, 0.7, 1)).toBeNull();
  });

  it("returns the step value when crossing exactly one tier", () => {
    expect(crossedMilestone(0.7, 1.1, 1)).toBe(1);
  });

  it("returns the highest tier reached when jumping over more than one", () => {
    expect(crossedMilestone(0.5, 2.5, 1)).toBe(2);
  });

  it("works with non-integer steps like 1.5L cubatas", () => {
    expect(crossedMilestone(1.4, 1.6, 1.5)).toBe(1.5);
    expect(crossedMilestone(1.6, 2.9, 1.5)).toBeNull();
    expect(crossedMilestone(1.6, 3.1, 1.5)).toBe(3);
  });

  it("returns null at zero/no progress", () => {
    expect(crossedMilestone(0, 0, 1)).toBeNull();
  });

  it("is not fooled by floating point drift", () => {
    const before = 0.1 + 0.2 + 0.6; // 0.8999999999999999 in raw float
    expect(crossedMilestone(before, 1.0, 1)).toBe(1);
  });
});

describe("pickMilestoneMessage", () => {
  it("includes the liters amount for beer and cubata messages", () => {
    expect(pickMilestoneMessage("beer", 2)).toContain("2");
    expect(pickMilestoneMessage("cubata", 1.5)).toContain("1.5");
  });
});
