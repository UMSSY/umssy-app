export const SURVEY_STATUSES = ['draft', 'published'] as const;

export type SurveyStatusValue = (typeof SURVEY_STATUSES)[number];

export const SURVEY_QUESTION_TYPES = ['single_choice', 'multiple_choice'] as const;

export type SurveyQuestionTypeValue = (typeof SURVEY_QUESTION_TYPES)[number];
