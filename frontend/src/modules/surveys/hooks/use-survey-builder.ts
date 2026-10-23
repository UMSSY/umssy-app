"use client";

import { useReducer } from "react";
import type { QuestionType } from "../types/survey.types";
import type { SurveyFieldName } from "../types/survey-builder.types";
import { createInitialSurveyState, surveyBuilderReducer } from "../utils/survey-builder-reducer";

export function useSurveyBuilder() {
  const [state, dispatch] = useReducer(surveyBuilderReducer, undefined, createInitialSurveyState);

  return {
    state,
    updateField: (field: SurveyFieldName, value: string) => dispatch({ type: "updateField", field, value }),
    addQuestion: (afterIndex?: number) => dispatch({ type: "addQuestion", afterIndex }),
    duplicateQuestion: (questionId: string) => dispatch({ type: "duplicateQuestion", questionId }),
    removeQuestion: (questionId: string) => dispatch({ type: "removeQuestion", questionId }),
    moveQuestion: (fromIndex: number, toIndex: number) => dispatch({ type: "moveQuestion", fromIndex, toIndex }),
    setActiveQuestion: (questionId: string | null) => dispatch({ type: "setActiveQuestion", questionId }),
    updateStatement: (questionId: string, statement: string) => dispatch({ type: "updateStatement", questionId, statement }),
    changeType: (questionId: string, questionType: QuestionType) => dispatch({ type: "changeType", questionId, questionType }),
    toggleRequired: (questionId: string) => dispatch({ type: "toggleRequired", questionId }),
    addOption: (questionId: string) => dispatch({ type: "addOption", questionId }),
    removeOption: (questionId: string, optionId: string) => dispatch({ type: "removeOption", questionId, optionId }),
    updateOption: (questionId: string, optionId: string, label: string) =>
      dispatch({ type: "updateOption", questionId, optionId, label }),
    clearPendingFocus: () => dispatch({ type: "clearPendingFocus" }),
    markSaved: () => dispatch({ type: "markSaved" }),
  };
}
