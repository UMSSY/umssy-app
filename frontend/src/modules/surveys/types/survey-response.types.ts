import type { QuestionType } from "./survey.types";

export interface SurveyResponseOption {
  id: string;
  label: string;
}

export interface SurveyResponseQuestion {
  id: string;
  position: number;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: SurveyResponseOption[];
}

// Encuesta publicada tal como la ve el titulado al responderla.
export interface SurveyToAnswer {
  id: string;
  title: string;
  description: string | null;
  questions: SurveyResponseQuestion[];
}

// Opciones elegidas por id de pregunta: una en opción única y varias en opción múltiple.
export type SurveyAnswers = Record<string, string[]>;
