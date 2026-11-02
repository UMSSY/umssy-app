import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { surveysService } from "../services/surveys.service";
import { apiResponse, CREATED_SURVEY } from "../testing/survey-fixtures";
import { useCreateSurvey } from "./use-create-survey";

describe("useCreateSurvey", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("expone el estado del envío e invalida el listado al terminar", async () => {
    let resolve: (value: Awaited<ReturnType<typeof surveysService.createSurvey>>) => void = () => undefined;
    vi.spyOn(surveysService, "createSurvey").mockReturnValue(new Promise((done) => (resolve = done)));
    const { wrapper, client } = createQueryWrapper();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateSurvey(), { wrapper });

    let request: Promise<unknown> = Promise.resolve();
    act(() => {
      request = result.current.createSurvey({ title: "Encuesta", status: "published", questions: [] });
    });

    await waitFor(() => expect(result.current.pendingStatus).toBe("published"));
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      resolve(apiResponse(CREATED_SURVEY, 201));
      await request;
    });

    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.pendingStatus).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["surveys"] });
  });
});
