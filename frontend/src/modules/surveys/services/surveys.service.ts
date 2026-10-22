import type { ApiResponse, PaginatedData } from "@/shared/types/api-response.types";
import { SURVEYS_MOCK } from "../mocks/surveys.mock";
import type { SurveyListItem, SurveysParams } from "../types/survey.types";

function sortByNewest(surveys: SurveyListItem[]): SurveyListItem[] {
  return [...surveys].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

// TODO: reemplazar los datos de ejemplo por apiClient.get("/surveys") cuando exista el endpoint del backend.
export const surveysService = {
  getSurveys: async ({ page, limit, period, search }: SurveysParams): Promise<ApiResponse<PaginatedData<SurveyListItem>>> => {
    const normalizedSearch = (search ?? "").trim().toLowerCase();
    const filtered = sortByNewest(SURVEYS_MOCK).filter(
      (survey) =>
        (period === undefined || survey.period === period) &&
        (!normalizedSearch || survey.creator.email.toLowerCase().includes(normalizedSearch)),
    );
    const offset = (page - 1) * limit;

    return {
      statusCode: 200,
      ok: true,
      detail: "Encuestas obtenidas correctamente",
      page,
      data: { items: filtered.slice(offset, offset + limit), totalItems: filtered.length },
    };
  },
};
