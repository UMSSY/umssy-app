import type { SurveyQuestionType } from './survey.enum.js';

export interface FormalSurveyQuestionDefinition {
  readonly statement: string;
  readonly type: SurveyQuestionType;
  readonly options: readonly string[];
}

export interface FormalSurveySchedule {
  readonly opensAt: Date;
  readonly closesAt: Date;
  readonly closingSoonNotifiedAt: Date | null;
  readonly closedNotifiedAt: Date | null;
}

export interface FormalSurveyDefinition {
  readonly keySuffix: string;
  readonly title: string;
  readonly description: string;
  readonly questionCount: number;
  readonly computeSchedule: (anchor: Date) => FormalSurveySchedule;
  readonly questions: readonly FormalSurveyQuestionDefinition[];
}
