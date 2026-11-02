import { describe, expect, it } from "vitest";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { buildSurveyState, TODAY_VALUE } from "../testing/survey-fixtures";
import { getQuestionErrorPaths, toErrorMap, validateDraft, validateSurvey } from "./validate-survey";

function paths(overrides: Parameters<typeof buildSurveyState>[0]) {
  return validateSurvey(buildSurveyState(overrides), TODAY_VALUE).map(({ path, message }) => ({ path, message }));
}

describe("validateSurvey", () => {
  it("no devuelve errores para una encuesta completa", () => {
    expect(validateSurvey(buildSurveyState(), TODAY_VALUE)).toEqual([]);
  });

  it("exige un título de al menos 5 caracteres sin contar espacios", () => {
    expect(paths({ title: "   " })).toEqual([{ path: "title", message: SURVEY_MESSAGES.titleRequired }]);
    expect(paths({ title: " abcd " })).toEqual([{ path: "title", message: SURVEY_MESSAGES.titleTooShort }]);
  });

  it("exige carrera, gestión y fechas con su etiqueta para la alerta", () => {
    const errors = validateSurvey(
      buildSurveyState({ careerId: "", academicPeriod: "", opensAt: "", closesAt: "" }),
      TODAY_VALUE,
    );

    expect(errors.map(({ label, summary }) => `${label}: ${summary}`)).toEqual([
      "Carrera dirigida: es obligatoria.",
      "Gestión: es obligatoria.",
      "Fecha de apertura: es obligatoria.",
      "Fecha de cierre: es obligatoria.",
    ]);
  });

  it("rechaza una apertura anterior a hoy y un cierre igual o anterior a la apertura", () => {
    expect(paths({ opensAt: "2026-10-21" })).toContainEqual({ path: "opensAt", message: SURVEY_MESSAGES.opensInThePast });
    expect(paths({ opensAt: TODAY_VALUE, closesAt: TODAY_VALUE })).toEqual([
      { path: "closesAt", message: SURVEY_MESSAGES.closesBeforeOpens },
    ]);
    expect(paths({ opensAt: "2026-11-10", closesAt: "2026-11-01" })).toEqual([
      { path: "closesAt", message: SURVEY_MESSAGES.closesBeforeOpens },
    ]);
  });

  it("exige al menos una pregunta", () => {
    expect(paths({ questions: [] })).toEqual([{ path: "questions", message: SURVEY_MESSAGES.questionsRequired }]);
  });

  it("valida enunciado y opciones de cada pregunta con su ruta", () => {
    const base = buildSurveyState().questions[0];
    const errors = validateSurvey(
      buildSurveyState({
        questions: [
          base,
          { ...base, id: "q2", statement: "  " },
          { ...base, id: "q3", options: [{ id: "a", label: "Sí" }, { id: "b", label: "  " }] },
          { ...base, id: "q4", options: [{ id: "a", label: "Sí" }, { id: "b", label: " sí " }] },
        ],
      }),
      TODAY_VALUE,
    );

    expect(errors.map(({ path, label, summary }) => ({ path, text: `${label}: ${summary}` }))).toEqual([
      { path: "questions.1.statement", text: "Pregunta 2: el enunciado es obligatorio." },
      { path: "questions.2.options", text: "Pregunta 3: debe tener al menos 2 opciones." },
      { path: "questions.3.options", text: "Pregunta 4: las opciones no pueden repetirse." },
    ]);
  });
});

describe("validateDraft", () => {
  it("solo valida el título", () => {
    expect(validateDraft({ title: "Borrador" })).toEqual([]);
    expect(validateDraft({ title: "" })[0].message).toBe(SURVEY_MESSAGES.titleRequired);
  });
});

describe("toErrorMap", () => {
  it("conserva el primer mensaje por ruta", () => {
    expect(
      toErrorMap([
        { path: "title", label: "Título", message: "primero", summary: "" },
        { path: "title", label: "Título", message: "segundo", summary: "" },
      ]),
    ).toEqual({ title: "primero" });
  });

  it("expone las rutas de error de una pregunta", () => {
    expect(getQuestionErrorPaths(2)).toEqual(["questions.2.statement", "questions.2.options"]);
  });
});
