import { CAREERS } from "@/modules/access-request";
import {
  createDefaultQuestion,
  SURVEY_MAX_OPTIONS,
  SURVEY_MAX_QUESTIONS,
  SURVEY_MIN_OPTIONS,
} from "../constants/survey-form.constants";
import type { SurveyFormAction, SurveyFormQuestion, SurveyFormState, SurveyFormValues } from "../types/survey-form.types";
import type { SurveyInput, SurveyQuestionInput } from "../types/survey.types";

function createKey(): string {
  return crypto.randomUUID();
}

function withKey(question: SurveyQuestionInput): SurveyFormQuestion {
  return { ...question, options: [...question.options], key: createKey() };
}

export function createEmptySurveyFormValues(): SurveyFormValues {
  return {
    title: "",
    description: "",
    targetCareer: CAREERS[0],
    period: null,
    opensAt: "",
    closesAt: "",
    questions: [withKey(createDefaultQuestion())],
  };
}

export function toSurveyFormValues(input: SurveyInput): SurveyFormValues {
  const questions = input.questions.length > 0 ? input.questions : [createDefaultQuestion()];
  return { ...input, questions: questions.map(withKey) };
}

export function toSurveyInput(values: SurveyFormValues): SurveyInput {
  return {
    ...values,
    questions: values.questions.map(({ text, type, isRequired, options }) => ({ text, type, isRequired, options })),
  };
}

export function createSurveyFormState(values: SurveyFormValues, isDirty = false): SurveyFormState {
  return { values, activeKey: values.questions[0]?.key ?? null, attemptedMode: null, isDirty };
}

function updateQuestions(
  state: SurveyFormState,
  questions: SurveyFormQuestion[],
  activeKey = state.activeKey,
): SurveyFormState {
  return { ...state, values: { ...state.values, questions }, activeKey, isDirty: true };
}

function mapQuestion(state: SurveyFormState, key: string, update: (question: SurveyFormQuestion) => SurveyFormQuestion) {
  return updateQuestions(
    state,
    state.values.questions.map((question) => (question.key === key ? update(question) : question)),
  );
}

// Todas las acciones del formulario de encuesta en un solo lugar (patrón reducer).
// Es una función pura: recibe el estado y la acción, y devuelve el estado nuevo sin modificar el anterior.
export function surveyFormReducer(state: SurveyFormState, action: SurveyFormAction): SurveyFormState {
  const { questions } = state.values;

  switch (action.type) {
    case "setField":
      return { ...state, values: { ...state.values, [action.field]: action.value }, isDirty: true };

    case "setActive":
      return { ...state, activeKey: action.key };

    case "addQuestion": {
      if (questions.length >= SURVEY_MAX_QUESTIONS) return state;
      const question = withKey(createDefaultQuestion());
      const activeIndex = questions.findIndex((item) => item.key === state.activeKey);
      const insertAt = activeIndex === -1 ? questions.length : activeIndex + 1;
      return updateQuestions(state, [...questions.slice(0, insertAt), question, ...questions.slice(insertAt)], question.key);
    }

    case "duplicateQuestion": {
      const index = questions.findIndex((item) => item.key === action.key);
      if (index === -1 || questions.length >= SURVEY_MAX_QUESTIONS) return state;
      const copy = withKey(questions[index]);
      return updateQuestions(state, [...questions.slice(0, index + 1), copy, ...questions.slice(index + 1)], copy.key);
    }

    case "removeQuestion": {
      const index = questions.findIndex((item) => item.key === action.key);
      if (index === -1 || questions.length <= 1) return state;
      const remaining = questions.filter((item) => item.key !== action.key);
      const nextActive = state.activeKey === action.key ? remaining[Math.max(0, index - 1)].key : state.activeKey;
      return updateQuestions(state, remaining, nextActive);
    }

    case "updateQuestion":
      return mapQuestion(state, action.key, (question) => ({ ...question, ...action.changes }));

    case "addOption":
      return mapQuestion(state, action.key, (question) =>
        question.options.length >= SURVEY_MAX_OPTIONS
          ? question
          : { ...question, options: [...question.options, `Opción ${question.options.length + 1}`] },
      );

    case "updateOption":
      return mapQuestion(state, action.key, (question) => ({
        ...question,
        options: question.options.map((option, index) => (index === action.index ? action.text : option)),
      }));

    case "removeOption":
      return mapQuestion(state, action.key, (question) =>
        question.options.length <= SURVEY_MIN_OPTIONS
          ? question
          : { ...question, options: question.options.filter((_, index) => index !== action.index) },
      );

    case "attempt":
      return { ...state, attemptedMode: action.mode };

    case "markSaved":
      return { ...state, isDirty: false };

    case "reset":
      return createSurveyFormState(action.values);

    default:
      return state;
  }
}
