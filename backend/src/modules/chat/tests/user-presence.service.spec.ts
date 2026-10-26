import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserPresenceService } from '../services/user-presence.service.js';
import { UserPresenceRepository } from '../repositories/user-presence.repository.js';

describe('UserPresenceService', () => {
  let service: UserPresenceService;
  let repository: UserPresenceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPresenceService,
        {
          provide: UserPresenceRepository,
          useValue: { upsert: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<UserPresenceService>(UserPresenceService);
    repository = module.get<UserPresenceRepository>(UserPresenceRepository);
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