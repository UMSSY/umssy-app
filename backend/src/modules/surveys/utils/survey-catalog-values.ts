import {
  SurveyQuestionType,
  SurveyStatus,
  SURVEY_QUESTION_TYPES,
  SURVEY_TARGET_AUDIENCES,
  type SurveyQuestionTypeValue,
  type SurveyStatusValue,
  type SurveyTargetAudienceValue,
} from '../types/survey.enum.js';

export function toSurveyStatusValue(title: string): SurveyStatusValue {
  return title === SurveyStatus.PUBLISHED
    ? SurveyStatus.PUBLISHED
    : SurveyStatus.DRAFT;
}

export function toSurveyQuestionTypeValue(
  title: string,
): SurveyQuestionTypeValue {
  return (
    SURVEY_QUESTION_TYPES.find((value) => value === title) ??
    SurveyQuestionType.SINGLE_CHOICE
  );
}

export function toSurveyTargetAudienceValue(
  targetAudience: { title: string } | null,
): SurveyTargetAudienceValue | null {
  return SURVEY_TARGET_AUDIENCES.find((value) => value === targetAudience?.title) ?? null;
}
