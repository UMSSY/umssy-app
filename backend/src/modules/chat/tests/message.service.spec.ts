import { MessageService } from '../services/message.service.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';

describe('MessageService (group chat)', () => {
  let service: MessageService;

  beforeEach(() => {
    service = new MessageService(
      {} as any,
      {} as ConversationRepository,
      {} as ConversationParticipantRepository,
      {} as any,
    );
  });

  it('should allow sending a message in a group conversation', async () => {
    // Arrange - set up conversation with eventId (group chat)
    // and a participant for the sender
    // Act - call service.send with a group conversationId
    // Assert - message should be created successfully
    const result = await service.send({
      conversationId: 'group-conv-1',
      senderId: 'user-1',
      content: 'Hello group',
    });
    expect(result.senderId).toBe('user-1');
  });

  it('should include senderId in the response', async () => {
    // Arrange
    // Act
    const result = await service.send({
      conversationId: 'group-conv-1',
      senderId: 'user-1',
      content: 'Test message',
    });
    // Assert
    expect(result).toHaveProperty('senderId', 'user-1');
  });

  it('should reject message with empty content', async () => {
    // Act
    await expect(
      service.send({
        conversationId: 'group-conv-1',
        senderId: 'user-1',
        content: '',
      }),
    ).rejects.toThrow();
  });

  it('should reject message exceeding max length', async () => {
    // Act
    await expect(
      service.send({
        conversationId: 'group-conv-1',
        senderId: 'user-1',
        content: 'x'.repeat(501),
      }),
    ).rejects.toThrow();
  });
});