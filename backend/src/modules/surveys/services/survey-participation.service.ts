import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { UsersService } from '../../users/services/users.service.js';
import {
  SURVEY_ANSWER_FRONTEND_PATH,
  SURVEY_REMINDER_GROUP_KEY_PREFIX,
  SURVEY_REMINDER_MAIL_TEXTS,
} from '../constants/survey-participation.constants.js';
import {
  SurveyNotFoundException,
  SurveyReminderDeliveryFailedException,
  SurveyReminderNotAllowedException,
  SurveyWithoutPendingRespondentsException,
} from '../exceptions/index.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import type { SurveyParticipationResponse } from '../responses/survey-participation.response.js';
import type { SurveyReminderResponse } from '../responses/survey-reminder.response.js';
import type { SurveyParticipationTarget } from '../types/survey-participation-target.type.js';
import {
  buildSurveyFrontendUrl,
  formatSurveyClosureDate,
} from '../utils/survey-frontend-url.js';
import {
  buildSurveyAudienceFilter,
  buildSurveyAudienceLabel,
  computeResponseRate,
  isSurveyOpenForReminders,
} from '../utils/survey-participation.js';

@Injectable()
export class SurveyParticipationService {
  private readonly logger = new Logger(SurveyParticipationService.name);

  constructor(
    private readonly surveysRepository: SurveysRepository,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getParticipation(
    surveyId: string,
    now: Date = new Date(),
  ): Promise<SurveyParticipationResponse> {
    const target = await this.findTarget(surveyId);
    const filter = buildSurveyAudienceFilter(target);
    const [respondedUserIds, totalEligible] = await Promise.all([
      this.surveysRepository.findRespondedUserIds(surveyId),
      this.usersService.countAudienceUsers({
        roles: filter.roles,
        careerId: filter.careerId ?? undefined,
        graduationYear: filter.graduationYear ?? undefined,
      }),
    ]);
    const respondedCount = respondedUserIds.length;
    const eligibleCount = Math.max(totalEligible, respondedCount);
    const pendingCount = Math.max(eligibleCount - respondedCount, 0);

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

    const filter = buildSurveyAudienceFilter(target);
    const respondedUserIds =
      await this.surveysRepository.findRespondedUserIds(surveyId);

    const recipients = await this.usersService.findAudienceRecipients({
      roles: filter.roles,
      careerId: filter.careerId ?? undefined,
      graduationYear: filter.graduationYear ?? undefined,
      excludedUserIds: respondedUserIds,
    });
    if (recipients.length === 0)
      throw new SurveyWithoutPendingRespondentsException();

    const actionUrl = buildSurveyFrontendUrl(
      `${SURVEY_ANSWER_FRONTEND_PATH}/${target.id}`,
    );
    const closesAtFormatted = target.closesAt
      ? formatSurveyClosureDate(target.closesAt)
      : SURVEY_REMINDER_MAIL_TEXTS.withoutClosingDate;

    let emailsDelivered = 0;
    let emailsFailed = 0;
    let pushStatus: SurveyReminderResponse['pushStatus'] = 'skipped';

    try {
      const notifyResult = await this.notificationsService.notify({
        recipientIds: recipients.map((r) => r.id),
        actorId,
        type: NotificationType.SURVEY_REMINDER,
        payload: {
          surveyTitle: target.title,
          closesAtFormatted,
        },
        actionUrl,
        groupKey: `${SURVEY_REMINDER_GROUP_KEY_PREFIX}:${target.id}`,
      });

      emailsDelivered =
        notifyResult.emailsDelivered ??
        (notifyResult.emailStatus === 'sent' ? recipients.length : 0);
      emailsFailed =
        notifyResult.emailsFailed ??
        (notifyResult.emailStatus === 'failed' ? recipients.length : 0);
      pushStatus = notifyResult.pushStatus;

      if (
        emailsDelivered === 0 &&
        recipients.length > 0 &&
        notifyResult.emailStatus === 'failed'
      ) {
        throw new SurveyReminderDeliveryFailedException();
      }
    } catch (error) {
      if (error instanceof SurveyReminderDeliveryFailedException) throw error;
      this.logger.error(
        `Error notificando recordatorio de la encuesta ${target.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new SurveyReminderDeliveryFailedException();
    }

    await this.surveysRepository.updateLastReminderSent(surveyId, now);

    return {
      surveyId,
      pendingCount: recipients.length,
      emailsDelivered,
      emailsFailed,
      pushStatus,
      sentAt: now.toISOString(),
    };
  }

  private async findTarget(
    surveyId: string,
  ): Promise<SurveyParticipationTarget> {
    const target =
      await this.surveysRepository.findParticipationTarget(surveyId);
    if (!target) throw new SurveyNotFoundException();
    return target;
  }
}
