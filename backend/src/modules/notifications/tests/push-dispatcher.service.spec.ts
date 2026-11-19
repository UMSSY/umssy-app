import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PushDispatcherService } from '../services/push-dispatcher.service.js';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import * as webpush from 'web-push';
import { PUSH_NOTIFICATION_ICON } from '../constants/push-notification.constants.js';
import type { PushNotificationPayload } from '../types/push-notification-payload.type.js';

const webpushMock = vi.hoisted(() => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock('web-push', () => webpushMock);

const androidSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/android',
  p256dh: 'x',
  auth: 'y',
  userId: 'user-1',
  userAgent: 'Android',
};

const iphoneSubscription = {
  endpoint: 'https://web.push.apple.com/iphone',
  p256dh: 'x',
  auth: 'y',
  userId: 'user-1',
  userAgent: 'iPhone',
};

const desktopSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/desktop',
  p256dh: 'x',
  auth: 'y',
  userId: 'user-1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
};

function createPushError(message: string, statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

describe('PushDispatcherService', () => {
  let service: PushDispatcherService;
  let mockPushRepo: {
    findManyByUserIds: ReturnType<typeof vi.fn>;
    deleteByEndpointAndUserId: ReturnType<typeof vi.fn>;
  };
  let mockConfigService: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockPushRepo = {
      findManyByUserIds: vi.fn(),
      deleteByEndpointAndUserId: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'VAPID_SUBJECT') return 'mailto:test@umssy.com';
        if (key === 'VAPID_PUBLIC_KEY') return 'pub';
        if (key === 'VAPID_PRIVATE_KEY') return 'priv';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushDispatcherService,
        { provide: PushSubscriptionsRepository, useValue: mockPushRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PushDispatcherService>(PushDispatcherService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('throws if VAPID keys are missing', () => {
      mockConfigService.get.mockReturnValue(undefined);
      
      expect(() => service.onModuleInit()).toThrow(
        'VAPID_SUBJECT, VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be configured',
      );
    });

    it('configures web-push when keys are present', () => {
      service.onModuleInit();
      
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:test@umssy.com',
        'pub',
        'priv',
      );
    });
  });

  describe('dispatchToUsers', () => {
    it('debe retornar skipped si no hay suscripciones', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([]);
      
      const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

      expect(result).toEqual({
        status: 'skipped',
        deliveries: [{ recipientId: 'user-1', channel: 'push', status: 'skipped' }],
      });
    });

    it('debe ignorar (skipped) los userAgents de escritorio', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([
        {
          endpoint: 'https://fcm...',
          p256dh: 'x',
          auth: 'y',
          userId: 'user-1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      ]);

      const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

      expect(webpush.sendNotification).not.toHaveBeenCalled();
      expect(result.status).toBe('skipped');
    });

    it('debe eliminar la suscripción si el push service responde 410 (Gone)', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([
        {
          endpoint: 'https://fcm...',
          p256dh: 'x',
          auth: 'y',
          userId: 'user-1',
          userAgent: 'Android',
        },
      ]);

      const error: Error & { statusCode?: number } = new Error('Gone');
      error.statusCode = 410;
      (webpush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

      expect(mockPushRepo.deleteByEndpointAndUserId).toHaveBeenCalledWith('https://fcm...', 'user-1');
      expect(result).toEqual({
        status: 'failed',
        deliveries: [{ recipientId: 'user-1', channel: 'push', status: 'failed' }],
      });
    });

    it('debe enviar el payload con title, body, icon, actionUrl y groupKey', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([androidSubscription]);

      const result = await service.dispatchToUsers(
        ['user-1'],
        'Title',
        'Body',
        '/appointments',
        'group-1',
      );

      const [, rawPayload] = webpushMock.sendNotification.mock.calls[0] as [unknown, string];
      const payload = JSON.parse(rawPayload) as PushNotificationPayload;
      expect(payload).toEqual({
        title: 'Title',
        body: 'Body',
        icon: PUSH_NOTIFICATION_ICON,
        actionUrl: '/appointments',
        groupKey: 'group-1',
      });
      expect(result.status).toBe('sent');
    });

    it('debe enviar con TTL y urgencia alta para entregar con la app cerrada (HU-17)', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([androidSubscription]);

      await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/chat');

      const [, , options] = webpushMock.sendNotification.mock.calls[0] as [unknown, string, unknown];
      expect(options).toEqual({ TTL: 86400, urgency: 'high' });
    });

    it('debe limitar title y body a 100 caracteres', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([androidSubscription]);

      await service.dispatchToUsers(['user-1'], 'T'.repeat(150), 'B'.repeat(150), '/chat');

      const [, rawPayload] = webpushMock.sendNotification.mock.calls[0] as [unknown, string];
      const payload = JSON.parse(rawPayload) as PushNotificationPayload;
      expect(payload.title).toHaveLength(100);
      expect(payload.body).toHaveLength(100);
    });

    it('debe enviar un push por cada dispositivo móvil del usuario', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([androidSubscription, iphoneSubscription]);

      const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

      expect(webpushMock.sendNotification).toHaveBeenCalledTimes(2);
      expect(result.status).toBe('sent');
    });

    it('debe enviar solo a los móviles cuando también hay un escritorio', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([androidSubscription, desktopSubscription]);

      const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

      expect(webpushMock.sendNotification).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('sent');
    });

    it('debe eliminar la suscripción si el push service responde 404', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([androidSubscription]);
      webpushMock.sendNotification.mockRejectedValueOnce(createPushError('Not Found', 404));

      const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

      expect(mockPushRepo.deleteByEndpointAndUserId).toHaveBeenCalledWith(
        androidSubscription.endpoint,
        'user-1',
      );
      expect(result.status).toBe('failed');
    });

    it('registra la purga cuando el push service responde 410', async () => {
      const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      mockPushRepo.findManyByUserIds.mockResolvedValue([androidSubscription]);
      webpushMock.sendNotification.mockRejectedValueOnce(createPushError('Gone', 410));

      await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

      expect(warnSpy).toHaveBeenCalledWith(
        '[PushAudit] userId=user-1 endpointHost=fcm.googleapis.com statusCode=410 subscriptionRemoved=true',
      );
    });

    it('ante otro error no elimina la suscripción, lo registra y continúa con las demás', async () => {
      const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      mockPushRepo.findManyByUserIds.mockResolvedValue([androidSubscription, iphoneSubscription]);
      webpushMock.sendNotification.mockRejectedValueOnce(createPushError('Server error', 500));

      const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

      expect(mockPushRepo.deleteByEndpointAndUserId).not.toHaveBeenCalled();
      expect(webpushMock.sendNotification).toHaveBeenCalledTimes(2);
      expect(errorSpy).toHaveBeenCalledWith(
        '[PushAudit] userId=user-1 endpointHost=fcm.googleapis.com statusCode=500 subscriptionRemoved=false',
        expect.any(String),
      );
      expect(result.status).toBe('partial');
    });

    it('debe incluir en cada push el id del aviso de su destinatario', async () => {
      mockPushRepo.findManyByUserIds.mockResolvedValue([
        androidSubscription,
        { ...iphoneSubscription, userId: 'user-2' },
      ]);

      await service.dispatchToUsers(
        ['user-1', 'user-2'],
        'Title',
        'Body',
        '/appointments',
        undefined,
        new Map([
          ['user-1', 'notification-1'],
          ['user-2', 'notification-2'],
        ]),
      );

      const notificationIds = webpushMock.sendNotification.mock.calls.map(
        ([, rawPayload]) => (JSON.parse(rawPayload as string) as PushNotificationPayload).notificationId,
      );
      expect(notificationIds).toEqual(['notification-1', 'notification-2']);
    });
  });
});