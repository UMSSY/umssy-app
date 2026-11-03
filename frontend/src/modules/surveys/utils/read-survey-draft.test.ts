import { afterEach, describe, expect, it } from "vitest";
import { createInitialSurveyState } from "./survey-builder-reducer";
import { readSurveyDraft } from "./read-survey-draft";

const KEY = "draft-key";

afterEach(() => {
  window.localStorage.clear();
});

describe("readSurveyDraft", () => {
  it("returns undefined when there is no stored draft", () => {
    expect(readSurveyDraft(KEY)).toBeUndefined();
  });

  it("returns undefined when the stored draft is malformed", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: "Sin preguntas" }));
    expect(readSurveyDraft(KEY)).toBeUndefined();
  });

  it("restores a stored draft as dirty and without pending focus", () => {
    const state = { ...createInitialSurveyState(), title: "Encuesta", pendingFocus: { questionId: "q1" } };
    window.localStorage.setItem(KEY, JSON.stringify(state));

    expect(readSurveyDraft(KEY)).toEqual({ ...state, pendingFocus: null, isDirty: true });
  });
});
