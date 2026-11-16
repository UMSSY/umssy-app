import { Injectable, Logger } from '@nestjs/common';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { MailService } from '../../mail/services/mail.service.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { NotifyResult } from '../../notifications/types/notify-result.type.js';
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
import type { SurveyReminderDelivery } from '../types/survey-reminder-delivery.type.js';
import type { SurveyReminderRecipient } from '../types/survey-reminder-recipient.type.js';
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
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getParticipation(
    surveyId: string,
    now: Date = new Date(),
  ): Promise<SurveyParticipationResponse> {
    const target = await this.findTarget(surveyId);
    const filter = buildSurveyAudienceFilter(target);
    const [eligibleCount, respondedCount] = await Promise.all([
      this.surveysRepository.countEligibleRespondents(filter),
      this.surveysRepository.countEligibleRespondents(filter, true),
    ]);
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

    const recipients = await this.surveysRepository.findPendingRecipients(
      buildSurveyAudienceFilter(target),
    );
    if (recipients.length === 0)
      throw new SurveyWithoutPendingRespondentsException();

    const actionUrl = buildSurveyFrontendUrl(
      `${SURVEY_ANSWER_FRONTEND_PATH}/${target.id}`,
    );
    const emails = await this.sendReminderEmails(target, recipients, actionUrl);
    if (emails.delivered === 0) throw new SurveyReminderDeliveryFailedException();

    const pushStatus = await this.dispatchReminderPush(
      target,
      recipients,
      actorId,
      actionUrl,
    );
    await this.surveysRepository.updateLastReminderSent(surveyId, now);

    return {
      surveyId,
      pendingCount: recipients.length,
      emailsDelivered: emails.delivered,
      emailsFailed: emails.failed,
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

  private async sendReminderEmails(
    target: SurveyParticipationTarget,
    recipients: SurveyReminderRecipient[],
    actionUrl: string,
  ): Promise<SurveyReminderDelivery> {
    const mjml = await loadMailTemplate('survey-reminder');
    const closesAtFormatted = target.closesAt
      ? formatSurveyClosureDate(target.closesAt)
      : SURVEY_REMINDER_MAIL_TEXTS.withoutClosingDate;
    const delivery: SurveyReminderDelivery = { delivered: 0, failed: 0 };

    for (const recipient of recipients) {
      const recipientName =
        `${recipient.firstName} ${recipient.lastName}`.trim() ||
        SURVEY_REMINDER_MAIL_TEXTS.recipientFallback;
      try {
        await this.mailService.send({
          to: recipient.email,
          subject: SURVEY_REMINDER_MAIL_TEXTS.subject(target.title),
          text: SURVEY_REMINDER_MAIL_TEXTS.body(
            recipientName,
            target.title,
            closesAtFormatted,
            actionUrl,
          ),
          mjml,
          values: {
            recipientName,
            surveyTitle: target.title,
            closesAtFormatted,
            actionUrl,
          },
        });
        delivery.delivered++;
      } catch (error) {
        delivery.failed++;
        this.logger.error(
          `Error enviando recordatorio de la encuesta ${target.id} al usuario ${recipient.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
    return delivery;
  }

  private async dispatchReminderPush(
    target: SurveyParticipationTarget,
    recipients: SurveyReminderRecipient[],
    actorId: string,
    actionUrl: string,
  ): Promise<NotifyResult['pushStatus']> {
    try {
      const result = await this.notificationsService.notify({
        recipientIds: recipients.map((recipient) => recipient.id),
        actorId,
        type: NotificationType.SURVEY_REMINDER,
        payload: { surveyTitle: target.title },
        actionUrl,
        groupKey: `${SURVEY_REMINDER_GROUP_KEY_PREFIX}:${target.id}`,
      });
      return result.pushStatus;
    } catch (error) {
      this.logger.error(
        `Error enviando notificaciones push del recordatorio de la encuesta ${target.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      return 'failed';
    }
  }
}
