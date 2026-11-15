import { Test, TestingModule } from '@nestjs/testing';
import { PushDispatcherService } from '../services/push-dispatcher.service.js';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import * as webpush from 'web-push';

const webpushMock = vi.hoisted(() => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));
vi.mock('web-push', () => webpushMock);

describe('PushDispatcherService', () => {
  let service: PushDispatcherService;
  let mockPushRepo: {
    findManyByUserIds: ReturnType<typeof vi.fn>;
    deleteByEndpointAndUserId: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockPushRepo = {
      findManyByUserIds: vi.fn(),
      deleteByEndpointAndUserId: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushDispatcherService,
        { provide: PushSubscriptionsRepository, useValue: mockPushRepo },
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

    expect(webpush.sendNotification).not.toHaveBeenCalled();
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
    (webpush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

    const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

    expect(mockPushRepo.deleteByEndpointAndUserId).toHaveBeenCalledWith('https://fcm...', 'user-1');
    expect(result).toBe('failed');
  });
});