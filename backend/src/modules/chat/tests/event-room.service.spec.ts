import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EventRegistrationsService } from '../../event-registrations/services/event-registrations.service.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';
import { EventRoomService } from '../services/event-room.service.js';

describe('EventRoomService', () => {
  let service: EventRoomService;
  let registrationsService: { findOwn: ReturnType<typeof vi.fn> };
  let conversationRepository: { upsertByEventId: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    registrationsService = { findOwn: vi.fn() };
    conversationRepository = {
      upsertByEventId: vi.fn().mockResolvedValue('conv-group-1'),
    };
    service = new EventRoomService(
      registrationsService as unknown as EventRegistrationsService,
      conversationRepository as unknown as ConversationRepository,
    );
  });

  describe('validación de inscripción', () => {
    it('should throw NotRegisteredForEventException when user has no registration', async () => {
      registrationsService.findOwn.mockRejectedValue(new Error('not found'));

      await expect(
        service.joinEventRoom('user-1', 'event-1'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });

    it('should throw NotRegisteredForEventException when registration is cancelled', async () => {
      registrationsService.findOwn.mockResolvedValue({ status: 'cancelled' });

      await expect(
        service.joinEventRoom('user-1', 'event-1'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });

    it('should allow join when registration is confirmed', async () => {
      registrationsService.findOwn.mockResolvedValue({ status: 'confirmed' });

      const result = await service.joinEventRoom('user-1', 'event-1');

      expect(result).toBe('conv-group-1');
      expect(conversationRepository.upsertByEventId).toHaveBeenCalledWith(
        'event-1',
        'user-1',
        expect.any(Date),
      );
    });

    it('should allow re‑ingress without duplicating the member', async () => {
      registrationsService.findOwn.mockResolvedValue({ status: 'confirmed' });

      const result1 = await service.joinEventRoom('user-1', 'event-1');
      const result2 = await service.joinEventRoom('user-1', 'event-1');

      expect(result1).toBe(result2);
    });

    it('should allow same user in different events', async () => {
      registrationsService.findOwn.mockResolvedValue({ status: 'confirmed' });
      conversationRepository.upsertByEventId
        .mockResolvedValueOnce('conv-event-1')
        .mockResolvedValueOnce('conv-event-2');

      const result1 = await service.joinEventRoom('user-1', 'event-1');
      const result2 = await service.joinEventRoom('user-1', 'event-2');

      expect(result1).not.toBe(result2);
    });
  });

  describe('manejo de payloads e identificación', () => {
    it('should reject invalid eventId payload', async () => {
      registrationsService.findOwn.mockRejectedValue(
        new Error('invalid event'),
      );

      await expect(
        service.joinEventRoom('user-1', 'not-uuid'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });

    it('should reject user not a member of the conversation', async () => {
      registrationsService.findOwn.mockRejectedValue(
        new Error('not registered'),
      );

      await expect(
        service.joinEventRoom('stranger-1', 'event-1'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });
  });
});
