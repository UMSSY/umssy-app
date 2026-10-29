import { describe, expect, it, vi } from 'vitest';
import { MessageService } from './message.service.js';
import type { MessageRepository } from '../repositories/message.repository.js';
import type { ConversationRepository } from '../repositories/conversation.repository.js';
import type { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import type { MessageStatusService } from './message-status.service.js';
import type { BlockService } from './block.service.js';
import {
  ConversationNotFoundException,
  InvalidMessageContentException,
  NotConversationParticipantException,
  UserBlockedException,
} from '../exceptions/index.js';

describe('MessageService', () => {
  const createMockService = () => {
    const messageRepository = {
      create: vi.fn(),
      findPage: vi.fn(),
    } as unknown as MessageRepository;

    const conversationRepository = {
      findById: vi.fn(),
      touchLastMessage: vi.fn(),
    } as unknown as ConversationRepository;

    const participantRepository = {
      findByConversationAndUser: vi.fn(),
      markRead: vi.fn(),
    } as unknown as ConversationParticipantRepository;

    const messageStatusService = {
      getSentId: vi.fn().mockResolvedValue('status-sent-id'),
    } as unknown as MessageStatusService;

    const blockService = {
      isBlockedBetween: vi.fn().mockResolvedValue(false),
    } as unknown as BlockService;

    const service = new MessageService(
      messageRepository,
      conversationRepository,
      participantRepository,
      messageStatusService,
      blockService,
    );

    return {
      service,
      messageRepository: messageRepository as unknown as {
        create: ReturnType<typeof vi.fn>;
        findPage: ReturnType<typeof vi.fn>;
      },
      conversationRepository: conversationRepository as unknown as {
        findById: ReturnType<typeof vi.fn>;
        touchLastMessage: ReturnType<typeof vi.fn>;
      },
      participantRepository: participantRepository as unknown as {
        findByConversationAndUser: ReturnType<typeof vi.fn>;
        markRead: ReturnType<typeof vi.fn>;
      },
      messageStatusService: messageStatusService as unknown as {
        getSentId: ReturnType<typeof vi.fn>;
      },
      blockService: blockService as unknown as {
        isBlockedBetween: ReturnType<typeof vi.fn>;
      },
    };
  };

  describe('send', () => {
    it('throws ConversationNotFoundException if conversation does not exist', async () => {
      const { service, conversationRepository } = createMockService();
      conversationRepository.findById.mockResolvedValue(null);

      await expect(
        service.send({
          conversationId: 'conv-none',
          senderId: 'user-1',
          content: 'Hola',
        }),
      ).rejects.toThrow(ConversationNotFoundException);
    });

    it('throws NotConversationParticipantException if user is not a participant', async () => {
      const { service, conversationRepository, participantRepository } =
        createMockService();
      conversationRepository.findById.mockResolvedValue({ id: 'conv-1' });
      participantRepository.findByConversationAndUser.mockResolvedValue(null);

      await expect(
        service.send({
          conversationId: 'conv-1',
          senderId: 'user-intruder',
          content: 'Hola',
        }),
      ).rejects.toThrow(NotConversationParticipantException);
    });

    it('throws InvalidMessageContentException if content is empty or whitespace', async () => {
      const { service, conversationRepository, participantRepository } =
        createMockService();
      conversationRepository.findById.mockResolvedValue({ id: 'conv-1' });
      participantRepository.findByConversationAndUser.mockResolvedValue({
        id: 'part-1',
      });

      await expect(
        service.send({
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: '   ',
        }),
      ).rejects.toThrow(InvalidMessageContentException);
    });

    it('throws InvalidMessageContentException if content exceeds 500 characters', async () => {
      const { service, conversationRepository, participantRepository } =
        createMockService();
      conversationRepository.findById.mockResolvedValue({ id: 'conv-1' });
      participantRepository.findByConversationAndUser.mockResolvedValue({
        id: 'part-1',
      });

      await expect(
        service.send({
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'a'.repeat(501),
        }),
      ).rejects.toThrow(InvalidMessageContentException);
    });

    it('creates message, touches lastMessage, marks conversation read and returns response', async () => {
      const {
        service,
        conversationRepository,
        participantRepository,
        messageRepository,
      } = createMockService();

      conversationRepository.findById.mockResolvedValue({ id: 'conv-1' });
      participantRepository.findByConversationAndUser.mockResolvedValue({
        id: 'part-1',
      });

      const now = new Date('2026-10-14T10:00:00.000Z');
      messageRepository.create.mockResolvedValue({
        id: 'msg-123',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hola mundo real',
        statusId: 'status-sent-id',
        sentAt: now,
        createdAt: now,
      });

      const result = await service.send({
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: '  Hola mundo real  ',
      });

      expect(messageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hola mundo real',
          statusId: 'status-sent-id',
        }),
      );

      expect(conversationRepository.touchLastMessage).toHaveBeenCalledWith(
        'conv-1',
        'msg-123',
        expect.any(Date),
      );

      expect(participantRepository.markRead).toHaveBeenCalledWith(
        'conv-1',
        'user-1',
        expect.any(Date),
      );

      expect(result).toEqual({
        id: 'msg-123',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hola mundo real',
        timestamp: now.toISOString(),
        createdAt: now.toISOString(),
        status: 'sent',
        isAttachment: false,
        attachmentType: null,
      });
    });
  });

  describe('markRead', () => {
    it('throws NotConversationParticipantException if user is not participant', async () => {
      const { service, participantRepository } = createMockService();
      participantRepository.findByConversationAndUser.mockResolvedValue(null);

      await expect(
        service.markRead('conv-1', 'user-intruder'),
      ).rejects.toThrow(NotConversationParticipantException);
    });

    it('marks conversation as read for participant', async () => {
      const { service, participantRepository } = createMockService();
      participantRepository.findByConversationAndUser.mockResolvedValue({
        id: 'part-1',
      });

      await service.markRead('conv-1', 'user-1');

      expect(participantRepository.markRead).toHaveBeenCalledWith(
        'conv-1',
        'user-1',
        expect.any(Date),
      );
    });
  });

  describe('getPage', () => {
    it('throws NotConversationParticipantException if user is not participant', async () => {
      const { service, participantRepository } = createMockService();
      participantRepository.findByConversationAndUser.mockResolvedValue(null);

      await expect(
        service.getPage({
          conversationId: 'conv-1',
          userId: 'user-intruder',
          cursor: null,
          limit: 10,
        }),
      ).rejects.toThrow(NotConversationParticipantException);
    });

    it('returns formatted page of messages', async () => {
      const { service, participantRepository, messageRepository } =
        createMockService();
      participantRepository.findByConversationAndUser.mockResolvedValue({
        id: 'part-1',
      });

      const now = new Date('2026-10-14T10:00:00.000Z');
      messageRepository.findPage.mockResolvedValue({
        data: [
          {
            id: 'm1',
            conversationId: 'conv-1',
            senderId: 'user-1',
            content: 'Hello',
            sentAt: now,
            createdAt: now,
          },
        ],
        hasMore: false,
        nextCursor: null,
      });

      const result = await service.getPage({
        conversationId: 'conv-1',
        userId: 'user-1',
        cursor: null,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('m1');
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });

    describe('send con usuarios bloqueados', () => {
    const conversation = { id: 'conv-1', userAId: 'user-a', userBId: 'user-b' };

    const arrange = (blocked: boolean) => {
      const mocks = createMockService();
      mocks.conversationRepository.findById.mockResolvedValue(conversation);
      mocks.participantRepository.findByConversationAndUser.mockResolvedValue({ id: 'part-1' });
      mocks.blockService.isBlockedBetween.mockResolvedValue(blocked);
      mocks.messageRepository.create.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-a',
        content: 'Hola',
        sentAt: new Date('2026-10-28T10:00:00.000Z'),
        createdAt: new Date('2026-10-28T10:00:00.000Z'),
      });
      return mocks;
    };

    it('quien bloquea envía → 403 y no crea el mensaje ni toca last_message_at', async () => {
      const { service, blockService, messageRepository, conversationRepository } = arrange(true);

      await expect(
        service.send({ conversationId: 'conv-1', senderId: 'user-a', content: 'Hola' }),
      ).rejects.toThrow(UserBlockedException);

      expect(blockService.isBlockedBetween).toHaveBeenCalledWith('user-a', 'user-b');
      expect(messageRepository.create).not.toHaveBeenCalled();
      expect(conversationRepository.touchLastMessage).not.toHaveBeenCalled();
    });

    it('el bloqueado envía → 403 (verificación en ambas direcciones)', async () => {
      const { service, blockService, messageRepository } = arrange(true);

      await expect(
        service.send({ conversationId: 'conv-1', senderId: 'user-b', content: 'Hola' }),
      ).rejects.toThrow('No es posible enviar mensajes en esta conversación');

      expect(blockService.isBlockedBetween).toHaveBeenCalledWith('user-b', 'user-a');
      expect(messageRepository.create).not.toHaveBeenCalled();
    });

    it('UserBlockedException responde con estado 403', () => {
      expect(new UserBlockedException().statusCode).toBe(403);
    });

    it('otros contactos no se afectan / tras desbloquear → se crea el mensaje', async () => {
      const { service, messageRepository, conversationRepository } = arrange(false);

      const result = await service.send({ conversationId: 'conv-1', senderId: 'user-a', content: 'Hola' });

      expect(result.id).toBe('msg-1');
      expect(messageRepository.create).toHaveBeenCalledTimes(1);
      expect(conversationRepository.touchLastMessage).toHaveBeenCalledTimes(1);
    });

    it('conversaciones de evento (sin userA/userB) no consultan bloqueos', async () => {
      const mocks = arrange(true);
      mocks.conversationRepository.findById.mockResolvedValue({ id: 'conv-event', userAId: null, userBId: null });

      await sendToEventConversation(mocks.service);

      expect(mocks.blockService.isBlockedBetween).not.toHaveBeenCalled();
      expect(mocks.messageRepository.create).toHaveBeenCalledTimes(1);
    });

    it('el historial (getPage) sigue disponible con bloqueo activo', async () => {
      const { service, participantRepository, messageRepository, blockService } = arrange(true);
      participantRepository.findByConversationAndUser.mockResolvedValue({ id: 'part-1' });
      messageRepository.findPage.mockResolvedValue({ data: [], hasMore: false, nextCursor: null });

      const page = await service.getPage({ conversationId: 'conv-1', userId: 'user-a', cursor: null, limit: 10 });

      expect(page.data).toEqual([]);
      expect(blockService.isBlockedBetween).not.toHaveBeenCalled();
    });
  });
});

function sendToEventConversation(service: MessageService) {
  return service.send({ conversationId: 'conv-event', senderId: 'user-a', content: 'Hola' });
}

