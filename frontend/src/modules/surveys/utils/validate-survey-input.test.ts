import { describe, expect, it } from "vitest";
import { SURVEY_MAX_QUESTIONS } from "../constants/survey-form.constants";
import type { SurveyInput, SurveyQuestionInput } from "../types/survey.types";
import { getTodayIsoDate, validateSurveyInput } from "./validate-survey-input";

const TODAY = "2026-10-22";

function question(overrides: Partial<SurveyQuestionInput> = {}): SurveyQuestionInput {
  return { text: "¿Trabajas?", type: "SINGLE_CHOICE", isRequired: true, options: ["Sí", "No"], ...overrides };
}

function input(overrides: Partial<SurveyInput> = {}): SurveyInput {
  return {
    title: "Encuesta",
    description: "",
    targetCareer: null,
    period: "II-2026",
    opensAt: "2026-11-03",
    closesAt: "2026-12-15",
    questions: [question()],
    ...overrides,
  };
}

function fields(value: SurveyInput, mode: "draft" | "publish" = "publish") {
  return validateSurveyInput(value, mode, TODAY).map((error) => error.field);
}

describe("validateSurveyInput", () => {
  it("acepta una encuesta completa", () => {
    expect(validateSurveyInput(input(), "publish", TODAY)).toEqual([]);
  });

  it("exige título, gestión y fechas al publicar", () => {
    expect(fields(input({ title: "  ", period: null, opensAt: "", closesAt: "" }))).toEqual([
      "title",
      "period",
      "opensAt",
      "closesAt",
    ]);
  });

  it("muestra el mensaje del CA cuando el cierre es anterior a la apertura", () => {
    const [error] = validateSurveyInput(input({ closesAt: "2026-11-01" }), "publish", TODAY);

    expect(error).toEqual({
      field: "closesAt",
      message: "La fecha de cierre debe ser posterior a la fecha de apertura",
      summary: "Fecha de cierre: la fecha de cierre debe ser posterior a la fecha de apertura.",
    });
  });

  it("no permite abrir la encuesta en una fecha pasada", () => {
    expect(fields(input({ opensAt: "2026-10-21" }))).toEqual(["opensAt"]);
  });

  it("en borrador solo exige el título y fechas coherentes", () => {
    expect(fields(input({ period: null, opensAt: "", closesAt: "", questions: [] }), "draft")).toEqual([]);
    expect(fields(input({ title: "" }), "draft")).toEqual(["title"]);
    expect(fields(input({ opensAt: "2026-12-01", closesAt: "2026-11-01" }), "draft")).toEqual(["closesAt"]);
  });

  it("exige al menos una pregunta y no más del máximo", () => {
    expect(fields(input({ questions: [] }))).toEqual(["questions"]);
    expect(fields(input({ questions: Array.from({ length: SURVEY_MAX_QUESTIONS + 1 }, () => question()) }))).toEqual(["questions"]);
  });

  it("valida el enunciado y las opciones de cada pregunta", () => {
    const errors = validateSurveyInput(
      input({
        questions: [
          question(),
          question(),
          question(),
          question({ text: " ", options: ["Opción 1"] }),
        ],
      }),
      "publish",
      TODAY,
    );

    expect(errors.map((error) => error.summary)).toEqual([
      "Pregunta 4: el enunciado de la pregunta es obligatorio.",
      "Pregunta 4: la pregunta debe tener al menos 2 opciones.",
    ]);
    expect(errors[0].message).toBe("El enunciado de la pregunta es obligatorio");
  });

  it("rechaza opciones vacías, repetidas o demasiadas", () => {
    expect(validateSurveyInput(input({ questions: [question({ options: ["Sí", " "] })] }), "publish", TODAY)[0].message).toBe(
      "Las opciones no pueden estar vacías",
    );
    expect(validateSurveyInput(input({ questions: [question({ options: ["Sí", " sí "] })] }), "publish", TODAY)[0].message).toBe(
      "Las opciones de una pregunta no pueden repetirse",
    );
    expect(
      validateSurveyInput(input({ questions: [question({ options: Array.from({ length: 11 }, (_, index) => `O${index}`) })] }), "publish", TODAY)[0]
        .message,
    ).toBe("La pregunta no puede tener más de 10 opciones");
  });
});

describe("getTodayIsoDate", () => {
  it("usa la fecha de Bolivia aunque en UTC ya sea el día siguiente", () => {
    expect(getTodayIsoDate(new Date("2026-10-23T02:00:00.000Z"))).toBe("2026-10-22");
  });
});
