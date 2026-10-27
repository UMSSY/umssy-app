import {
  SurveyQuestionType,
  SurveyStatus,
  type SurveyQuestionTypeValue,
  type SurveyStatusValue,
} from '../types/survey.enum.js';

export function toSurveyStatusValue(title: string): SurveyStatusValue {
  return title === SurveyStatus.PUBLISHED
    ? SurveyStatus.PUBLISHED
    : SurveyStatus.DRAFT;
}

export function toSurveyQuestionTypeValue(
  title: string,
): SurveyQuestionTypeValue {
  return title === SurveyQuestionType.MULTIPLE_CHOICE
    ? SurveyQuestionType.MULTIPLE_CHOICE
    : SurveyQuestionType.SINGLE_CHOICE;
}
