import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { surveysService } from "../services/surveys.service";
import { apiResponse, SURVEY_SUMMARIES } from "../testing/survey-fixtures";
import { useSurveys } from "./use-surveys";

describe("useSurveys", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve el listado de encuestas", async () => {
    vi.spyOn(surveysService, "listSurveys").mockResolvedValue(apiResponse(SURVEY_SUMMARIES));
    const { result } = renderHook(() => useSurveys(), createQueryWrapper());

    await waitFor(() => expect(result.current.surveys).toEqual(SURVEY_SUMMARIES));
  });

  it("informa errores de carga", async () => {
    vi.spyOn(surveysService, "listSurveys").mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useSurveys(), createQueryWrapper());

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.surveys).toEqual([]);
  });
});
