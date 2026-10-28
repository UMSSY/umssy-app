import { describe, expect, it } from "vitest";
import { buildSurveyState } from "../testing/survey-fixtures";
import type { SurveyBuilderState } from "../types/survey-builder.types";
import { createInitialSurveyState, createQuestion, surveyBuilderReducer as reduce } from "./survey-builder-reducer";

function withQuestions(count: number): SurveyBuilderState {
  const questions = Array.from({ length: count }, (_, index) => ({ ...createQuestion(), statement: `P${index + 1}` }));
  return buildSurveyState({ questions, activeQuestionId: questions[0].id });
}

describe("surveyBuilderReducer", () => {
  it("inicia con una pregunta vacía activa de opción única, obligatoria y con 2 opciones", () => {
    const state = createInitialSurveyState();

    expect(state.questions).toHaveLength(1);
    expect(state.questions[0]).toMatchObject({ statement: "", type: "single_choice", isRequired: true });
    expect(state.questions[0].options).toHaveLength(2);
    expect(state.activeQuestionId).toBe(state.questions[0].id);
    expect(state.isDirty).toBe(false);
  });

  it("actualiza campos del encabezado respetando los límites de longitud", () => {
    let state = reduce(createInitialSurveyState(), { type: "updateField", field: "title", value: "a".repeat(200) });
    state = reduce(state, { type: "updateField", field: "description", value: "b".repeat(600) });
    state = reduce(state, { type: "updateField", field: "careerId", value: "career-1" });

    expect(state.title).toHaveLength(150);
    expect(state.description).toHaveLength(500);
    expect(state.careerId).toBe("career-1");
    expect(state.isDirty).toBe(true);
  });

  it("inserta la nueva pregunta debajo de la activa y le pide el foco", () => {
    const initial = withQuestions(3);
    const state = reduce(initial, { type: "addQuestion" });

    expect(state.questions.map(({ statement }) => statement)).toEqual(["P1", "", "P2", "P3"]);
    expect(state.activeQuestionId).toBe(state.questions[1].id);
    expect(state.pendingFocus).toEqual({ questionId: state.questions[1].id });
  });

  it("inserta al final si no hay pregunta activa y respeta afterIndex", () => {
    const noActive = { ...withQuestions(2), activeQuestionId: null };

    expect(reduce(noActive, { type: "addQuestion" }).questions[2].statement).toBe("");
    expect(reduce(withQuestions(2), { type: "addQuestion", afterIndex: 1 }).questions[2].statement).toBe("");
    expect(reduce(withQuestions(2), { type: "addQuestion", afterIndex: 9 }).questions).toHaveLength(3);
  });

  it("duplica una pregunta con identificadores nuevos debajo de la original", () => {
    const initial = withQuestions(2);
    const original = initial.questions[0];
    const state = reduce(initial, { type: "duplicateQuestion", questionId: original.id });
    const copy = state.questions[1];

    expect(copy.statement).toBe("P1");
    expect(copy.id).not.toBe(original.id);
    expect(copy.options.map(({ id }) => id)).not.toEqual(original.options.map(({ id }) => id));
    expect(state.activeQuestionId).toBe(copy.id);
    expect(reduce(initial, { type: "duplicateQuestion", questionId: "missing" })).toBe(initial);
  });

  it("elimina una pregunta y activa la siguiente disponible", () => {
    const initial = withQuestions(3);
    const state = reduce(initial, { type: "removeQuestion", questionId: initial.questions[0].id });

    expect(state.questions.map(({ statement }) => statement)).toEqual(["P2", "P3"]);
    expect(state.activeQuestionId).toBe(state.questions[0].id);

    const last = { ...initial, activeQuestionId: initial.questions[2].id };
    expect(reduce(last, { type: "removeQuestion", questionId: initial.questions[2].id }).activeQuestionId).toBe(
      initial.questions[1].id,
    );
    const otherActive = reduce(initial, { type: "removeQuestion", questionId: initial.questions[1].id });
    expect(otherActive.activeQuestionId).toBe(initial.questions[0].id);
    expect(reduce(initial, { type: "removeQuestion", questionId: "missing" })).toBe(initial);
  });

  it("deja sin pregunta activa al eliminar la única pregunta", () => {
    const initial = withQuestions(1);

    const state = reduce(initial, { type: "removeQuestion", questionId: initial.questions[0].id });

    expect(state.questions).toEqual([]);
    expect(state.activeQuestionId).toBeNull();
  });

  it("mueve preguntas e ignora índices inválidos", () => {
    const initial = withQuestions(3);

    expect(reduce(initial, { type: "moveQuestion", fromIndex: 2, toIndex: 0 }).questions.map(({ statement }) => statement)).toEqual([
      "P3",
      "P1",
      "P2",
    ]);
    expect(reduce(initial, { type: "moveQuestion", fromIndex: 0, toIndex: 0 })).toBe(initial);
    expect(reduce(initial, { type: "moveQuestion", fromIndex: -1, toIndex: 1 })).toBe(initial);
    expect(reduce(initial, { type: "moveQuestion", fromIndex: 0, toIndex: 3 })).toBe(initial);
  });

  it("cambia la pregunta activa sin marcar cambios", () => {
    const initial = withQuestions(2);
    const state = reduce(initial, { type: "setActiveQuestion", questionId: initial.questions[1].id });

    expect(state.activeQuestionId).toBe(initial.questions[1].id);
    expect(state.isDirty).toBe(false);
    expect(reduce(state, { type: "setActiveQuestion", questionId: initial.questions[1].id })).toBe(state);
  });

  it("edita enunciado, tipo y obligatoriedad conservando las opciones", () => {
    const initial = withQuestions(1);
    const id = initial.questions[0].id;
    let state = reduce(initial, { type: "updateStatement", questionId: id, statement: "x".repeat(300) });
    state = reduce(state, { type: "changeType", questionId: id, questionType: "multiple_choice" });
    state = reduce(state, { type: "toggleRequired", questionId: id });

    expect(state.questions[0].statement).toHaveLength(250);
    expect(state.questions[0].type).toBe("multiple_choice");
    expect(state.questions[0].isRequired).toBe(false);
    expect(state.questions[0].options).toEqual(initial.questions[0].options);
    expect(reduce(initial, { type: "toggleRequired", questionId: "missing" })).toBe(initial);
  });

  it("agrega, edita y elimina opciones sin bajar de 2", () => {
    const initial = withQuestions(1);
    const id = initial.questions[0].id;
    let state = reduce(initial, { type: "addOption", questionId: id });
    const added = state.questions[0].options[2];

    expect(state.pendingFocus).toEqual({ questionId: id, optionId: added.id });

    state = reduce(state, { type: "updateOption", questionId: id, optionId: added.id, label: "o".repeat(120) });
    expect(state.questions[0].options[2].label).toHaveLength(100);

    state = reduce(state, { type: "removeOption", questionId: id, optionId: added.id });
    expect(state.questions[0].options).toHaveLength(2);

    const blocked = reduce(state, { type: "removeOption", questionId: id, optionId: state.questions[0].options[0].id });
    expect(blocked.questions[0].options).toHaveLength(2);
    expect(reduce(initial, { type: "addOption", questionId: "missing" })).toBe(initial);
  });

  it("limpia el foco pendiente y marca la encuesta como guardada", () => {
    const focused = reduce(withQuestions(1), { type: "addQuestion" });
    const cleared = reduce(focused, { type: "clearPendingFocus" });

    expect(cleared.pendingFocus).toBeNull();
    expect(reduce(cleared, { type: "clearPendingFocus" })).toBe(cleared);
    expect(reduce(cleared, { type: "markSaved" }).isDirty).toBe(false);
  });

  it("ignora acciones desconocidas", () => {
    const initial = withQuestions(1);

    expect(reduce(initial, { type: "unknown" } as never)).toBe(initial);
  });
});
