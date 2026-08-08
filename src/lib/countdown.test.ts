import { describe, expect, it } from "vitest";
import { weddingConfig } from "@/config/wedding";
import { formatCountdownNumber, getCountdownParts } from "@/lib/countdown";

describe("countdown", () => {
  it("stores the noon America/Toronto wedding target as the correct UTC instant", () => {
    expect(new Date(weddingConfig.date.iso).toISOString()).toBe("2027-07-17T16:00:00.000Z");
  });

  it("calculates remaining time before the wedding", () => {
    const parts = getCountdownParts(weddingConfig.date.iso, "2027-07-16T16:00:00.000Z");

    expect(parts).toMatchObject({
      isComplete: false,
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0
    });
  });

  it("returns the completed state once the target has passed", () => {
    const parts = getCountdownParts(weddingConfig.date.iso, "2027-07-18T16:00:00.000Z");

    expect(parts.isComplete).toBe(true);
    expect(parts.totalMilliseconds).toBe(0);
  });

  it("pads compact countdown units", () => {
    expect(formatCountdownNumber(7)).toBe("07");
    expect(formatCountdownNumber(12)).toBe("12");
  });
});
