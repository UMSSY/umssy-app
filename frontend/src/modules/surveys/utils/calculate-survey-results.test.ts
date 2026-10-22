import { describe, expect, it } from "vitest";
import type { SurveyTables } from "../types/survey-records.types";
import { calculateSurveyMetrics, calculateSurveyStatistics } from "./calculate-survey-results";

const SYSTEMS = "Licenciatura en Ingeniería de Sistemas";
const INFORMATICS = "Licenciatura Ingeniería en Informática";

function buildTables(overrides: Partial<SurveyTables> = {}): SurveyTables {
  return {
    admins: [],
    graduates: [
      { id: "g1", career: SYSTEMS, graduationPeriod: "I-2024" },
      { id: "g2", career: SYSTEMS, graduationPeriod: "II-2024" },
      { id: "g3", career: SYSTEMS, graduationPeriod: "II-2024" },
      { id: "g4", career: INFORMATICS, graduationPeriod: "I-2025" },
    ],
    surveys: [
      {
        id: "s1",
        title: "Encuesta",
        description: "",
        status: "CLOSED",
        period: "I-2026",
        targetCareer: SYSTEMS,
        opensAt: "2026-03-01",
        closesAt: "2026-06-30",
        createdById: "a1",
        createdAt: "2026-02-20T10:00:00.000Z",
      },
    ],
    surveyQuestions: [
      { id: "q1", surveyId: "s1", text: "¿Trabajas?", type: "SINGLE_CHOICE", isRequired: true, order: 1 },
      { id: "q2", surveyId: "s1", text: "¿Áreas?", type: "MULTIPLE_CHOICE", isRequired: true, order: 2 },
    ],
    surveyOptions: [
      { id: "q1o2", questionId: "q1", text: "No", order: 2 },
      { id: "q1o1", questionId: "q1", text: "Sí", order: 1 },
      { id: "q1o3", questionId: "q1", text: "Prefiero no decir", order: 3 },
      { id: "q2o1", questionId: "q2", text: "Software", order: 1 },
      { id: "q2o2", questionId: "q2", text: "Datos", order: 2 },
    ],
    surveyResponses: [
      { id: "r1", surveyId: "s1", userId: "g1", startedAt: "2026-03-02T12:00:00.000Z", completedAt: "2026-03-02T12:03:00.000Z" },
      { id: "r2", surveyId: "s1", userId: "g2", startedAt: "2026-03-02T12:00:00.000Z", completedAt: "2026-03-02T12:04:30.000Z" },
      { id: "r3", surveyId: "s1", userId: "g3", startedAt: "2026-03-03T12:00:00.000Z", completedAt: null },
    ],
    surveyAnswers: [
      { id: "a1", responseId: "r1", questionId: "q1", optionId: "q1o1" },
      { id: "a2", responseId: "r2", questionId: "q1", optionId: "q1o1" },
      { id: "a3", responseId: "r3", questionId: "q1", optionId: "q1o2" },
      { id: "a4", responseId: "r1", questionId: "q2", optionId: "q2o1" },
      { id: "a5", responseId: "r1", questionId: "q2", optionId: "q2o2" },
      { id: "a6", responseId: "r2", questionId: "q2", optionId: "q2o1" },
    ],
    ...overrides,
  };
}

describe("calculateSurveyMetrics", () => {
  it("calcula las métricas de participación de la encuesta", () => {
    expect(calculateSurveyMetrics(buildTables(), "s1")).toEqual({
      invitedCount: 3,
      respondedCount: 3,
      completedCount: 2,
      responseRate: 100,
      completionRate: 66.7,
      averageResponseSeconds: 225,
      distinctCareers: 1,
      distinctPeriods: 2,
    });
  });

  it("cuenta como invitados a todos los titulados si la encuesta va a todas las carreras", () => {
    const tables = buildTables();
    tables.surveys[0].targetCareer = null;

    expect(calculateSurveyMetrics(tables, "s1").invitedCount).toBe(4);
  });

  it("devuelve ceros sin divisiones por cero cuando nadie respondió", () => {
    expect(calculateSurveyMetrics(buildTables({ surveyResponses: [], graduates: [] }), "s1")).toEqual({
      invitedCount: 0,
      respondedCount: 0,
      completedCount: 0,
      responseRate: 0,
      completionRate: 0,
      averageResponseSeconds: 0,
      distinctCareers: 0,
      distinctPeriods: 0,
    });
  });
});

describe("calculateSurveyStatistics", () => {
  it("devuelve las preguntas en orden con todas sus opciones, incluidas las que tienen 0", () => {
    const statistics = calculateSurveyStatistics(buildTables(), "s1");

    expect(statistics?.totalResponses).toBe(3);
    expect(statistics?.questions[0]).toMatchObject({
      order: 1,
      answeredBy: 3,
      totalSelections: 3,
      options: [
        { text: "Sí", count: 2, percentage: 66.7 },
        { text: "No", count: 1, percentage: 33.3 },
        { text: "Prefiero no decir", count: 0, percentage: 0 },
      ],
    });
  });

  it("en opción múltiple calcula el porcentaje sobre el total de selecciones", () => {
    const multiple = calculateSurveyStatistics(buildTables(), "s1")?.questions[1];

    expect(multiple).toMatchObject({ answeredBy: 2, totalSelections: 3 });
    expect(multiple?.options.map((option) => option.percentage)).toEqual([66.7, 33.3]);
  });

  it("devuelve null si la encuesta no existe o no tiene gestión", () => {
    const tables = buildTables();

    expect(calculateSurveyStatistics(tables, "no-existe")).toBeNull();
    tables.surveys[0].period = null;
    expect(calculateSurveyStatistics(tables, "s1")).toBeNull();
  });
});
