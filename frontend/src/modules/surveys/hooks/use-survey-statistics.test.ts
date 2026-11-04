import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { surveysService } from "../services/surveys.service";
import { apiResponse } from "../testing/survey-fixtures";
import { buildEmptyStatistics, buildStatistics } from "../testing/survey-statistics-fixtures";
import { useSurveyStatistics } from "./use-survey-statistics";

describe("useSurveyStatistics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sin semestre pide todas las respuestas y expone los semestres disponibles", async () => {
    const spy = vi.spyOn(surveysService, "getSurveyStatistics").mockResolvedValue(apiResponse(buildStatistics()));
    const { wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useSurveyStatistics("survey-1"), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("survey-1");
    expect(result.current.statistics?.totalResponses).toBe(5);
    expect(result.current.availablePeriods).toEqual(["II-2026", "I-2026"]);
  });

  it("con un semestre pide ese semestre y conserva los semestres disponibles", async () => {
    const spy = vi.spyOn(surveysService, "getSurveyStatistics").mockImplementation(async (_id, period) =>
      apiResponse(period ? buildEmptyStatistics(period) : buildStatistics()),
    );
    const { wrapper } = createQueryWrapper();

    const { result, rerender } = renderHook(({ period }) => useSurveyStatistics("survey-1", period), {
      wrapper,
      initialProps: { period: undefined as string | undefined },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ period: "I-2026" });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.statistics).toBeUndefined();
    expect(result.current.availablePeriods).toEqual(["II-2026", "I-2026"]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(spy).toHaveBeenCalledWith("survey-1", "I-2026");
    expect(result.current.statistics).toMatchObject({ period: "I-2026", hasData: false });
  });

  it("no consulta nada si no hay id", () => {
    const spy = vi.spyOn(surveysService, "getSurveyStatistics");
    const { wrapper } = createQueryWrapper();

    renderHook(() => useSurveyStatistics("", "I-2026"), { wrapper });

    expect(spy).not.toHaveBeenCalled();
  });

  it("expone el error cuando la consulta falla", async () => {
    vi.spyOn(surveysService, "getSurveyStatistics").mockRejectedValue(new Error("falló"));
    const { wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useSurveyStatistics("survey-1"), { wrapper });

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.statistics).toBeUndefined();
    expect(result.current.availablePeriods).toEqual([]);
  });
});
