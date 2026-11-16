import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MailService } from '../../mail/services/mail.service.js';
import { buildVariationShiftsMjml } from '../../mail/helpers/build-variation-shifts-mjml.js';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { getAcademicPeriod } from '../../reports/utils/academic-period.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import { SurveyVariationEvaluatorService } from './survey-variation-evaluator.service.js';
import type { SurveyVariationEvaluationResult } from './survey-variation-evaluator.service.js';
import {
  getPreviousSemester,
  getSemesterRange,
} from '../utils/academic-semester.js';
import {
  buildSurveyFrontendUrl,
  formatSurveyClosureDate,
} from '../utils/survey-frontend-url.js';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 30_000;

function toQuestionIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === 'string');
}

interface VariationAlertSurvey {
  id: string;
  title: string;
  alertConfig?: { threshold: number } | null;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
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
    private readonly mailService: MailService,
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
      await this.processSemesterVariations(now);
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
        if (survey.createdBy?.email) {
          const recipientName =
            `${survey.createdBy.firstName} ${survey.createdBy.lastName}`.trim() ||
            'Administrador';
          const closesAtFormatted = survey.closesAt
            ? formatSurveyClosureDate(survey.closesAt)
            : '';
          const responsesCount = String(survey._count.responses);
          const actionUrl = buildSurveyFrontendUrl(
            `/backoffice/surveys/statistics/${survey.id}`,
          );

          const mjml = await loadMailTemplate('survey-closing-soon');
          await this.mailService.send({
            to: survey.createdBy.email,
            subject: `La encuesta «${survey.title}» cierra en 3 días`,
            text: `Hola ${recipientName}, este es un aviso sobre una encuesta que creaste. La encuesta «${survey.title}» cierra el ${closesAtFormatted}. Respuestas hasta ahora: ${responsesCount}. Ver analíticas en: ${actionUrl}`,
            mjml,
            values: {
              recipientName,
              surveyTitle: survey.title,
              closesAtFormatted,
              responsesCount,
              actionUrl,
            },
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
        if (survey.createdBy?.email) {
          const recipientName =
            `${survey.createdBy.firstName} ${survey.createdBy.lastName}`.trim() ||
            'Administrador';
          const closesAtFormatted = survey.closesAt
            ? formatSurveyClosureDate(survey.closesAt)
            : '';
          const responsesCount = String(survey._count.responses);
          const actionUrl = buildSurveyFrontendUrl(
            `/backoffice/surveys/statistics/${survey.id}`,
          );

          const mjml = await loadMailTemplate('survey-closed');
          await this.mailService.send({
            to: survey.createdBy.email,
            subject: `La encuesta «${survey.title}» ya cerró`,
            text: `Hola ${recipientName}, este es un aviso sobre una encuesta que creaste. El periodo de recepción de respuestas para la encuesta «${survey.title}» ha concluido. Cerró el: ${closesAtFormatted}. Respuestas recibidas: ${responsesCount} en total. Ver resultados en: ${actionUrl}`,
            mjml,
            values: {
              recipientName,
              surveyTitle: survey.title,
              closesAtFormatted,
              responsesCount,
              actionUrl,
            },
          });
        }

        await this.surveysRepository.markClosedNotified(survey.id, now);
      } catch (err) {
        this.logger.error(
          `Error procesando cierre de encuesta ${survey.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }

  // Al terminar cada semestre compara ese semestre contra el anterior y avisa una sola vez por encuesta.
  async processSemesterVariations(now: Date = new Date()) {
    const currentPeriod = getAcademicPeriod(now.toISOString());
    const period = currentPeriod ? getPreviousSemester(currentPeriod) : null;
    const range = period ? getSemesterRange(period) : null;
    if (!period || !range) return;

    const surveys =
      await this.surveysRepository.findSurveysPendingVariationEvaluation(
        period,
        range,
      );

    for (const survey of surveys) {
      try {
        const evaluation = await this.variationEvaluator.evaluateSurvey(
          survey.id,
          {
            academicPeriod: period,
            threshold: survey.alertConfig?.threshold,
            questionIds: toQuestionIds(survey.alertConfig?.questionIds),
          },
        );

        if (evaluation.hasShifts && survey.createdBy?.email) {
          await this.sendVariationAlert(survey, evaluation);
        }
        await this.surveysRepository.markVariationEvaluated(survey.id, period);
      } catch (err) {
        this.logger.error(
          `Error evaluando variaciones de la encuesta ${survey.id} en ${period}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }

  private async sendVariationAlert(
    survey: VariationAlertSurvey,
    evaluation: SurveyVariationEvaluationResult,
  ) {
    if (!survey.createdBy?.email) return;

    const recipientName =
      `${survey.createdBy.firstName} ${survey.createdBy.lastName}`.trim() ||
      'Administrador';
    const actionUrl = buildSurveyFrontendUrl(
      `/backoffice/surveys/statistics/${survey.id}`,
    );
    const template = await loadMailTemplate('survey-variation-alert');
    const mjml = template.replace('[[shifts]]', () =>
      buildVariationShiftsMjml(evaluation.shifts),
    );

    await this.mailService.send({
      to: survey.createdBy.email,
      subject: `Alerta de variación significativa en «${survey.title}»`,
      text: `Hola ${recipientName}, detectamos cambios significativos en los resultados de la encuesta «${survey.title}» frente al semestre anterior.\n${evaluation.summaryText}\nVer analíticas en: ${actionUrl}`,
      mjml,
      values: {
        recipientName,
        surveyTitle: survey.title,
        threshold: String(survey.alertConfig?.threshold ?? 10),
        periodsLabel: `Comparación entre ${evaluation.previousPeriod} y ${evaluation.currentPeriod}`,
        actionUrl,
      },
    });
  }
}
