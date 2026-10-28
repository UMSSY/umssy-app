import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSurveyBuilder } from "./use-survey-builder";

describe("useSurveyBuilder", () => {
  it("expone las acciones del editor sobre el reducer", () => {
    const { result } = renderHook(() => useSurveyBuilder());
    const firstId = result.current.state.questions[0].id;

    act(() => {
      result.current.updateField("title", "Encuesta");
      result.current.updateStatement(firstId, "Pregunta");
      result.current.changeType(firstId, "multiple_choice");
      result.current.toggleRequired(firstId);
      result.current.addOption(firstId);
    });
    const thirdOption = result.current.state.questions[0].options[2];

    expect(result.current.state.pendingFocus).toEqual({ questionId: firstId, optionId: thirdOption.id });

    act(() => {
      result.current.updateOption(firstId, thirdOption.id, "Tercera");
      result.current.clearPendingFocus();
      result.current.duplicateQuestion(firstId);
      result.current.addQuestion();
      result.current.moveQuestion(0, 2);
      result.current.setActiveQuestion(firstId);
    });
    act(() => {
      result.current.removeOption(firstId, thirdOption.id);
      result.current.removeQuestion(firstId);
      result.current.markSaved();
    });

    expect(result.current.state.title).toBe("Encuesta");
    expect(result.current.state.questions).toHaveLength(2);
    expect(result.current.state.questions.some(({ statement }) => statement === "Pregunta")).toBe(true);
    expect(result.current.state.isDirty).toBe(false);
  });
});
