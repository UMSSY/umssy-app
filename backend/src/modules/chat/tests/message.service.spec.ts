
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MessageService } from '../services/message.service.js';
import type { MessageRepository } from '../repositories/message.repository.js';
import type { ConversationRepository } from '../repositories/conversation.repository.js';
import type { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import type { MessageStatusService } from '../services/message-status.service.js';
import type { BlockService } from '../services/block.service.js';
import type { ChatRolePolicyService } from '../services/chat-role-policy.service.js';

describe('MessageService (group chat)', () => {
  let service: MessageService;

  let conversationRepository: {
    findById: ReturnType<typeof vi.fn>;
    touchLastMessage: ReturnType<typeof vi.fn>;
  };

  let participantRepository: {
    findByConversationAndUser: ReturnType<typeof vi.fn>;
    markRead: ReturnType<typeof vi.fn>;
  };

  let messageRepository: {
    create: ReturnType<typeof vi.fn>;
  };

  let messageStatusService: {
    getSentId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    conversationRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 'group-conv-1',
        eventId: 'event-1',
      }),
      touchLastMessage: vi.fn().mockResolvedValue(undefined),
    };

    participantRepository = {
      findByConversationAndUser: vi.fn().mockResolvedValue({
        conversationId: 'group-conv-1',
        userId: 'user-1',
      }),
      markRead: vi.fn().mockResolvedValue(undefined),
    };

    messageRepository = {
      create: vi.fn().mockImplementation(async (data: {
        conversationId: string;
        senderId: string;
        content: string;
        sentAt: Date;
      }) => ({
        id: 'message-1',
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        sentAt: data.sentAt,
        createdAt: data.sentAt,
      })),
    };

    messageStatusService = {
      getSentId: vi.fn().mockResolvedValue('status-sent'),
    };

    const blockService = {
      isBlockedBetween: vi.fn().mockResolvedValue(false),
    } as unknown as BlockService;

    const chatRolePolicyService = {
      assertCanCommunicate: vi.fn(),
    } as unknown as ChatRolePolicyService;

    service = new MessageService(
      messageRepository as unknown as MessageRepository,
      conversationRepository as unknown as ConversationRepository,
      participantRepository as unknown as ConversationParticipantRepository,
      messageStatusService as unknown as MessageStatusService,
      blockService,
      chatRolePolicyService,
    );
  });

  it('should allow sending a message in a group conversation', async () => {
    const result = await service.send({
      conversationId: 'group-conv-1',
      senderId: 'user-1',
      content: 'Hello group',
    });

    expect(result.senderId).toBe('user-1');
    expect(result.content).toBe('Hello group');
    expect(conversationRepository.touchLastMessage).toHaveBeenCalled();
  });

  it('should include senderId in the response', async () => {
    const result = await service.send({
      conversationId: 'group-conv-1',
      senderId: 'user-1',
      content: 'Test message',
    });

    expect(result).toHaveProperty('senderId', 'user-1');
  });

  it('should reject message with empty content', async () => {
    await expect(
      service.send({
        conversationId: 'group-conv-1',
        senderId: 'user-1',
        content: '',
      }),
    ).rejects.toThrow();
  });

  it('should reject message exceeding max length', async () => {
    await expect(
      service.send({
        conversationId: 'group-conv-1',
        senderId: 'user-1',
        content: 'x'.repeat(501),
      }),
    ).rejects.toThrow();
  });
});
