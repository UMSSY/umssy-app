import { describe, expect, it } from "vitest";
import { formatAnalysisTime } from "./format-analysis-time";

describe("formatAnalysisTime", () => {
  it.each([
    [0, "Análisis completado en 0.00 s"],
    [30, "Análisis completado en 0.03 s"],
    [1250, "Análisis completado en 1.25 s"],
    [2000, "Análisis completado en 2.00 s"],
  ])("convierte %i ms en %s", (elapsedMs, expected) => {
    expect(formatAnalysisTime(elapsedMs)).toBe(expected);
  });
});
