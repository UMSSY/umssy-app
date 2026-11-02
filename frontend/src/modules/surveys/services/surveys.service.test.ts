import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { apiResponse, CAREERS, CREATED_SURVEY, SURVEY_SUMMARIES } from "../testing/survey-fixtures";
import type { CreateSurveyPayload } from "../types/survey.types";
import { surveysService } from "./surveys.service";
import { SURVEY_SAVE_TIMEOUT_MS } from "../constants/surveys-query-keys.constants";

describe("surveysService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("crea la encuesta con POST /surveys", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: apiResponse(CREATED_SURVEY, 201) });
    const payload: CreateSurveyPayload = { title: "Encuesta", status: "draft", questions: [] };

    await expect(surveysService.createSurvey(payload)).resolves.toEqual(apiResponse(CREATED_SURVEY, 201));
    expect(post).toHaveBeenCalledWith("/surveys", payload, { timeout: SURVEY_SAVE_TIMEOUT_MS });
  });

  it("inhabilita una encuesta publicada con PATCH /surveys/:id/unpublish", async () => {
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: undefined });

    await expect(surveysService.unpublishSurvey("survey-1")).resolves.toBeUndefined();
    expect(patch).toHaveBeenCalledWith("/surveys/survey-1/unpublish", undefined, { timeout: SURVEY_SAVE_TIMEOUT_MS });
  });

  it("lista encuestas y carreras con GET", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce({ data: apiResponse(SURVEY_SUMMARIES) })
      .mockResolvedValueOnce({ data: apiResponse(CAREERS) });

    await expect(surveysService.listSurveys()).resolves.toEqual(apiResponse(SURVEY_SUMMARIES));
    await expect(surveysService.listCareers()).resolves.toEqual(apiResponse(CAREERS));
    expect(get).toHaveBeenNthCalledWith(1, "/surveys");
    expect(get).toHaveBeenNthCalledWith(2, "/careers");
  });
});
