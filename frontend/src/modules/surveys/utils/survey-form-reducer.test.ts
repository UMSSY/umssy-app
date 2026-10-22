import { describe, expect, it } from "vitest";
import type { SurveyFormState } from "../types/survey-form.types";
import {
  createEmptySurveyFormValues,
  createSurveyFormState,
  surveyFormReducer,
  toSurveyFormValues,
  toSurveyInput,
} from "./survey-form-reducer";

function initialState(): SurveyFormState {
  return createSurveyFormState(createEmptySurveyFormValues());
}

function questionKeys(state: SurveyFormState) {
  return state.values.questions.map((question) => question.key);
}

describe("surveyFormReducer", () => {
  it("empieza con una pregunta vacía de opción única, obligatoria y con dos opciones", () => {
    const state = initialState();

    expect(toSurveyInput(state.values).questions).toEqual([
      { text: "", type: "SINGLE_CHOICE", isRequired: true, options: ["Opción 1", "Opción 2"] },
    ]);
    expect(state.activeKey).toBe(state.values.questions[0].key);
    expect(state.isDirty).toBe(false);
  });

  it("inserta la nueva pregunta debajo de la activa y la activa", () => {
    let state = initialState();
    state = surveyFormReducer(state, { type: "addQuestion" });
    state = surveyFormReducer(state, { type: "setActive", key: state.values.questions[0].key });

    state = surveyFormReducer(state, { type: "addQuestion" });

    expect(state.values.questions).toHaveLength(3);
    expect(state.activeKey).toBe(state.values.questions[1].key);
    expect(state.isDirty).toBe(true);
  });

  it("duplica una pregunta debajo de la original con una clave nueva", () => {
    let state = initialState();
    const [original] = state.values.questions;
    state = surveyFormReducer(state, { type: "updateQuestion", key: original.key, changes: { text: "¿Trabajas?" } });

    state = surveyFormReducer(state, { type: "duplicateQuestion", key: original.key });

    expect(state.values.questions.map((question) => question.text)).toEqual(["¿Trabajas?", "¿Trabajas?"]);
    expect(new Set(questionKeys(state)).size).toBe(2);
    expect(state.activeKey).toBe(state.values.questions[1].key);
  });

  it("elimina una pregunta y activa la anterior, pero siempre deja al menos una", () => {
    let state = initialState();
    state = surveyFormReducer(state, { type: "addQuestion" });
    const [first, second] = questionKeys(state);

    state = surveyFormReducer(state, { type: "removeQuestion", key: second });
    expect(questionKeys(state)).toEqual([first]);
    expect(state.activeKey).toBe(first);

    expect(surveyFormReducer(state, { type: "removeQuestion", key: first })).toBe(state);
  });

  it("al cambiar el tipo conserva las opciones escritas", () => {
    let state = initialState();
    const key = state.values.questions[0].key;
    state = surveyFormReducer(state, { type: "updateOption", key, index: 0, text: "Sí" });

    state = surveyFormReducer(state, { type: "updateQuestion", key, changes: { type: "DROPDOWN" } });

    expect(state.values.questions[0]).toMatchObject({ type: "DROPDOWN", options: ["Sí", "Opción 2"] });
  });

  it("añade opciones numeradas hasta el máximo y no baja de dos", () => {
    let state = initialState();
    const key = state.values.questions[0].key;
    for (let count = 0; count < 12; count++) state = surveyFormReducer(state, { type: "addOption", key });

    expect(state.values.questions[0].options).toHaveLength(10);
    expect(state.values.questions[0].options[2]).toBe("Opción 3");

    state = surveyFormReducer(state, { type: "removeOption", key, index: 2 });
    expect(state.values.questions[0].options).toHaveLength(9);
    expect(state.values.questions[0].options[2]).toBe("Opción 4");

    const minimal = initialState();
    expect(surveyFormReducer(minimal, { type: "removeOption", key: minimal.values.questions[0].key, index: 0 }).values.questions[0].options).toHaveLength(2);
  });

  it("no pasa del máximo de preguntas", () => {
    let state = initialState();
    for (let count = 0; count < 25; count++) state = surveyFormReducer(state, { type: "addQuestion" });

    expect(state.values.questions).toHaveLength(20);
    expect(surveyFormReducer(state, { type: "duplicateQuestion", key: state.values.questions[0].key })).toBe(state);
  });

  it("actualiza los campos generales, registra el intento y marca como guardado", () => {
    let state = initialState();
    state = surveyFormReducer(state, { type: "setField", field: "title", value: "Encuesta" });
    state = surveyFormReducer(state, { type: "attempt", mode: "publish" });

    expect(state).toMatchObject({ values: { title: "Encuesta" }, attemptedMode: "publish", isDirty: true });
    expect(surveyFormReducer(state, { type: "markSaved" }).isDirty).toBe(false);
  });

  it("ignora acciones sobre preguntas inexistentes", () => {
    const state = initialState();

    expect(surveyFormReducer(state, { type: "duplicateQuestion", key: "no-existe" })).toBe(state);
    expect(surveyFormReducer(state, { type: "removeQuestion", key: "no-existe" })).toBe(state);
  });

  it("reinicia con otros valores y convierte desde el contrato de la API", () => {
    const values = toSurveyFormValues({
      title: "Guardada",
      description: "",
      targetCareer: null,
      period: "II-2026",
      opensAt: "",
      closesAt: "",
      questions: [],
    });

    const state = surveyFormReducer(initialState(), { type: "reset", values });

    expect(state.values.title).toBe("Guardada");
    expect(state.values.questions).toHaveLength(1);
    expect(state.isDirty).toBe(false);
  });
});
