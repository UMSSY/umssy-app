import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import type { FindApplicationsQueryDto } from '../requests/find-applications.request.js';
import {
  ApplicationStatus,
  type ApplicationItemResponse,
} from '../types/applications.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';
import { ApplicationContactRestrictedException } from '../exceptions/application-contact-restricted.exception.js';
import type { ApplicationContactResponse } from '../types/application-contact.types.js';
import { ApplicationMapper } from '../mappers/application.mapper.js';
import { JobRecommendationsService } from '../../matching/services/job-recommendations.service.js';
import { StateChangedDto } from '../notifications/state-changed.dto.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';

const CONTACTABLE_STATUSES: readonly string[] = [
  ApplicationStatus.IN_REVIEW,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.ACCEPTED,
];

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

    const statuses = [
      ApplicationStatus.IN_REVIEW,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
    ];

    const collator = new Intl.Collator('es', { sensitivity: 'base' });
    const direction = query.sortOrder === 'asc' ? 1 : -1;

    responses.sort((a, b) => {
      let comparison = 0;

      switch (query.sortBy) {
        case 'vacancy':
          comparison =
            collator.compare(a.vacancyTitle, b.vacancyTitle) * direction;
          break;
        case 'company':
          comparison =
            collator.compare(a.companyName, b.companyName) * direction;
          break;
        case 'affinity':
          comparison =
            (a.affinityPercentage - b.affinityPercentage) * direction;
          break;
        case 'status': {
          const aIndex = statuses.indexOf(a.status as ApplicationStatus);
          const bIndex = statuses.indexOf(b.status as ApplicationStatus);
          comparison =
            ((aIndex === -1 ? statuses.length : aIndex) -
              (bIndex === -1 ? statuses.length : bIndex)) *
            direction;
          break;
        }
        case 'date':
          comparison =
            (Date.parse(a.appliedDate) - Date.parse(b.appliedDate)) *
            direction;
          break;
        default:
          comparison =
            Date.parse(b.appliedDate) - Date.parse(a.appliedDate);
      }

      if (comparison !== 0) return comparison;

      const dateDifference =
        Date.parse(b.appliedDate) - Date.parse(a.appliedDate);

      if (dateDifference !== 0) return dateDifference;

      const titleDifference = collator.compare(
        a.vacancyTitle,
        b.vacancyTitle,
      );

      return titleDifference || a.id.localeCompare(b.id);
    });

    return responses;
  }

  async reactivateApplication(id: string, userId: string): Promise<void> {
    const application = await this.repository.findById(id);
    if (!application) throw new ApplicationNotFoundException();
    if (application.userId !== userId)
      throw new ApplicationForbiddenException();

    const result = await this.repository.reactivateApplication(
      id,
      userId,
      new Date(),
    );

    if (result.count !== 1) {
      throw new ConflictException(
        'La postulación no puede reactivarse en su estado actual o la vacante ya no está disponible.',
      );
    }
  }

  async getApplicationContact(
    id: string,
    userId: string,
  ): Promise<ApplicationContactResponse> {
    const application = await this.repository.findContactContext(id);
    if (!application || application.userId !== userId)
      throw new ApplicationNotFoundException();
    if (!CONTACTABLE_STATUSES.includes(application.status.title))
      throw new ApplicationContactRestrictedException();
    return this.mapper.toContactResponse(application);
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