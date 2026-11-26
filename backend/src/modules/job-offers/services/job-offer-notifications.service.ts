import { Injectable, Logger } from '@nestjs/common';
import { JobAlertRecipientsService } from '../../matching/services/job-alert-recipients.service.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { jobOfferPublishedPayloadSchema } from '../notification/job-offer-published-payload.schema.js';
import { JobOfferMatchRepository } from '../repositories/job-offer-match.repository.js';

const JOB_OFFER_DETAIL_PATH = '/vacancies';
const JOB_OFFER_PUBLISHED_GROUP_PREFIX = 'job-offer-published';

@Injectable()
export class JobOfferNotificationsService {
  private readonly logger = new Logger(JobOfferNotificationsService.name);

  constructor(
    private readonly matchSource: JobOfferMatchRepository,
    private readonly recipients: JobAlertRecipientsService,
    private readonly notifications: NotificationsService,
  ) {}

  async notifyPublished(jobOfferId: string): Promise<void> {
    try {
      const vacancy = await this.matchSource.findPublishedById(
        jobOfferId,
        new Date(),
      );
      if (!vacancy) return;

      const recipientIds = await this.recipients.resolve(vacancy);
      if (recipientIds.length === 0) return;

      await this.notifications.notify({
        recipientIds,
        type: NotificationType.JOB_OFFER_PUBLISHED,
        payload: jobOfferPublishedPayloadSchema.parse({
          jobTitle: vacancy.title,
          companyName: vacancy.company.title,
        }),
        actionUrl: `${JOB_OFFER_DETAIL_PATH}/${vacancy.id}`,
        groupKey: `${JOB_OFFER_PUBLISHED_GROUP_PREFIX}:${vacancy.id}`,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo notificar la vacante ${jobOfferId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
