import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import { PreferencesRepository } from '../repositories/preferences.repository.js';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let pushRepo: { upsert: ReturnType<typeof vi.fn>; deleteByEndpointAndUserId: ReturnType<typeof vi.fn> };
  let prefRepo: { findManyByUserIds: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> };

  const payload = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    keys: { p256dh: 'k1', auth: 'k2' },
    userAgent: 'Android',
  };

  beforeEach(async () => {
    pushRepo = { upsert: vi.fn(), deleteByEndpointAndUserId: vi.fn() };
    prefRepo = { findManyByUserIds: vi.fn(), upsert: vi.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PushSubscriptionsRepository, useValue: pushRepo },
        { provide: PreferencesRepository, useValue: prefRepo },
      ],
    }).compile();

    service = moduleRef.get(SubscriptionsService);
  });

  describe('subscribe', () => {
    it('delegates to repository upsert with userId and payload', async () => {
      pushRepo.upsert.mockResolvedValue(undefined);

      const result = await service.subscribe('user-1', payload);

      expect(pushRepo.upsert).toHaveBeenCalledWith('user-1', payload);
      expect(result).toEqual({ ok: true });
    });
  });

  describe('unsubscribe', () => {
    it('deletes by endpoint and userId, returns void', async () => {
      pushRepo.deleteByEndpointAndUserId.mockResolvedValue(undefined);

      const result = await service.unsubscribe('user-1', payload.endpoint);

      expect(pushRepo.deleteByEndpointAndUserId).toHaveBeenCalledWith(
        payload.endpoint,
        'user-1',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('getPreferences', () => {
    it('returns defaults when no record exists', async () => {
      prefRepo.findManyByUserIds.mockResolvedValue([]);

      const result = await service.getPreferences('user-1');

      expect(result).toEqual({
        pushEnabled: false,
        emailEnabled: true,
        inAppEnabled: true,
      });
    });

    it('returns stored preferences when record exists', async () => {
      prefRepo.findManyByUserIds.mockResolvedValue([
        { userId: 'user-1', pushEnabled: true, emailEnabled: false, inAppEnabled: true },
      ]);

      const result = await service.getPreferences('user-1');

      expect(result).toEqual({
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: true,
      });
    });
  });

  describe('updatePreferences', () => {
    it('upserts with typed payload', async () => {
      prefRepo.upsert.mockResolvedValue(undefined);

      const result = await service.updatePreferences('user-1', {
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: true,
      });

      expect(prefRepo.upsert).toHaveBeenCalledWith('user-1', {
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: true,
      });
      expect(result).toEqual({ ok: true });
    });
  });
});