import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobAlertRecipientsService } from '../../matching/services/job-alert-recipients.service.js';
import type { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { JobOfferMatchRepository } from '../repositories/job-offer-match.repository.js';
import { JobOfferNotificationsService } from '../services/job-offer-notifications.service.js';
import type { JobOfferMatchRecord } from '../types/job-match-record.types.js';

const VACANCY = {
  id: 'offer-1',
  title: 'DevOps Senior',
  company: { title: 'TechBolivia S.R.L.' },
} as unknown as JobOfferMatchRecord;

describe('JobOfferNotificationsService', () => {
  let matchSource: { findPublishedById: ReturnType<typeof vi.fn> };
  let recipients: { resolve: ReturnType<typeof vi.fn> };
  let notifications: { notify: ReturnType<typeof vi.fn> };
  let service: JobOfferNotificationsService;

  beforeEach(() => {
    matchSource = { findPublishedById: vi.fn().mockResolvedValue(VACANCY) };
    recipients = { resolve: vi.fn().mockResolvedValue(['user-1', 'user-2']) };
    notifications = { notify: vi.fn().mockResolvedValue(undefined) };
    service = new JobOfferNotificationsService(
      matchSource as unknown as JobOfferMatchRepository,
      recipients as unknown as JobAlertRecipientsService,
      notifications as unknown as NotificationsService,
    );
  });

  it('notifica a los destinatarios resueltos con el tipo y el payload de la vacante', async () => {
    await service.notifyPublished('offer-1');

    expect(recipients.resolve).toHaveBeenCalledWith(VACANCY);
    expect(notifications.notify).toHaveBeenCalledWith({
      recipientIds: ['user-1', 'user-2'],
      type: NotificationType.JOB_OFFER_PUBLISHED,
      payload: { jobTitle: 'DevOps Senior', companyName: 'TechBolivia S.R.L.' },
      actionUrl: '/vacancies/offer-1',
      groupKey: 'job-offer-published:offer-1',
    });
  });

  it('no notifica cuando la vacante ya no está publicada', async () => {
    matchSource.findPublishedById.mockResolvedValueOnce(null);

    await service.notifyPublished('offer-1');

    expect(recipients.resolve).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('no notifica cuando ninguna persona debe recibir el aviso', async () => {
    recipients.resolve.mockResolvedValueOnce([]);

    await service.notifyPublished('offer-1');

    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it.each([
    ['la resolución de destinatarios', () => recipients.resolve],
    ['el envío', () => notifications.notify],
  ])('no propaga el error de %s', async (_label, target) => {
    target().mockRejectedValueOnce(new Error('fallo'));

    await expect(service.notifyPublished('offer-1')).resolves.toBeUndefined();
  });
});
