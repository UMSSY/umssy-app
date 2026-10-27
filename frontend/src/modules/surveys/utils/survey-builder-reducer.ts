import { DEFAULT_OPTION_COUNT, DEFAULT_QUESTION_TYPE, SURVEY_LIMITS } from "../constants/survey-builder.constants";
import type {
  BuilderOption,
  BuilderQuestion,
  SurveyBuilderAction,
  SurveyBuilderState,
  SurveyFieldName,
} from "../types/survey-builder.types";
import { createId } from "./create-id";

const FIELD_MAX_LENGTH: Partial<Record<SurveyFieldName, number>> = {
  title: SURVEY_LIMITS.titleMax,
  description: SURVEY_LIMITS.descriptionMax,
};

export function createOption(label = ""): BuilderOption {
  return { id: createId(), label };
}

export function createQuestion(): BuilderQuestion {
  return {
    id: createId(),
    statement: "",
    type: DEFAULT_QUESTION_TYPE,
    isRequired: true,
    options: Array.from({ length: DEFAULT_OPTION_COUNT }, () => createOption()),
  };
}

export function createInitialSurveyState(): SurveyBuilderState {
  const firstQuestion = createQuestion();
  return {
    title: "",
    description: "",
    careerId: "",
    academicPeriod: "",
    opensAt: "",
    closesAt: "",
    questions: [firstQuestion],
    activeQuestionId: firstQuestion.id,
    pendingFocus: null,
    isDirty: false,
  };
}

function updateQuestion(
  state: SurveyBuilderState,
  questionId: string,
  update: (question: BuilderQuestion) => BuilderQuestion,
): SurveyBuilderState {
  const index = state.questions.findIndex(({ id }) => id === questionId);
  if (index < 0) return state;

  const questions = [...state.questions];
  questions[index] = update(questions[index]);
  return { ...state, questions, isDirty: true };
}

function insertQuestion(state: SurveyBuilderState, question: BuilderQuestion, index: number): SurveyBuilderState {
  const questions = [...state.questions];
  questions.splice(index, 0, question);
  return {
    ...state,
    questions,
    activeQuestionId: question.id,
    pendingFocus: { questionId: question.id },
    isDirty: true,
  };
}

function getInsertIndex(state: SurveyBuilderState, afterIndex?: number): number {
  if (afterIndex !== undefined) return Math.min(Math.max(afterIndex + 1, 0), state.questions.length);
  const activeIndex = state.questions.findIndex(({ id }) => id === state.activeQuestionId);
  return activeIndex >= 0 ? activeIndex + 1 : state.questions.length;
}

export function surveyBuilderReducer(state: SurveyBuilderState, action: SurveyBuilderAction): SurveyBuilderState {
  switch (action.type) {
    case "updateField": {
      const maxLength = FIELD_MAX_LENGTH[action.field];
      const value = maxLength ? action.value.slice(0, maxLength) : action.value;
      return { ...state, [action.field]: value, isDirty: true };
    }

    case "addQuestion":
      return insertQuestion(state, createQuestion(), getInsertIndex(state, action.afterIndex));

    case "duplicateQuestion": {
      const index = state.questions.findIndex(({ id }) => id === action.questionId);
      if (index < 0) return state;
      const original = state.questions[index];
      const copy: BuilderQuestion = {
        ...original,
        id: createId(),
        options: original.options.map(({ label }) => createOption(label)),
      };
      return insertQuestion(state, copy, index + 1);
    }

    case "removeQuestion": {
      const index = state.questions.findIndex(({ id }) => id === action.questionId);
      if (index < 0) return state;
      const questions = state.questions.filter(({ id }) => id !== action.questionId);
      const isActive = state.activeQuestionId === action.questionId;
      const nextActive = questions[Math.min(index, questions.length - 1)]?.id ?? null;
      return {
        ...state,
        questions,
        activeQuestionId: isActive ? nextActive : state.activeQuestionId,
        pendingFocus: null,
        isDirty: true,
      };
    }

    case "moveQuestion": {
      const { fromIndex, toIndex } = action;
      const lastIndex = state.questions.length - 1;
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex > lastIndex || toIndex > lastIndex) {
        return state;
      }
      const questions = [...state.questions];
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, moved);
      return { ...state, questions, isDirty: true };
    }

    case "setActiveQuestion":
      if (state.activeQuestionId === action.questionId) return state;
      return { ...state, activeQuestionId: action.questionId, pendingFocus: null };

    case "updateStatement":
      return updateQuestion(state, action.questionId, (question) => ({
        ...question,
        statement: action.statement.slice(0, SURVEY_LIMITS.statementMax),
      }));

    case "changeType":
      return updateQuestion(state, action.questionId, (question) => ({ ...question, type: action.questionType }));

    case "toggleRequired":
      return updateQuestion(state, action.questionId, (question) => ({ ...question, isRequired: !question.isRequired }));

    case "addOption": {
      const option = createOption();
      const next = updateQuestion(state, action.questionId, (question) => ({
        ...question,
        options: [...question.options, option],
      }));
      return next === state ? state : { ...next, pendingFocus: { questionId: action.questionId, optionId: option.id } };
    }

    case "removeOption":
      return updateQuestion(state, action.questionId, (question) =>
        question.options.length <= SURVEY_LIMITS.minOptions
          ? question
          : { ...question, options: question.options.filter(({ id }) => id !== action.optionId) },
      );

    case "updateOption":
      return updateQuestion(state, action.questionId, (question) => ({
        ...question,
        options: question.options.map((option) =>
          option.id === action.optionId ? { ...option, label: action.label.slice(0, SURVEY_LIMITS.optionMax) } : option,
        ),
      }));

    case "clearPendingFocus":
      return state.pendingFocus ? { ...state, pendingFocus: null } : state;

    case "markSaved":
      return { ...state, isDirty: false };

    default:
      return state;
  }
}
