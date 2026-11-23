import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { mentorSlotOfferedPayloadSchema } from '../notification/mentor-slot-offered-payload.schema.js';
import { MentorOffersRepository } from '../repositories/mentor-offers.repository.js';
import { MentorOfferNotificationsService } from '../services/mentor-offer-notifications.service.js';

const OFFER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const EXPIRES_AT = new Date('2026-11-21T14:30:00.000Z');

describe('notificaciones de ofertas de mentoría', () => {
  it('valida UUID, fecha ISO y rechaza campos desconocidos', () => {
    expect(
      mentorSlotOfferedPayloadSchema.parse({
        offerId: OFFER_ID,
        expiresAt: EXPIRES_AT.toISOString(),
      }),
    ).toEqual({ offerId: OFFER_ID, expiresAt: EXPIRES_AT.toISOString() });
    expect(() =>
      mentorSlotOfferedPayloadSchema.parse({
        offerId: 'not-a-uuid',
        expiresAt: 'tomorrow',
      }),
    ).toThrow();
  });

  it('envía al usuario correcto mediante el contrato central', async () => {
    const notify = vi.fn().mockResolvedValue({
      inAppCount: 1,
      pushStatus: 'sent',
      emailStatus: 'skipped',
      deliveries: [],
    });
    const service = new MentorOfferNotificationsService(
      {
        findNotifiableOffers: vi
          .fn()
          .mockResolvedValue([
            { id: OFFER_ID, userId: USER_ID, expiresAt: EXPIRES_AT },
          ]),
      } as unknown as MentorOffersRepository,
      {
        hasGroupedNotification: vi.fn().mockResolvedValue(false),
        notify,
      } as unknown as NotificationsService,
    );

    await service.processPending();

    expect(notify).toHaveBeenCalledWith({
      recipientIds: [USER_ID],
      type: NotificationType.MENTOR_SLOT_OFFERED,
      payload: { offerId: OFFER_ID, expiresAt: EXPIRES_AT.toISOString() },
      actionUrl: '/mentors/participation',
      groupKey: `mentor-slot-offer:${OFFER_ID}`,
    });
  });

  it('no intenta notificar ofertas vencidas o confirmadas ausentes de la consulta', async () => {
    const notify = vi.fn();
    const service = new MentorOfferNotificationsService(
      {
        findNotifiableOffers: vi.fn().mockResolvedValue([]),
      } as unknown as MentorOffersRepository,
      { notify } as unknown as NotificationsService,
    );

    await service.processPending();

    expect(notify).not.toHaveBeenCalled();
  });

  it('no vuelve a llamar notify en otro tick ni tras recrear el servicio', async () => {
    let isPersisted = false;
    const notify = vi.fn(async () => {
      isPersisted = true;
      return {
        inAppCount: 1,
        pushStatus: 'skipped' as const,
        emailStatus: 'sent' as const,
        deliveries: [],
      };
    });
    const hasGroupedNotification = vi.fn(async () => isPersisted);
    const repository = {
      findNotifiableOffers: vi
        .fn()
        .mockResolvedValue([
          { id: OFFER_ID, userId: USER_ID, expiresAt: EXPIRES_AT },
        ]),
    } as unknown as MentorOffersRepository;
    const notifications = {
      hasGroupedNotification,
      notify,
    } as unknown as NotificationsService;

    await new MentorOfferNotificationsService(
      repository,
      notifications,
    ).processPending();
    await new MentorOfferNotificationsService(
      repository,
      notifications,
    ).processPending();

    expect(hasGroupedNotification).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenCalledOnce();
  });

  it('no confunde canales omitidos con errores y registra fallos externos', async () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const repository = {
      findNotifiableOffers: vi
        .fn()
        .mockResolvedValue([
          { id: OFFER_ID, userId: USER_ID, expiresAt: EXPIRES_AT },
        ]),
    } as unknown as MentorOffersRepository;
    const hasGroupedNotification = vi.fn().mockResolvedValue(false);
    const notify = vi
      .fn()
      .mockResolvedValueOnce({
        inAppCount: 1,
        pushStatus: 'skipped',
        emailStatus: 'skipped',
        deliveries: [],
      })
      .mockResolvedValueOnce({
        inAppCount: 1,
        pushStatus: 'failed',
        emailStatus: 'skipped',
        deliveries: [],
      });
    const service = new MentorOfferNotificationsService(repository, {
      hasGroupedNotification,
      notify,
    } as unknown as NotificationsService);

    await service.processPending();
    expect(warn).not.toHaveBeenCalled();
    await service.processPending();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('consulta únicamente ofertas vigentes aún pendientes de confirmación', async () => {
    const queryRaw = vi.fn(async (strings: TemplateStringsArray) => {
      const sql = strings.join(' ');
      expect(sql).toContain("status = 'OFFERED'");
      expect(sql).toContain('expires_at > clock_timestamp()');
      return [];
    });
    const repository = new MentorOffersRepository({
      $queryRaw: queryRaw,
    } as unknown as PrismaService);

    await expect(repository.findNotifiableOffers()).resolves.toEqual([]);
    expect(queryRaw).toHaveBeenCalledOnce();
  });

  it('registra un fallo central y continúa con la siguiente oferta', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const notify = vi
      .fn()
      .mockRejectedValueOnce(new Error('notifications unavailable'))
      .mockResolvedValueOnce({
        inAppCount: 1,
        pushStatus: 'skipped',
        emailStatus: 'sent',
        deliveries: [],
      });
    const service = new MentorOfferNotificationsService(
      {
        findNotifiableOffers: vi.fn().mockResolvedValue([
          { id: OFFER_ID, userId: USER_ID, expiresAt: EXPIRES_AT },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            userId: USER_ID,
            expiresAt: EXPIRES_AT,
          },
        ]),
      } as unknown as MentorOffersRepository,
      {
        hasGroupedNotification: vi.fn().mockResolvedValue(false),
        notify,
      } as unknown as NotificationsService,
    );

    await expect(service.processPending()).resolves.toBeUndefined();
    expect(notify).toHaveBeenCalledTimes(2);
  });
});
