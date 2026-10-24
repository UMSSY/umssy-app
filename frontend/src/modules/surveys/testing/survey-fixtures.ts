import type { ApiResponse } from "@/shared/types/api-response.types";
import type { SurveyBuilderState } from "../types/survey-builder.types";
import type { Career, CreatedSurvey, SurveySummary } from "../types/survey.types";

export const FIXED_NOW = new Date("2026-10-22T15:00:00.000Z");
export const TODAY_VALUE = "2026-10-22";

export const CAREERS: Career[] = [
  { id: "career-systems", title: "Ingeniería de Sistemas" },
  { id: "career-informatics", title: "Ingeniería en Informática" },
];

export function apiResponse<T>(data: T, statusCode = 200): ApiResponse<T> {
  return { statusCode, ok: true, detail: "Operación exitosa", data };
}

export const CREATED_SURVEY: CreatedSurvey = {
  id: "survey-1",
  title: "Encuesta de Empleabilidad",
  status: "published",
  createdAt: FIXED_NOW.toISOString(),
};

export const SURVEY_SUMMARIES: SurveySummary[] = [
  {
    id: "survey-1",
    title: "Encuesta de Empleabilidad",
    status: "published",
    career: CAREERS[0],
    createdBy: { fullName: "Admin Uno", email: "admin.1@umssy.test" },
    academicPeriod: "II-2026",
    opensAt: "2026-11-03T04:00:00.000Z",
    closesAt: "2026-12-16T03:59:59.999Z",
    questionCount: 4,
    createdAt: FIXED_NOW.toISOString(),
  },
  {
    id: "survey-2",
    title: "Borrador sin carrera",
    status: "draft",
    career: null,
    createdBy: { fullName: "Carla Arce", email: "carla.arce@umssy.edu" },
    academicPeriod: null,
    opensAt: null,
    closesAt: null,
    questionCount: 0,
    createdAt: FIXED_NOW.toISOString(),
  },
];

export function buildSurveyState(overrides: Partial<SurveyBuilderState> = {}): SurveyBuilderState {
  return {
    title: "Encuesta de Empleabilidad",
    description: "Situación laboral",
    careerId: CAREERS[0].id,
    academicPeriod: "II-2026",
    opensAt: "2026-11-03",
    closesAt: "2026-12-15",
    questions: [
      {
        id: "q1",
        statement: "¿Cuál es tu condición laboral actual?",
        type: "single_choice",
        isRequired: true,
        options: [
          { id: "o1", label: "Empleado" },
          { id: "o2", label: "Independiente" },
        ],
      },
    ],
    activeQuestionId: "q1",
    pendingFocus: null,
    isDirty: false,
    ...overrides,
  };
}

export function buildAxiosError(status: number | undefined, data?: unknown) {
  return Object.assign(new Error("Request failed"), {
    isAxiosError: true,
    response: status === undefined ? undefined : { status, data },
  });
}
