import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserPresenceService } from '../services/user-presence.service.js';
import { UserPresenceRepository } from '../repositories/user-presence.repository.js';

describe('UserPresenceService', () => {
  let service: UserPresenceService;
  let repository: UserPresenceRepository;

  beforeEach(() => {
    const mockRepository = {
      upsert: vi.fn().mockResolvedValue(undefined),
      findByUserIds: vi.fn().mockResolvedValue([]),
    };

    repository = mockRepository as unknown as UserPresenceRepository;
    service = new UserPresenceService(repository);
  });

  it('debe marcar al usuario como en línea', async () => {
    const userId = 'user-123';
    const now = new Date();

    await service.markOnline(userId, now);

    expect(repository.upsert).toHaveBeenCalledWith(userId, true, now);
  });

  it('debe marcar al usuario como desconectado', async () => {
    const userId = 'user-123';
    const now = new Date();

    await service.markOffline(userId, now);

    expect(repository.upsert).toHaveBeenCalledWith(userId, false, now);
  });
});
