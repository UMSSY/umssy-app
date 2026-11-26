import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EventRegistrationsService } from '../../event-registrations/services/event-registrations.service.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';
import { EventRoomService } from '../services/event-room.service.js';
import { ConversationMapper } from '../mappers/conversation.mapper.js';
describe('EventRoomService', () => {
  let service: EventRoomService;
  let registrationsService: { getPassById: ReturnType<typeof vi.fn> };
  let conversationRepository: {
    upsertByEventId: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findParticipantsByConversationId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    registrationsService = { getPassById: vi.fn() };
    conversationRepository = {
      upsertByEventId: vi.fn().mockResolvedValue('conv-group-1'),
      findById: vi.fn(),
      findParticipantsByConversationId: vi.fn(),
    };

    const conversationMapper = new ConversationMapper();

    service = new EventRoomService(
      registrationsService as unknown as EventRegistrationsService,
      conversationRepository as unknown as ConversationRepository,
      conversationMapper,
    );
  });

  describe('validación de inscripción', () => {
    it('should throw NotRegisteredForEventException when the registration does not exist', async () => {
      registrationsService.getPassById.mockRejectedValue(
        new Error('not found'),
      );

      await expect(
        service.joinEventRoom('user-1', 'registration-1'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });

    it('should throw NotRegisteredForEventException when the registration is cancelled', async () => {
      registrationsService.getPassById.mockRejectedValue(
        new Error('not found'),
      );

      await expect(
        service.joinEventRoom('user-1', 'registration-1'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });

    it('should allow join when the registration is confirmed', async () => {
      registrationsService.getPassById.mockResolvedValue({
        event: { id: 'event-1', title: 'Taller de React' },
      });
      conversationRepository.findById.mockResolvedValue({
        id: 'conv-group-1',
        createdAt: new Date('2026-11-01T10:00:00Z'),
      });
      conversationRepository.findParticipantsByConversationId.mockResolvedValue(
        [
          {
            userId: 'user-1',
            user: { firstName: 'Maria', lastName: 'Fernandez' },
          },
        ],
      );

      const result = await service.joinEventRoom('user-1', 'registration-1');

      expect(result).toEqual({
        conversationId: 'conv-group-1',
        eventId: 'event-1',
        name: 'Taller de React',
        createdAt: '2026-11-01T10:00:00.000Z',
        participants: [{ id: 'user-1', fullName: 'Maria Fernandez' }],
      });

      expect(registrationsService.getPassById).toHaveBeenCalledWith(
        'registration-1',
        'user-1',
      );
      expect(conversationRepository.upsertByEventId).toHaveBeenCalledWith(
        'event-1',
        'user-1',
        expect.any(Date),
      );
    });

    it('should allow re-ingress without duplicating the member', async () => {
      registrationsService.getPassById.mockResolvedValue({
        event: { id: 'event-1', title: 'Taller de React' },
      });
      conversationRepository.findById.mockResolvedValue({
        id: 'conv-group-1',
        createdAt: new Date('2026-11-01T10:00:00Z'),
      });
      conversationRepository.findParticipantsByConversationId.mockResolvedValue(
        [
          {
            userId: 'user-1',
            user: { firstName: 'Maria', lastName: 'Fernandez' },
          },
        ],
      );

      const result1 = await service.joinEventRoom('user-1', 'registration-1');
      const result2 = await service.joinEventRoom('user-1', 'registration-1');

      expect(result1).toEqual(result2);
      expect(conversationRepository.upsertByEventId).toHaveBeenCalledTimes(2);
    });

    it('should resolve different registrations of the same event to the same room', async () => {
      registrationsService.getPassById
        .mockResolvedValueOnce({
          event: { id: 'event-1', title: 'Taller de React' },
        })
        .mockResolvedValueOnce({
          event: { id: 'event-1', title: 'Taller de React' },
        });
      conversationRepository.upsertByEventId.mockResolvedValue('conv-event-1');
      conversationRepository.findById.mockResolvedValue({
        id: 'conv-event-1',
        createdAt: new Date('2026-11-01T10:00:00Z'),
      });
      conversationRepository.findParticipantsByConversationId.mockResolvedValue(
        [
          {
            userId: 'user-1',
            user: { firstName: 'Maria', lastName: 'Fernandez' },
          },
        ],
      );

      const result1 = await service.joinEventRoom('user-1', 'registration-1');
      const result2 = await service.joinEventRoom('user-2', 'registration-2');

      expect(result1.conversationId).toBe(result2.conversationId);
      expect(conversationRepository.upsertByEventId).toHaveBeenNthCalledWith(
        1,
        'event-1',
        'user-1',
        expect.any(Date),
      );
      expect(conversationRepository.upsertByEventId).toHaveBeenNthCalledWith(
        2,
        'event-1',
        'user-2',
        expect.any(Date),
      );
    });

    it('should allow the same user in different events', async () => {
      registrationsService.getPassById
        .mockResolvedValueOnce({
          event: { id: 'event-1', title: 'Taller de React' },
        })
        .mockResolvedValueOnce({
          event: { id: 'event-2', title: 'Taller de Node' },
        });
      conversationRepository.upsertByEventId
        .mockResolvedValueOnce('conv-event-1')
        .mockResolvedValueOnce('conv-event-2');
      conversationRepository.findById.mockResolvedValue({
        id: 'conv-event-1',
        createdAt: new Date('2026-11-01T10:00:00Z'),
      });
      conversationRepository.findParticipantsByConversationId.mockResolvedValue(
        [
          {
            userId: 'user-1',
            user: { firstName: 'Maria', lastName: 'Fernandez' },
          },
        ],
      );

      const result1 = await service.joinEventRoom('user-1', 'registration-1');
      const result2 = await service.joinEventRoom('user-1', 'registration-2');

      expect(result1.conversationId).not.toBe(result2.conversationId);
    });
  });

  describe('manejo de payloads e identificación', () => {
    it('should reject an invalid registrationId payload', async () => {
      registrationsService.getPassById.mockRejectedValue(
        new Error('invalid registration'),
      );

      await expect(service.joinEventRoom('user-1', 'not-uuid')).rejects.toThrow(
        NotRegisteredForEventException,
      );
    });

    it('should reject a user who does not own the registration', async () => {
      registrationsService.getPassById.mockRejectedValue(
        new Error('not registered'),
      );

      await expect(
        service.joinEventRoom('stranger-1', 'registration-1'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });
  });
});
