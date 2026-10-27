export const SURVEY_STATUSES = ['draft', 'published'] as const;

export type SurveyStatusValue = (typeof SURVEY_STATUSES)[number];

export const SURVEY_DISPLAY_STATUSES = ['draft', 'published', 'closed'] as const;

export type SurveyDisplayStatusValue = (typeof SURVEY_DISPLAY_STATUSES)[number];

export const SURVEY_QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
] as const;

export type SurveyQuestionTypeValue = (typeof SURVEY_QUESTION_TYPES)[number];

export const SurveyStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type SurveyStatus = (typeof SurveyStatus)[keyof typeof SurveyStatus];

export const SurveyQuestionType = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
} as const;

export type SurveyQuestionType =
  (typeof SurveyQuestionType)[keyof typeof SurveyQuestionType];
