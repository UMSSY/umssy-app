import { describe, expect, it } from "vitest";
import { HEATMAP_EMPTY_TONE } from "../constants/heatmap-text.constants";
import { getHeatmapTone } from "./get-heatmap-tone";

describe("getHeatmapTone", () => {
  it("usa fondo claro y texto oscuro hasta 45%", () => {
    expect(getHeatmapTone({ columnId: "a", percentage: 45 })).toContain("text-ink");
  });

  it("usa fondo oscuro y texto blanco desde 46%", () => {
    expect(getHeatmapTone({ columnId: "a", percentage: 46 })).toContain("text-primary-foreground");
    expect(getHeatmapTone({ columnId: "a", percentage: 100 })).toContain("text-primary-foreground");
  });

  it("usa el tono gris para celdas sin datos", () => {
    expect(getHeatmapTone({ columnId: "a", isEmpty: true })).toBe(HEATMAP_EMPTY_TONE);
    expect(getHeatmapTone(undefined)).toBe(HEATMAP_EMPTY_TONE);
  });
});
