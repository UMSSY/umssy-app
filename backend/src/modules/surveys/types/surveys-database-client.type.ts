import type { CreateSurveyData } from './create-survey-data.type.js';
import type {
  SurveyCreatedRecord,
  SurveySummaryRecord,
} from './survey-record.type.js';
import type { SurveyQuestionType } from './survey.enum.js';

type SurveyRow = Omit<CreateSurveyData, 'questions'>;

export interface SurveyQuestionRow {
  id: string;
  surveyId: string;
  position: number;
  statement: string;
  type: SurveyQuestionType;
  isRequired: boolean;
}

export interface SurveyQuestionOptionRow {
  questionId: string;
  position: number;
  label: string;
}

export interface SurveysTransactionClient {
  survey: {
    create(args: {
      data: SurveyRow;
      select: object;
    }): Promise<SurveyCreatedRecord>;
  };
  surveyQuestion: {
    createMany(args: { data: SurveyQuestionRow[] }): Promise<unknown>;
  };
  surveyQuestionOption: {
    createMany(args: { data: SurveyQuestionOptionRow[] }): Promise<unknown>;
  };
}

export interface SurveysDatabaseClient {
  survey: {
    findFirst(args: object): Promise<{ id: string } | null>;
    findMany(args: object): Promise<SurveySummaryRecord[]>;
  };
  $transaction<T>(
    operation: (tx: SurveysTransactionClient) => Promise<T>,
  ): Promise<T>;
}
