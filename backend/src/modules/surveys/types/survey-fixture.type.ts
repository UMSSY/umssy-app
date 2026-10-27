import type { SurveyQuestionType, SurveyStatus } from './survey.enum.js';

export interface SurveyQuestionFixture {
  statement: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  options: string[];
}

export interface SurveyFixture {
  key: string;
  title: string;
  description: string;
  career: string;
  academicPeriod: string;
  status: SurveyStatus;
  opensAtDays: number | null;
  closesAtDays: number | null;
  createdAtDays: number;
  questions: SurveyQuestionFixture[];
  respondentNumbers: number[];
}
