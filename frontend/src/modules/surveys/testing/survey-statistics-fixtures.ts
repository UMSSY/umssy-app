import type { SurveyQuestionStatistic, SurveyStatistics } from "../types/survey.types";

export const STATISTICS_PERIODS = ["II-2026", "I-2026"];

export function buildQuestionStatistic(overrides: Partial<SurveyQuestionStatistic> = {}): SurveyQuestionStatistic {
  return {
    id: "question-1",
    position: 1,
    statement: "¿Cuál es tu situación laboral actual?",
    type: "single_choice",
    isRequired: true,
    answeredCount: 5,
    totalSelections: 5,
    options: [
      { id: "option-1", label: "Empleado a tiempo completo", count: 2, percentage: 40 },
      { id: "option-2", label: "Empleado a medio tiempo", count: 0, percentage: 0 },
      { id: "option-3", label: "Trabajador independiente", count: 3, percentage: 60 },
      { id: "option-4", label: "Buscando empleo", count: 0, percentage: 0 },
    ],
    trend: { text: "La opción más elegida es «Trabajador independiente» con 60% (3 de 5 respuestas).", direction: "neutral" },
    ...overrides,
  };
}

export function buildMultipleChoiceStatistic(): SurveyQuestionStatistic {
  return buildQuestionStatistic({
    id: "question-2",
    position: 2,
    statement: "¿Qué competencias usas con más frecuencia?",
    type: "multiple_choice",
    isRequired: false,
    answeredCount: 10,
    totalSelections: 10,
    options: [
      { id: "option-5", label: "Programación", count: 3, percentage: 30 },
      { id: "option-6", label: "Bases de datos", count: 3, percentage: 30 },
      { id: "option-7", label: "Gestión de proyectos", count: 2, percentage: 20 },
      { id: "option-8", label: "Redes", count: 2, percentage: 20 },
    ],
    trend: { text: "Hay un empate entre «Programación» y «Bases de datos» con 30% cada una.", direction: "neutral" },
  });
}

export function buildStatistics(overrides: Partial<SurveyStatistics> = {}): SurveyStatistics {
  return {
    id: "survey-1",
    title: "Encuesta de empleabilidad 2020",
    description: null,
    status: "published",
    academicPeriod: "2020",
    career: { id: "career-1", title: "Ingeniería de Sistemas" },
    opensAt: "2026-10-27T04:00:00.000Z",
    closesAt: "2027-11-03T04:00:00.000Z",
    totalResponses: 5,
    hasData: true,
    period: null,
    availablePeriods: STATISTICS_PERIODS,
    questions: [buildQuestionStatistic(), buildMultipleChoiceStatistic()],
    ...overrides,
  };
}

// Mismo cuestionario sin respuestas: se conservan las preguntas y las opciones, todo en cero.
export function buildEmptyStatistics(period: string): SurveyStatistics {
  const zero = (question: SurveyQuestionStatistic): SurveyQuestionStatistic => ({
    ...question,
    answeredCount: 0,
    totalSelections: 0,
    options: question.options.map((option) => ({ ...option, count: 0, percentage: 0 })),
    trend: { text: "Sin respuestas registradas en este periodo.", direction: "neutral" },
  });

  return buildStatistics({
    totalResponses: 0,
    hasData: false,
    period,
    questions: [zero(buildQuestionStatistic()), zero(buildMultipleChoiceStatistic())],
  });
}
