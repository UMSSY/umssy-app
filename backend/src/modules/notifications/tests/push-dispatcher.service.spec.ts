import { Test, TestingModule } from '@nestjs/testing';
import { PushDispatcherService } from '../services/push-dispatcher.service.js';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import * as webpush from 'web-push';

vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));

describe('PushDispatcherService', () => {
  let service: PushDispatcherService;
  let mockPushRepo: any;

  beforeEach(async () => {
    mockPushRepo = {
      findManyByUserIds: vi.fn(),
      deleteByEndpoint: vi.fn(),
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
      { endpoint: 'https://fcm...', p256dh: 'x', auth: 'y', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    ]);

    const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');
    
    expect(webpush.sendNotification).not.toHaveBeenCalled();
    expect(result).toBe('skipped');
  });

  it('debe eliminar la suscripción si el push service responde 410 (Gone)', async () => {
    mockPushRepo.findManyByUserIds.mockResolvedValue([
      { endpoint: 'https://fcm...', p256dh: 'x', auth: 'y', userAgent: 'Android' }
    ]);
    
    const error: any = new Error('Gone');
    error.statusCode = 410;
    (webpush.sendNotification as any).mockRejectedValueOnce(error);

    const result = await service.dispatchToUsers(['user-1'], 'Title', 'Body', '/url');

    expect(mockPushRepo.deleteByEndpoint).toHaveBeenCalledWith('https://fcm...');
    expect(result).toBe('failed');
  });
});