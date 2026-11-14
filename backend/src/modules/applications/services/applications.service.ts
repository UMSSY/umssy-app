import { Injectable, Logger } from '@nestjs/common';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import type { FindApplicationsQueryDto } from '../requests/find-applications.request.js';
import {
  ApplicationStatus,
  type ApplicationItemResponse,
} from '../types/applications.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';
import { ApplicationMapper } from '../mappers/application.mapper.js';
import { JobRecommendationsService } from '../../matching/services/job-recommendations.service.js';
import { StateChangedDto } from '../notifications/state-changed.dto.js';
import { STATE_CHANGED_TEMPLATE } from '../notifications/state-changed.templates.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly mapper: ApplicationMapper,
    private readonly matching: JobRecommendationsService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async findMyApplications(
    userId: string,
    query: FindApplicationsQueryDto,
  ): Promise<ApplicationItemResponse[]> {
    const records = await this.repository.findByUserId(userId, query);
    if (!records || !records.length) return [];

    const offerIds = records.map(
      (record: any) => record.jobOfferId ?? record.jobOffer?.id,
    );

    let scoresMap = new Map<string, number>();
    try {
      scoresMap = await this.matching.scoresForOffers(userId, offerIds);
    } catch {
      scoresMap = new Map();
    }

    const responses: ApplicationItemResponse[] = records.map((record: any) => {
      const offerId = record.jobOfferId ?? record.jobOffer?.id;
      const score = scoresMap.get(offerId) ?? 0;
      return this.mapper.toResponse(record, score);
    });

    if (query.sortBy === 'affinity') {
      responses.sort(
        (a: ApplicationItemResponse, b: ApplicationItemResponse) =>
          (a.affinityPercentage - b.affinityPercentage) *
          (query.sortOrder === 'asc' ? 1 : -1),
      );
    }

    return responses;
  }

  async withdrawApplication(id: string, userId: string): Promise<void> {
    const application = await this.repository.findById(id);
    if (!application) throw new ApplicationNotFoundException();
    if (application.userId !== userId)
      throw new ApplicationForbiddenException();

    const result = await this.repository.withdraw(
      id,
      userId,
      [ApplicationStatus.IN_REVIEW, ApplicationStatus.INTERVIEW],
      ApplicationStatus.WITHDRAWN,
    );
    if (!result.count) throw new ApplicationNotWithdrawableException();
  }

  public async notifyStateChanged(p: {
    recipientId: string;
    applicationId: string;
    previousStatus: ApplicationStatus;
    newStatus: ApplicationStatus;
    jobTitle: string;
    companyName: string;
  }): Promise<void> {
    if (p.previousStatus === p.newStatus) return;

    try {
      const context = StateChangedDto.parse({
        jobTitle: p.jobTitle,
        companyName: p.companyName,
        newStatus: p.newStatus,
        previousStatus: p.previousStatus,
        actionUrl: `${this.config.getOrThrow('APP_URL')}/postulaciones/${p.applicationId}`,
      });

      await this.withTimeout(
        this.notifications.notify({
          recipientIds: [p.recipientId],
          type: NotificationType.APPLICATION_STATUS_CHANGED,
          payload: {
            vacancyTitle: context.jobTitle,
            companyName: context.companyName,
            newStatus: context.newStatus,
          },
          actionUrl: context.actionUrl,
        }),
        5000,
      );
    } catch (error) {
      console.error('--- ERROR DETALLADO EN NOTIFY STATE CHANGED ---', error);

      this.logger.error(
        `No se pudo notificar el cambio de estado (application=${p.applicationId}, recipient=${p.recipientId})`,
        error instanceof Error ? error.stack : String(error),
      );
      
      if (process.env.NODE_ENV === 'test') {
        if (!(error instanceof Error && error.message.includes('timeout'))) {
          throw error; 
        }
      }
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`notify() timeout (${ms}ms)`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  findRecruitmentApplicationsByUser(userId: string) {
    return this.repository.findRecruitmentApplicationsByUser(userId);
  }

  findRecruitmentApplicants(jobId: string) {
    return this.repository.findRecruitmentApplicants(jobId);
  }

  findRecruitmentApplication(id: string) {
    return this.repository.findRecruitmentApplication(id);
  }

  recordRecruiterDecision(applicationId: string, target: string) {
    return this.repository.recordRecruiterDecision(applicationId, target);
  }
}