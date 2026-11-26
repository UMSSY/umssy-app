import { SubscriptionsService } from '../services/subscriptions.service.js';

describe('SubscriptionsService · preferencias', () => {
  const pushRepo = {
    upsert: vi.fn(),
    deleteByEndpointAndUserId: vi.fn(),
  };
  const preferencesRepo = {
    findManyByUserIds: vi.fn(),
    upsert: vi.fn(),
  };

  let service: SubscriptionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SubscriptionsService(pushRepo as any, preferencesRepo as any);
  });

  describe('getPreferences', () => {
    it('devuelve push desactivado y correo activado si el usuario no tiene preferencia guardada', async () => {
      preferencesRepo.findManyByUserIds.mockResolvedValue([]);

      const result = await service.getPreferences('user-1');

      expect(result).toEqual({
        pushEnabled: false,
        emailEnabled: true,
        inAppEnabled: true,
      });
      expect(preferencesRepo.findManyByUserIds).toHaveBeenCalledWith(['user-1']);
    });

    it('devuelve la preferencia guardada del usuario', async () => {
      preferencesRepo.findManyByUserIds.mockResolvedValue([
        {
          userId: 'user-1',
          pushEnabled: true,
          emailEnabled: false,
          inAppEnabled: true,
        },
      ]);

      const result = await service.getPreferences('user-1');

      expect(result).toEqual({
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: true,
      });
    });

    it('respeta una preferencia guardada con todo desactivado salvo la app', async () => {
      preferencesRepo.findManyByUserIds.mockResolvedValue([
        {
          userId: 'user-1',
          pushEnabled: false,
          emailEnabled: false,
          inAppEnabled: true,
        },
      ]);

      const result = await service.getPreferences('user-1');

      expect(result.emailEnabled).toBe(false);
      expect(result.pushEnabled).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('crea o actualiza la preferencia del usuario indicado', async () => {
      preferencesRepo.upsert.mockResolvedValue(undefined);

      const result = await service.updatePreferences('user-1', {
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: true,
      });

      expect(result).toEqual({ ok: true });
      expect(preferencesRepo.upsert).toHaveBeenCalledTimes(1);
      expect(preferencesRepo.upsert).toHaveBeenCalledWith('user-1', {
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: true,
      });
    });
  });
});