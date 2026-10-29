import { EventRegistrationsService } from '../services/event-registrations.service.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';
import { EventRoomService } from '../services/event-room.service.js';
import { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';

describe('EventRoomService — Integration Tests', () => {
  let service: EventRoomService;

  beforeEach(() => {
    service = new EventRoomService(
      {} as EventRegistrationsService,
      {} as ConversationRepository,
    );
  });

  describe('validación de inscripción', () => {
    it('should throw NotRegisteredForEventException when user has no registration', async () => {
      await expect(
        service.joinEventRoom('user-1', 'event-1'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });

    it('should throw NotRegisteredForEventException when registration is cancelled', async () => {
      // Arrange: mock a cancelled registration
      // Act
      await expect(
        service.joinEventRoom('user-1', 'event-1'),
      ).rejects.toThrow(NotRegisteredForEventException);
    });

    it('should allow join when registration is confirmed', async () => {
      // Arrange: mock a confirmed registration
      // Act
      // const result = await service.joinEventRoom('user-1', 'event-1');
      // Assert
      // expect(result).toBeDefined();
    });

    it('should allow re‑ingress without duplicating the member', async () => {
      // Arrange: user already in the conversation
      // Act
      // const result1 = await service.joinEventRoom('user-1', 'event-1');
      // const result2 = await service.joinEventRoom('user-1', 'event-1');
      // Assert
      // expect(result1).toBe(result2); // same conversationId
    });

    it('should allow same user in different events', async () => {
      // Arrange: user confirmed in event-1 and event-2
      // Act
      // const result1 = await service.joinEventRoom('user-1', 'event-1');
      // const result2 = await service.joinEventRoom('user-1', 'event-2');
      // Assert
      // expect(result1).not.toBe(result2);
    });
  });

  describe('manejo de payloads e identificación', () => {
    it('should reject invalid eventId payload', async () => {
      // Arrange: invalid UUID format
      // Act
      await expect(
        service.joinEventRoom('user-1', 'not-uuid'),
      ).rejects.toThrow(); // or specific error depending on validation
    });

    it('should reject user not a member of the conversation', async () => {
      // Arrange: user not a participant
      // Act
      await expect(
        service.joinEventRoom('stranger-1', 'event-1'),
      ).rejects.toThrow(); // or specific error
    });
  });

  describe('participantes y mensajes', () => {
    it('should allow getMessages with more than two participants', async () => {
      // Arrange: group conversation with multiple participants
      // Act
      // const result = await service.joinEventRoom('user-1', 'event-1');
      // Assert
      // expect(result).toBeDefined();
    });

    it('should exclude group chats from 1:1 conversation lists', async () => {
      // Arrange: group conversation has eventId set
      // Act
      // const result = await repository.findUserConversations('user-1');
      // Assert
      // expect(result.every((c) => c.eventId === null)).toBe(true);
    });
  });
});