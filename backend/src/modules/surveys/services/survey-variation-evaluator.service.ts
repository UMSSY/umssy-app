import { Injectable } from '@nestjs/common';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import {
  getPreviousSemester,
  getSemesterRange,
} from '../utils/academic-semester.js';
import { getAcademicPeriod } from '../../reports/utils/academic-period.js';
import type { SurveyVariationEvaluationOptions } from '../types/survey-variation-evaluation-options.type.js';
import type { SurveyVariationEvaluationResult } from '../types/survey-variation-evaluation-result.type.js';
import type { VariationShift } from '../types/variation-shift.type.js';
import { distributePercentages } from '../utils/distribute-percentages.js';

@Injectable()
export class SurveyVariationEvaluatorService {
  constructor(private readonly surveysRepository: SurveysRepository) {}

  async evaluateSurvey(
    surveyId: string,
    options?: SurveyVariationEvaluationOptions,
  ): Promise<SurveyVariationEvaluationResult> {
    const config = await this.surveysRepository.findAlertConfig(surveyId);
    const isEnabled = config ? config.isEnabled : true;
    if (!isEnabled) {
      return this.emptyResult('', '');
    }

    const threshold = options?.threshold ?? config?.threshold ?? 10;
    const monitoredQuestionIds =
      options?.questionIds ?? (config?.questionIds as string[] | null) ?? null;

    const currentPeriod =
      (options?.closesAt
        ? getAcademicPeriod(options.closesAt.toISOString())
        : undefined) ??
      getAcademicPeriod(new Date().toISOString()) ??
      'I-2024';

    const previousPeriod = getPreviousSemester(currentPeriod);
    if (!previousPeriod) {
      return this.emptyResult(currentPeriod, '');
    }

    const currentRange = getSemesterRange(currentPeriod);
    const previousRange = getSemesterRange(previousPeriod);

    const currentRecord = await this.surveysRepository.findStatistics(
      surveyId,
      currentRange,
    );
    const previousRecord = await this.surveysRepository.findStatistics(
      surveyId,
      previousRange,
    );

    if (
      !currentRecord ||
      currentRecord._count.responses === 0 ||
      !previousRecord ||
      previousRecord._count.responses === 0
    ) {
      return this.emptyResult(currentPeriod, previousPeriod);
    }

    const shifts: VariationShift[] = [];

    const questionsToEvaluate = currentRecord.questions.filter(
      (q) =>
        !monitoredQuestionIds ||
        monitoredQuestionIds.length === 0 ||
        monitoredQuestionIds.includes(q.id),
    );

    for (const question of questionsToEvaluate) {
      const prevQuestion = previousRecord.questions.find(
        (pq) => pq.id === question.id || pq.statement === question.statement,
      );
      if (!prevQuestion) continue;

      const currentCounts = question.options.map((opt) => opt._count.answers);
      const currentPercentages = distributePercentages(currentCounts);

      const prevCounts = prevQuestion.options.map((opt) => opt._count.answers);
      const prevPercentages = distributePercentages(prevCounts);

      for (let i = 0; i < question.options.length; i++) {
        const option = question.options[i];
        const prevOptIndex = prevQuestion.options.findIndex(
          (po) => po.id === option.id || po.label === option.label,
        );
        if (prevOptIndex === -1) continue;

        const currentPct = currentPercentages[i];
        const prevPct = prevPercentages[prevOptIndex];
        const diff = Number((currentPct - prevPct).toFixed(1));
        const absDiff = Math.abs(diff);

        if (absDiff >= threshold) {
          shifts.push({
            questionId: question.id,
            questionStatement: question.statement,
            optionId: option.id,
            optionLabel: option.label,
            currentPercentage: currentPct,
            previousPercentage: prevPct,
            difference: diff,
            direction: diff > 0 ? 'up' : 'down',
          });
        }
      }
    }

    const hasShifts = shifts.length > 0;
    const summaryText = this.buildSummaryText(
      shifts,
      currentPeriod,
      previousPeriod,
      threshold,
    );

    return {
      hasShifts,
      shifts,
      currentPeriod,
      previousPeriod,
      summaryText,
    };
  }

  private emptyResult(
    currentPeriod: string,
    previousPeriod: string,
  ): SurveyVariationEvaluationResult {
    return {
      hasShifts: false,
      shifts: [],
      currentPeriod,
      previousPeriod,
      summaryText: '',
    };
  }

  private buildSummaryText(
    shifts: VariationShift[],
    currentPeriod: string,
    previousPeriod: string,
    threshold: number,
  ): string {
    if (shifts.length === 0) return '';

    const lines: string[] = [
      `Variaciones detectadas entre ${previousPeriod} y ${currentPeriod} (umbral >= ${threshold} pp):`,
    ];

    let currentQuestion = '';
    for (const shift of shifts) {
      if (shift.questionStatement !== currentQuestion) {
        currentQuestion = shift.questionStatement;
        lines.push(`\nPregunta: «${currentQuestion}»`);
      }
      const sign = shift.difference > 0 ? '+' : '';
      lines.push(
        `  • ${shift.optionLabel}: ${shift.previousPercentage}% -> ${shift.currentPercentage}% (${sign}${shift.difference} pp)`,
      );
    }

    return lines.join('\n');
  }
}
