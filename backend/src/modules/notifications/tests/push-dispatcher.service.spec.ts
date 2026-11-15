import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { PushDispatcherService, WEB_PUSH_CLIENT } from '../services/push-dispatcher.service.js';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';

describe('PushDispatcherService', () => {
  let service: PushDispatcherService;
  let mockPushRepo: {
    findManyByUserIds: ReturnType<typeof vi.fn>;
    deleteByEndpointAndUserId: ReturnType<typeof vi.fn>;
  };
  let webpushMock: {
    setVapidDetails: ReturnType<typeof vi.fn>;
    sendNotification: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockPushRepo = {
      findManyByUserIds: vi.fn(),
      deleteByEndpointAndUserId: vi.fn(),
    };

    webpushMock = {
      setVapidDetails: vi.fn(),
      sendNotification: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushDispatcherService,
        { provide: PushSubscriptionsRepository, useValue: mockPushRepo },
        { provide: WEB_PUSH_CLIENT, useValue: webpushMock },
      ],
    }).compile();

    service = module.get<PushDispatcherService>(PushDispatcherService);
  });

  it('debe retornar skipped si no hay suscripciones', async () => {
    mockPushRepo.findManyByUserIds.mockResolvedValue([]);
    const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');
    expect(result).toBe('skipped');
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

    expect(webpushMock.sendNotification).not.toHaveBeenCalled();
    expect(result).toBe('skipped');
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
    webpushMock.sendNotification.mockRejectedValueOnce(error);

    const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

    expect(mockPushRepo.deleteByEndpointAndUserId).toHaveBeenCalledWith('https://fcm...', 'user-1');
    expect(result).toBe('failed');
  });
});
