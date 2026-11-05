import type { SurveyTrendDirection } from '../responses/survey-statistics.response.js';
import type { SurveyStatisticsRecord } from './survey-record.type.js';

export interface TrendOption {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface TrendComparison {
  period: string;
  percentageByOption: ReadonlyMap<string, number>;
}

export interface TrendInput {
  options: readonly TrendOption[];
  totalSelections: number;
  isMultipleChoice: boolean;
  comparison?: TrendComparison;
}

export interface TrendChange {
  direction: SurveyTrendDirection;
  sentence: string;
}

export type AcademicSemester = 'I' | 'II';

export interface ParsedSemester {
  semester: AcademicSemester;
  year: number;
}

export interface PreviousStatistics {
  period: string;
  record: SurveyStatisticsRecord;
}

export interface StatisticsContext {
  period?: string | null;
  previous?: PreviousStatistics;
}
