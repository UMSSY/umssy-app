import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSurveyState } from "../testing/survey-fixtures";
import { getErrorQuestionId, getErrorTargetId, revealElement } from "./get-error-target-id";

describe("get-error-target-id", () => {
  const questions = buildSurveyState().questions;

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("resuelve el elemento a enfocar para cada ruta de error", () => {
    expect(getErrorTargetId("title", questions)).toBe("survey-title");
    expect(getErrorTargetId("questions", questions)).toBe("survey-add-question");
    expect(getErrorTargetId("questions.0.options", questions)).toBe("question-q1");
    expect(getErrorTargetId("desconocido", questions)).toBeNull();
    expect(getErrorQuestionId("questions.5.statement", questions)).toBeNull();
    expect(getErrorQuestionId("title", questions)).toBeNull();
  });

  it("desplaza y enfoca el elemento o su primer campo interno", () => {
    document.body.innerHTML = '<input id="survey-title" /><div id="question-q1"><input id="inner" /></div>';
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    revealElement("survey-title");
    expect(document.activeElement?.id).toBe("survey-title");

    revealElement("question-q1");
    expect(document.activeElement?.id).toBe("inner");

    revealElement(null);
    revealElement("no-existe");
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
