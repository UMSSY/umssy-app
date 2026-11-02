export interface SubmitAnswerItem {
  questionId: string;
  optionIds: string[];
}

export interface SubmitSurveyPayload {
  answers: SubmitAnswerItem[];
}
