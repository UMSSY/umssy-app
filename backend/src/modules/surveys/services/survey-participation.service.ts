import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import type { NotifyResult } from '../../notifications/types/notify-result.type.js';
import { getAcademicPeriod } from '../../reports/utils/academic-period.js';
import {
  SURVEY_ANSWER_FRONTEND_PATH,
  SURVEY_PUBLISHED_ACTION_URL,
  SURVEY_REMINDER_GROUP_KEY_PREFIX,
  SURVEY_WITHOUT_CLOSING_DATE_TEXT,
} from '../constants/survey-participation.constants.js';
import {
  SurveyNotFoundException,
  SurveyReminderDeliveryFailedException,
  SurveyReminderNotAllowedException,
  SurveyWithoutPendingRespondentsException,
} from '../exceptions/index.js';
import {
  surveyPublishedNotification,
  surveyReminderNotification,
} from '../notification/survey-notifications.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import type { SurveyParticipationResponse } from '../responses/survey-participation.response.js';
import type { SurveyReminderResponse } from '../responses/survey-reminder.response.js';
import type { SurveyParticipationTarget } from '../types/survey-participation-target.type.js';
import { getPreviousSemester } from '../utils/academic-semester.js';
import { buildSurveyPublishedChange } from '../utils/build-survey-published-change.js';
import {
  formatSurveyClosureDate,
} from '../utils/survey-frontend-url.js';
import {
  buildSurveyAudienceFilter,
  buildSurveyAudienceLabel,
  computeResponseRate,
  isSurveyOpenForReminders,
} from '../utils/survey-participation.js';
import { SurveyAudienceService } from './survey-audience.service.js';
import { SurveyVariationEvaluatorService } from './survey-variation-evaluator.service.js';

@Injectable()
export class SurveyParticipationService {
  constructor(
    private readonly surveysRepository: SurveysRepository,
    private readonly surveyAudienceService: SurveyAudienceService,
    private readonly notificationsService: NotificationsService,
    private readonly variationEvaluator: SurveyVariationEvaluatorService,
  ) {}

  async getParticipation(
    surveyId: string,
    now: Date = new Date(),
  ): Promise<SurveyParticipationResponse> {
    const target = await this.findTarget(surveyId);
    const { eligible, pending } = await this.surveyAudienceService.resolve(
      buildSurveyAudienceFilter(target),
    );
    const eligibleCount = eligible.length;
    const pendingCount = pending.length;
    const respondedCount = eligibleCount - pendingCount;

    return {
      surveyId,
      respondedCount,
      eligibleCount,
      pendingCount,
      responseRate: computeResponseRate(respondedCount, eligibleCount),
      audienceLabel: buildSurveyAudienceLabel(target),
      lastReminderSentAt: target.lastReminderSentAt?.toISOString() ?? null,
      canSendReminder:
        pendingCount > 0 && isSurveyOpenForReminders(target, now),
    };
  }

  async sendReminders(
    surveyId: string,
    actorId: string,
    now: Date = new Date(),
  ): Promise<SurveyReminderResponse> {
    const target = await this.findTarget(surveyId);
    if (!isSurveyOpenForReminders(target, now))
      throw new SurveyReminderNotAllowedException();

    const { pending } = await this.surveyAudienceService.resolve(
      buildSurveyAudienceFilter(target),
    );
    if (pending.length === 0)
      throw new SurveyWithoutPendingRespondentsException();

    const result = await this.notificationsService.notify({
      recipientIds: pending.map((recipient) => recipient.id),
      actorId,
      ...surveyReminderNotification({
        surveyTitle: target.title,
        closesAtFormatted: target.closesAt
          ? formatSurveyClosureDate(target.closesAt)
          : SURVEY_WITHOUT_CLOSING_DATE_TEXT,
      }),
      actionUrl: `${SURVEY_ANSWER_FRONTEND_PATH}/${target.id}`,
      groupKey: `${SURVEY_REMINDER_GROUP_KEY_PREFIX}:${target.id}`,
    });

    const emailsDelivered = this.countEmails(result, 'sent');
    if (emailsDelivered === 0 && !this.hasPushDelivery(result))
      throw new SurveyReminderDeliveryFailedException();

    await this.surveysRepository.updateLastReminderSent(surveyId, now);

    return {
      surveyId,
      pendingCount: pending.length,
      emailsDelivered,
      emailsFailed: this.countEmails(result, 'failed'),
      pushStatus: result.pushStatus,
      sentAt: now.toISOString(),
    };
  }

  async notifyPublished(
    surveyId: string,
    actorId?: string,
    now: Date = new Date(),
  ): Promise<NotifyResult | undefined> {
    const target = await this.findTarget(surveyId);
    const currentPeriod = getAcademicPeriod(now.toISOString());
    if (!currentPeriod || target.publishedNotifiedPeriod === currentPeriod)
      return undefined;

    const { eligible } = await this.surveyAudienceService.resolve(
      buildSurveyAudienceFilter(target),
    );
    if (eligible.length === 0) return undefined;

    const claimed = await this.surveysRepository.claimPublishedNotification(
      surveyId,
      currentPeriod,
    );
    if (!claimed) return undefined;

    const { shifts } = await this.variationEvaluator.evaluateSurvey(surveyId, {
      closesAt: now,
    });
    const previousPeriod = getPreviousSemester(currentPeriod) ?? '';

    return this.notificationsService.notify({
      recipientIds: eligible.map((recipient) => recipient.id),
      actorId,
      ...surveyPublishedNotification({
        surveyTitle: target.title,
        previousPeriod,
        currentPeriod,
        change: buildSurveyPublishedChange(
          shifts,
          previousPeriod,
          currentPeriod,
        ),
      }),
      actionUrl: SURVEY_PUBLISHED_ACTION_URL,
    });
  }

  private async findTarget(
    surveyId: string,
  ): Promise<SurveyParticipationTarget> {
    const target =
      await this.surveysRepository.findParticipationTarget(surveyId);
    if (!target) throw new SurveyNotFoundException();
    return target;
  }

  private countEmails(
    result: NotifyResult,
    status: 'sent' | 'failed',
  ): number {
    return result.deliveries.filter(
      (delivery) => delivery.channel === 'email' && delivery.status === status,
    ).length;
  }

  private hasPushDelivery(result: NotifyResult): boolean {
    return result.pushStatus === 'sent' || result.pushStatus === 'partial';
  }
}
