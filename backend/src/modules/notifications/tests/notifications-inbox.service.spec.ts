import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsInboxService } from '../services/notifications-inbox.service.js';
import { NotificationsRepository } from '../repositories/notifications.repository.js';

interface MockNotificationsRepo {
  findReadStateById: ReturnType<typeof vi.fn>;
  markAsRead: ReturnType<typeof vi.fn>;
}

describe('NotificationsInboxService', () => {
  let service: NotificationsInboxService;
  let mockRepo: MockNotificationsRepo;

  beforeEach(async () => {
    mockRepo = {
      findReadStateById: vi.fn(),
      markAsRead: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsInboxService,
        { provide: NotificationsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NotificationsInboxService>(NotificationsInboxService);
  });

  describe('markAsRead', () => {
    it('marca como leído un aviso propio sin leer', async () => {
      mockRepo.findReadStateById.mockResolvedValue({ readAt: null });

      const result = await service.markAsRead('user-1', 'n1');

      expect(mockRepo.markAsRead).toHaveBeenCalledWith('n1', 'user-1');
      expect(result).toEqual({ ok: true });
    });

    it('no vuelve a escribir un aviso que ya estaba leído', async () => {
      mockRepo.findReadStateById.mockResolvedValue({ readAt: new Date() });

      const result = await service.markAsRead('user-1', 'n1');

      expect(mockRepo.markAsRead).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('responde 404 si el aviso no existe o es de otro usuario', async () => {
      mockRepo.findReadStateById.mockResolvedValue(null);

      await expect(service.markAsRead('user-1', 'n1')).rejects.toThrow(NotFoundException);
      expect(mockRepo.markAsRead).not.toHaveBeenCalled();
    });
  });
});