import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { heatmapsService, toHeatmapQueryParams } from "./heatmaps.service";

describe("toHeatmapQueryParams", () => {
  it("envía los timestamps del rango y omite la gestión local cuando el rango está activo", () => {
    expect(
      toHeatmapQueryParams({ careerId: "career-1", year: "2024", semesterRange: { startYear: 2023, startSemester: 1, endYear: 2024, endSemester: 2 } }),
    ).toEqual({ careerId: "career-1", startTimestamp: "2023-01-01T00:00:00-04:00", endTimestamp: "2024-12-31T23:59:59-04:00" });
  });

  it("omite los filtros vacíos", () => {
    expect(toHeatmapQueryParams({ year: "2025", month: "3" })).toEqual({ year: "2025", month: "3" });
  });
});

describe("heatmapsService.getHeatmap", () => {
  afterEach(() => vi.restoreAllMocks());

  it("consulta el endpoint de analíticas con los filtros como parámetros", async () => {
    const response = { statusCode: 200, ok: true, detail: "ok", data: { heatmapType: "employability" } };
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: response });

    await expect(heatmapsService.getHeatmap("employability", { careerId: "career-1" })).resolves.toEqual(response);
    expect(get).toHaveBeenCalledWith("/analytics/heatmap/employability", { params: { careerId: "career-1" } });
  });
});
