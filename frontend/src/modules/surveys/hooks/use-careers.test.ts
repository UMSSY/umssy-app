import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { surveysService } from "../services/surveys.service";
import { apiResponse, CAREERS } from "../testing/survey-fixtures";
import { useCareers } from "./use-careers";

describe("useCareers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve las carreras", async () => {
    vi.spyOn(surveysService, "listCareers").mockResolvedValue(apiResponse(CAREERS));
    const { result } = renderHook(() => useCareers(), createQueryWrapper());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.careers).toEqual(CAREERS));
    expect(result.current.hasError).toBe(false);
  });

  it("informa el error de carga", async () => {
    vi.spyOn(surveysService, "listCareers").mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useCareers(), createQueryWrapper());

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.careers).toEqual([]);
  });
});
