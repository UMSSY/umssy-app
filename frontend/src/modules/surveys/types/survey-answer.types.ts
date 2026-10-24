export interface SurveyOptionItem {
  id: string;
  position: number;
  label: string;
}

export interface SurveyQuestionItem {
  id: string;
  position: number;
  statement: string;
  type: "single_choice" | "multiple_choice";
  isRequired: boolean;
  options: SurveyOptionItem[];
}

export interface SurveyToAnswer {
  id: string;
  title: string;
  description: string | null;
  status: "published" | "draft";
  academicPeriod: string | null;
  opensAt: string | null;
  closesAt: string | null;
  hasAnswered: boolean;
  isExpired: boolean;
  questions: SurveyQuestionItem[];
}

export interface SubmitAnswerItem {
  questionId: string;
  optionIds: string[];
}

export interface SubmitSurveyPayload {
  answers: SubmitAnswerItem[];
}
