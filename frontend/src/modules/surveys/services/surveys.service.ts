import type { ApiResponse, PaginatedData } from "@/shared/types/api-response.types";
import { mockApiError, mockResponse, simulateLatency } from "../mocks/mock-api.mock";
import { MOCK_CURRENT_ADMIN } from "../mocks/survey-seed.mock";
import { readSurveyTables, writeSurveyTables } from "../mocks/survey-store.mock";
import type { SurveyTables } from "../types/survey-records.types";
import type {
  SurveyDetail,
  SurveyInput,
  SurveyListItem,
  SurveyMetrics,
  SurveysParams,
  SurveyStatistics,
  SurveyStatus,
} from "../types/survey.types";
import { calculateSurveyMetrics, calculateSurveyStatistics } from "../utils/calculate-survey-results";
import { canChangeSurveyStatus, canEditSurvey, hasSurveyStatistics } from "../utils/survey-status";
import { replaceSurveyQuestions, toSurveyDetail, toSurveyListItem } from "../utils/survey-records.mapper";
import { validateSurveyInput } from "../utils/validate-survey-input";

const NOT_FOUND_DETAIL = "La encuesta no existe";

function findSurvey(tables: SurveyTables, id: string) {
  const survey = tables.surveys.find((record) => record.id === id);
  if (!survey) throw mockApiError(404, NOT_FOUND_DETAIL);
  return survey;
}

// TODO: cada método se reemplaza por su llamada a apiClient cuando existan las tablas de encuestas
// (el endpoint está indicado encima de cada uno). Los tipos de entrada y salida no cambian.
export const surveysService = {
  // GET /surveys?page=&limit=&period=&search=
  getSurveys: async ({ page, limit, period, search }: SurveysParams): Promise<ApiResponse<PaginatedData<SurveyListItem>>> => {
    await simulateLatency();
    const tables = readSurveyTables();
    const normalizedSearch = (search ?? "").trim().toLowerCase();
    const filtered = tables.surveys
      .map((survey) => toSurveyListItem(tables, survey))
      .filter(
        (survey) =>
          (period === undefined || survey.period === period) &&
          (!normalizedSearch || survey.creator.email.toLowerCase().includes(normalizedSearch)),
      )
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    const offset = (page - 1) * limit;

    return mockResponse(
      { items: filtered.slice(offset, offset + limit), totalItems: filtered.length },
      "Encuestas obtenidas correctamente",
      200,
      page,
    );
  },

  // GET /surveys/:id
  getSurvey: async (id: string): Promise<ApiResponse<SurveyDetail>> => {
    await simulateLatency();
    const tables = readSurveyTables();
    return mockResponse(toSurveyDetail(tables, findSurvey(tables, id)), "Encuesta obtenida correctamente");
  },

  // POST /surveys (se crea como borrador)
  createSurvey: async (input: SurveyInput): Promise<ApiResponse<SurveyDetail>> => {
    await simulateLatency();
    const errors = validateSurveyInput(input, "draft");
    if (errors.length > 0) throw mockApiError(400, errors[0].message);

    const tables = readSurveyTables();
    const survey = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description.trim(),
      status: "DRAFT" as const,
      period: input.period,
      targetCareer: input.targetCareer,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      createdById: MOCK_CURRENT_ADMIN.id,
      createdAt: new Date().toISOString(),
    };
    const nextTables = replaceSurveyQuestions({ ...tables, surveys: [...tables.surveys, survey] }, survey.id, input.questions);
    writeSurveyTables(nextTables);

    return mockResponse(toSurveyDetail(nextTables, survey), "Encuesta guardada como borrador", 201);
  },

  // PUT /surveys/:id (solo borradores)
  updateSurvey: async (id: string, input: SurveyInput): Promise<ApiResponse<SurveyDetail>> => {
    await simulateLatency();
    const tables = readSurveyTables();
    const current = findSurvey(tables, id);
    if (!canEditSurvey(current.status)) throw mockApiError(409, "Una encuesta publicada ya no se puede editar");
    const errors = validateSurveyInput(input, "draft");
    if (errors.length > 0) throw mockApiError(400, errors[0].message);

    const survey = {
      ...current,
      title: input.title.trim(),
      description: input.description.trim(),
      period: input.period,
      targetCareer: input.targetCareer,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
    };
    const surveys = tables.surveys.map((record) => (record.id === id ? survey : record));
    const nextTables = replaceSurveyQuestions({ ...tables, surveys }, id, input.questions);
    writeSurveyTables(nextTables);

    return mockResponse(toSurveyDetail(nextTables, survey), "Borrador actualizado correctamente");
  },

  // PATCH /surveys/:id/status
  changeSurveyStatus: async (id: string, status: SurveyStatus): Promise<ApiResponse<SurveyListItem>> => {
    await simulateLatency();
    const tables = readSurveyTables();
    const current = findSurvey(tables, id);
    if (!canChangeSurveyStatus(current.status, status)) {
      throw mockApiError(409, "La encuesta no puede cambiar a ese estado");
    }
    if (current.status === "DRAFT") {
      const errors = validateSurveyInput(toSurveyDetail(tables, current), "publish");
      if (errors.length > 0) throw mockApiError(400, errors[0].summary);
    }

    const survey = { ...current, status };
    const nextTables = { ...tables, surveys: tables.surveys.map((record) => (record.id === id ? survey : record)) };
    writeSurveyTables(nextTables);

    return mockResponse(toSurveyListItem(nextTables, survey), "Estado de la encuesta actualizado");
  },

  // GET /surveys/:id/metrics (HU3)
  getSurveyMetrics: async (id: string): Promise<ApiResponse<SurveyMetrics>> => {
    await simulateLatency();
    const tables = readSurveyTables();
    findSurvey(tables, id);
    return mockResponse(calculateSurveyMetrics(tables, id), "Métricas obtenidas correctamente");
  },

  // GET /surveys/:id/statistics (HU4)
  getSurveyStatistics: async (id: string): Promise<ApiResponse<SurveyStatistics>> => {
    await simulateLatency();
    const tables = readSurveyTables();
    const survey = findSurvey(tables, id);
    const statistics = calculateSurveyStatistics(tables, id);
    if (!hasSurveyStatistics(survey.status) || !statistics) {
      throw mockApiError(409, "La encuesta todavía no tiene estadísticas");
    }
    return mockResponse(statistics, "Estadísticas obtenidas correctamente");
  },
};
