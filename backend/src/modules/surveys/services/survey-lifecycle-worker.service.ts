import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { SURVEY_ALERT_CONFIG_DEFAULTS } from '../constants/survey-alert-config.constants.js';
import {
  SURVEY_CLOSING_SOON_WINDOW_MS,
  SURVEY_LIFECYCLE_CHECK_INTERVAL_MS,
  SURVEY_LIFECYCLE_GROUP_KEY_PREFIX,
  SURVEY_STATISTICS_FRONTEND_PATH,
} from '../constants/survey-lifecycle.constants.js';
import { SURVEY_WITHOUT_CLOSING_DATE_TEXT } from '../constants/survey-participation.constants.js';
import {
  surveyClosedNotification,
  surveyClosingSoonNotification,
  surveyVariationAlertNotification,
} from '../notification/survey-notifications.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import {
  formatSurveyClosureDate,
} from '../utils/survey-frontend-url.js';
import { toQuestionIds } from '../utils/to-question-ids.js';
import { SurveyVariationEvaluatorService } from './survey-variation-evaluator.service.js';

@Injectable()
export class SurveyLifecycleWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SurveyLifecycleWorkerService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    private readonly surveysRepository: SurveysRepository,
    private readonly variationEvaluator: SurveyVariationEvaluatorService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => {
      void this.tick();
    }, SURVEY_LIFECYCLE_CHECK_INTERVAL_MS);
    if (typeof this.timer.unref === 'function') this.timer.unref();
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(now: Date = new Date()) {
    if (this.running) return;
    this.running = true;
    try {
      await this.processClosingSoonSurveys(now);
      await this.processClosedSurveys(now);
    } catch (error) {
      this.logger.error(
        'Error procesando el ciclo de vida de encuestas',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }

  async processClosingSoonSurveys(now: Date = new Date()) {
    const surveys = await this.surveysRepository.findSurveysClosingSoon(
      new Date(now.getTime() + SURVEY_CLOSING_SOON_WINDOW_MS),
      now,
    );

    for (const survey of surveys) {
      try {
        if (survey.createdBy) {
          await this.notificationsService.notify({
            recipientIds: [survey.createdBy.id],
            ...surveyClosingSoonNotification({
              surveyTitle: survey.title,
              closesAtFormatted: this.formatClosesAt(survey.closesAt),
              responsesCount: survey._count.responses,
            }),
            actionUrl: this.statisticsUrl(survey.id),
            groupKey: this.groupKey('closing-soon', survey.id),
          });
        }
        await this.surveysRepository.markClosingSoonNotified(survey.id, now);
      } catch (err) {
        this.logger.error(
          `Error notificando cierre próximo de encuesta ${survey.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }

  async processClosedSurveys(now: Date = new Date()) {
    const surveys =
      await this.surveysRepository.findSurveysExpiredForClosure(now);

    for (const survey of surveys) {
      try {
        if (survey.createdBy) {
          await this.notificationsService.notify({
            recipientIds: [survey.createdBy.id],
            ...surveyClosedNotification({
              surveyTitle: survey.title,
              closesAtFormatted: this.formatClosesAt(survey.closesAt),
              responsesCount: survey._count.responses,
            }),
            actionUrl: this.statisticsUrl(survey.id),
            groupKey: this.groupKey('closed', survey.id),
          });
        }

        await this.surveysRepository.markClosedNotified(survey.id, now);

        const isAlertEnabled =
          survey.alertConfig?.isEnabled ?? SURVEY_ALERT_CONFIG_DEFAULTS.enabled;
        if (!isAlertEnabled) continue;

        const evalResult = await this.variationEvaluator.evaluateSurvey(
          survey.id,
          {
            closesAt: survey.closesAt,
            threshold: survey.alertConfig?.threshold,
            questionIds: toQuestionIds(survey.alertConfig?.questionIds),
          },
        );

        if (evalResult.hasShifts && survey.createdBy) {
          await this.notificationsService.notify({
            recipientIds: [survey.createdBy.id],
            ...surveyVariationAlertNotification({
              surveyTitle: survey.title,
              threshold:
                survey.alertConfig?.threshold ??
                SURVEY_ALERT_CONFIG_DEFAULTS.threshold,
              summaryText: evalResult.summaryText,
            }),
            actionUrl: this.statisticsUrl(survey.id),
            groupKey: this.groupKey('variation', survey.id),
          });
        }
      } catch (err) {
        this.logger.error(
          `Error procesando cierre de encuesta ${survey.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }

  private formatClosesAt(closesAt: Date | null): string {
    return closesAt
      ? formatSurveyClosureDate(closesAt)
      : SURVEY_WITHOUT_CLOSING_DATE_TEXT;
  }

  private statisticsUrl(surveyId: string): string {
    return `${SURVEY_STATISTICS_FRONTEND_PATH}/${surveyId}`;
  }

  private groupKey(event: string, surveyId: string): string {
    return `${SURVEY_LIFECYCLE_GROUP_KEY_PREFIX}:${event}:${surveyId}`;
  }
}
