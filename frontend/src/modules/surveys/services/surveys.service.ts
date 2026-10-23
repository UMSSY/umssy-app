import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { Career, CreateSurveyPayload, CreatedSurvey, SurveySummary } from "../types/survey.types";

export const surveysService = {
  createSurvey: async (payload: CreateSurveyPayload): Promise<ApiResponse<CreatedSurvey>> => {
    const { data } = await apiClient.post<ApiResponse<CreatedSurvey>>("/surveys", payload);
    return data;
  },

  listSurveys: async (): Promise<ApiResponse<SurveySummary[]>> => {
    const { data } = await apiClient.get<ApiResponse<SurveySummary[]>>("/surveys");
    return data;
  },

  listCareers: async (): Promise<ApiResponse<Career[]>> => {
    const { data } = await apiClient.get<ApiResponse<Career[]>>("/careers");
    return data;
  },
};
