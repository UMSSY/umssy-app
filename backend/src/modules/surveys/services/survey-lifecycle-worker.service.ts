import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DAY_MS } from '../../../common/constants/date-time.constants.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import { SurveyVariationEvaluatorService } from './survey-variation-evaluator.service.js';
import {
  buildSurveyFrontendUrl,
  formatSurveyClosureDate,
} from '../utils/survey-frontend-url.js';

const THREE_DAYS_MS = 3 * DAY_MS;
const CHECK_INTERVAL_MS = 30_000;

function toQuestionIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === 'string');
}

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
    }, CHECK_INTERVAL_MS);
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
    const thresholdDate = new Date(now.getTime() + THREE_DAYS_MS);
    const surveys = await this.surveysRepository.findSurveysClosingSoon(
      thresholdDate,
      now,
    );

    for (const survey of surveys) {
      try {
        if (survey.createdById) {
          const closesAtFormatted = survey.closesAt
            ? formatSurveyClosureDate(survey.closesAt)
            : '';
          const responsesCount = String(survey._count.responses);
          const actionUrl = buildSurveyFrontendUrl(
            `/backoffice/surveys/statistics/${survey.id}`,
          );

          await this.notificationsService.notify({
            recipientIds: [survey.createdById],
            type: NotificationType.SURVEY_CLOSING_SOON,
            payload: {
              surveyTitle: survey.title,
              closesAtFormatted,
              responsesCount,
            },
            actionUrl,
            groupKey: `survey-closing-soon:${survey.id}`,
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
        if (survey.createdById) {
          const closesAtFormatted = survey.closesAt
            ? formatSurveyClosureDate(survey.closesAt)
            : '';
          const responsesCount = String(survey._count.responses);
          const actionUrl = buildSurveyFrontendUrl(
            `/backoffice/surveys/statistics/${survey.id}`,
          );

          await this.notificationsService.notify({
            recipientIds: [survey.createdById],
            type: NotificationType.SURVEY_CLOSED,
            payload: {
              surveyTitle: survey.title,
              closesAtFormatted,
              responsesCount,
            },
            actionUrl,
            groupKey: `survey-closed:${survey.id}`,
          });
        }

        await this.surveysRepository.markClosedNotified(survey.id, now);

        const isAlertEnabled = survey.alertConfig?.isEnabled ?? true;
        if (isAlertEnabled) {
          const evalResult = await this.variationEvaluator.evaluateSurvey(
            survey.id,
            {
              academicPeriod: survey.academicPeriod,
              closesAt: survey.closesAt,
              threshold: survey.alertConfig?.threshold,
              questionIds: toQuestionIds(survey.alertConfig?.questionIds),
            },
          );

          if (evalResult.hasShifts && survey.createdById) {
            const actionUrl = buildSurveyFrontendUrl(
              `/backoffice/surveys/statistics/${survey.id}`,
            );
            await this.notificationsService.notify({
              recipientIds: [survey.createdById],
              type: NotificationType.SURVEY_VARIATION_ALERT,
              payload: {
                surveyTitle: survey.title,
                summaryText: evalResult.summaryText,
                shiftsContent: evalResult.summaryText,
                threshold: String(survey.alertConfig?.threshold ?? 10),
              },
              actionUrl,
              groupKey: `survey-variation-alert:${survey.id}`,
            });
          }
        }
      } catch (err) {
        this.logger.error(
          `Error procesando cierre de encuesta ${survey.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }
}
