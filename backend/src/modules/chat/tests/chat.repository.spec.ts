import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('ConversationRepository', () => {
  let repository: ConversationRepository;
  let conversationFindMany: ReturnType<typeof vi.fn>;
  let conversationFindUnique: ReturnType<typeof vi.fn>;
  let conversationUpsert: ReturnType<typeof vi.fn>;
  let participantUpsert: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    conversationFindMany = vi.fn();
    conversationFindUnique = vi.fn();
    conversationUpsert = vi.fn();
    participantUpsert = vi.fn();

    const prisma = {
      conversation: {
        findMany: conversationFindMany,
        findUnique: conversationFindUnique,
        upsert: conversationUpsert,
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
        callback({
          conversation: { upsert: conversationUpsert },
          conversationParticipant: { upsert: participantUpsert },
        }),
      ),
    };

    repository = new ConversationRepository(prisma as unknown as PrismaService);
  });

  describe('findUserConversations', () => {
    it('includes direct conversations and event rooms where the user is a participant', async () => {
      const conversations = [
        { id: 'conv-1', eventId: null },
        { id: 'conv-event-1', eventId: 'event-1' },
      ];
      conversationFindMany.mockResolvedValue(conversations);

      const result = await repository.findUserConversations('user-1');

      expect(conversationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              {
                eventId: null,
                OR: [{ userAId: 'user-1' }, { userBId: 'user-1' }],
              },
              {
                eventId: { not: null },
                participants: {
                  some: { userId: 'user-1' },
                },
              },
            ],
          },
          include: expect.objectContaining({
            participants: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          }),
        }),
      );
      expect(result).toEqual(conversations);
    });
  });

  describe('findById', () => {
    it('should return the conversation by id', async () => {
      const conversation = { id: 'conv-1', eventId: 'event-1' };
      conversationFindUnique.mockResolvedValue(conversation);

      const result = await repository.findById('conv-1');

      expect(conversationFindUnique).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
      });
      expect(result).toEqual(conversation);
    });
  });

  describe('upsertByEventId', () => {
    it('should verify user participation via conversation_participants for group chats', async () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      conversationUpsert.mockResolvedValue({ id: 'conv-group-1' });
      participantUpsert.mockResolvedValue({});

      const result = await repository.upsertByEventId('event-1', 'user-1', now);

      expect(conversationUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: 'event-1' },
          create: expect.objectContaining({ eventId: 'event-1' }),
        }),
      );
      expect(participantUpsert).toHaveBeenCalledWith({
        where: {
          conversationId_userId: {
            conversationId: 'conv-group-1',
            userId: 'user-1',
          },
        },
        update: { lastReadAt: now },
        create: {
          conversationId: 'conv-group-1',
          userId: 'user-1',
          lastReadAt: now,
        },
      });
      expect(result).toBe('conv-group-1');
    });
  });
});
