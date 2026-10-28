import { describe, expect, it } from "vitest";
import { formatMatchScore, normalizeMatchScore } from "./normalize-match-score";
 
describe("normalizeMatchScore", () => {
  it.each([
    [0, 0],
    [49.4, 49],
    [49.5, 50],
    [49.8, 50],
    [100, 100],
    [125, 100],
    [-10, 0],
    [NaN, 0],
    [Infinity, 0],
    [-Infinity, 0],
  ])("normalizes %s to %s", (score, expected) => {
    expect(normalizeMatchScore(score)).toBe(expected);
  });
 
  it("always returns an integer between 0 and 100", () => {
    for (let score = -20; score <= 120; score += 0.37) {
      const result = normalizeMatchScore(score);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    }
  });
});
 
describe("formatMatchScore", () => {
  it.each([
    [92, "92%"],
    [91.6, "92%"],
    [0, "0%"],
    [150, "100%"],
    [NaN, "0%"],
  ])("formats %s as %s", (score, expected) => {
    expect(formatMatchScore(score)).toBe(expected);
  });
});
