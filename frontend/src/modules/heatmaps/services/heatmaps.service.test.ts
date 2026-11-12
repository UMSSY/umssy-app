import { describe, expect, it } from "vitest";
import type { HeatmapType } from "../types/heatmap.types";
import { heatmapsService, toHeatmapQueryParams } from "./heatmaps.service";

describe("toHeatmapQueryParams", () => {
  it("envía los timestamps del rango y omite la gestión local cuando el rango está activo", () => {
    expect(
      toHeatmapQueryParams({ career: "systems", year: "2024", semesterRange: { startYear: 2023, startSemester: 1, endYear: 2024, endSemester: 2 } }),
    ).toEqual({ career: "systems", startTimestamp: "2023-01-01T00:00:00-04:00", endTimestamp: "2024-12-31T23:59:59-04:00" });
  });

  it("omite los filtros vacíos", () => {
    expect(toHeatmapQueryParams({ year: "2025" })).toEqual({ year: "2025" });
  });
});

describe("heatmapsService.getHeatmap", () => {
  it.each<HeatmapType>(["skills-by-career", "skills-by-salary", "employability", "skills-by-experience"])("devuelve datos procesados para %s", async (type) => {
    const response = await heatmapsService.getHeatmap(type, {});
    expect(response.ok).toBe(true);
    expect(response.data.heatmapType).toBe(type);
    expect(response.data.baseCount).toBeGreaterThan(0);
    expect(response.data.rows.length).toBeGreaterThan(0);
  });

  it("reduce la base al aplicar filtros", async () => {
    const all = await heatmapsService.getHeatmap("skills-by-career", {});
    const filtered = await heatmapsService.getHeatmap("skills-by-career", { year: "2024" });
    expect(filtered.data.baseCount).toBeLessThan(all.data.baseCount);
  });
});
