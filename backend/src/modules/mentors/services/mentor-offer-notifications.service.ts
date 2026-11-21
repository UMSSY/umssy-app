import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { mentorSlotOfferedPayloadSchema } from '../notification/mentor-slot-offered-payload.schema.js';
import { MentorOffersRepository } from '../repositories/mentor-offers.repository.js';
import type { MentorOfferNotificationCandidate } from '../types/mentor-offer.types.js';

const MENTOR_PARTICIPATION_URL = '/mentors/participation';
const MENTOR_SLOT_OFFER_GROUP_PREFIX = 'mentor-slot-offer';

@Injectable()
export class MentorOfferNotificationsService {
  private readonly logger = new Logger(MentorOfferNotificationsService.name);

  constructor(
    private readonly repository: MentorOffersRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async processPending(): Promise<void> {
    const offers = await this.repository.findNotifiableOffers();
    for (const offer of offers) {
      await this.notifyOffer(offer);
    }
  }

  private async notifyOffer(
    offer: MentorOfferNotificationCandidate,
  ): Promise<void> {
    const groupKey = `${MENTOR_SLOT_OFFER_GROUP_PREFIX}:${offer.id}`;
    const payload = mentorSlotOfferedPayloadSchema.parse({
      offerId: offer.id,
      expiresAt: offer.expiresAt.toISOString(),
    });

    try {
      if (
        await this.notifications.hasGroupedNotification(
          offer.userId,
          NotificationType.MENTOR_SLOT_OFFERED,
          groupKey,
        )
      ) {
        return;
      }

      const result = await this.notifications.notify({
        recipientIds: [offer.userId],
        type: NotificationType.MENTOR_SLOT_OFFERED,
        payload,
        actionUrl: MENTOR_PARTICIPATION_URL,
        groupKey,
      });

      if (result.pushStatus === 'failed' || result.emailStatus === 'failed') {
        this.logger.warn(
          `La oferta ${offer.id} se registró con fallos de entrega externa`,
        );
      }
    } catch (error) {
      this.logger.error(
        `No se pudo notificar la oferta de mentoría ${offer.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
