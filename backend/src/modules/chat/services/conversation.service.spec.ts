import { ForbiddenException } from '@nestjs/common';
import { UserBlockedException } from '../exceptions/index.js';
import { describe, expect, it, vi } from 'vitest';

import { ConversationService } from './conversation.service.js';
import { ConversationMapper } from '../mappers/conversation.mapper.js';

import type { ConversationRepository } from '../repositories/conversation.repository.js';
import type { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import type { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import type { ConnectionRequestRepository } from '../repositories/connection-request.repository.js';
import type { UserPresenceService } from './user-presence.service.js';

import type { BlockService } from './block.service.js';
import type { ChatRolePolicyService } from './chat-role-policy.service.js';

const noBlocks = () =>
  ({
    findBlockedIdsBy: vi.fn().mockResolvedValue(new Set<string>()),
    isBlockedBetween: vi.fn().mockResolvedValue(false),
  }) as unknown as BlockService;

const allowedRoles = () =>
  ({
    assertCanCommunicate: vi.fn().mockResolvedValue(undefined),
  }) as unknown as ChatRolePolicyService;

describe('ConversationService', () => {
  it('findAllForUser maps and returns conversations for the current user', async () => {
    const conversationRepositoryMock = {
      findUserConversations: vi.fn().mockResolvedValue([
        {
          id: 'conv-1',
          userAId: 'user-current',
          userBId: 'user-contact',
          updatedAt: new Date('2026-01-02T10:00:00Z'),
          userA: {
            id: 'user-current',
            firstName: 'Current',
            lastName: 'User',
          },
          userB: {
            id: 'user-contact',
            firstName: 'Contact',
            lastName: 'Person',
          },
          messages: [
            {
              id: 'msg-1',
              senderId: 'user-contact',
              content: 'Hola',
              sentAt: new Date('2026-01-02T10:00:00Z'),
            },
          ],
        },
      ]),
    } as unknown as ConversationRepository;

    const participantRepositoryMock = {
      findByConversationAndUser: vi.fn().mockResolvedValue({
        lastReadAt: new Date('2026-01-01T10:00:00Z'),
      }),
      countUnread: vi.fn().mockResolvedValue(1),
    } as unknown as ConversationParticipantRepository;

    const userLookupRepositoryMock =
      {} as unknown as UserLookupRepository;

    const userPresenceServiceMock = {
      mapOnlineStatus: vi.fn().mockResolvedValue(
        new Map([['user-contact', true]]),
      ),
    } as unknown as UserPresenceService;

    const connectionRequestRepositoryMock =
      {} as unknown as ConnectionRequestRepository;

    const service = new ConversationService(
      conversationRepositoryMock,
      participantRepositoryMock,
      userLookupRepositoryMock,
      userPresenceServiceMock,
      connectionRequestRepositoryMock,
      noBlocks(),
      new ConversationMapper(),
      allowedRoles(),
    );

    const result = await service.findAllForUser('user-current');

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('conv-1');
    expect(result[0]?.contact?.id).toBe('user-contact');
    expect(result[0]?.contact?.fullName).toBe('Contact Person');
    expect(result[0]?.contact?.isOnline).toBe(true);
    expect(result[0]?.unreadCount).toBe(1);
    expect(result[0]?.lastMessage?.content).toBe('Hola');
  });

  it('rejects self-conversation even when UUID has different casing', async () => {
    const service = new ConversationService(
      {} as unknown as ConversationRepository,
      {} as unknown as ConversationParticipantRepository,
      {} as unknown as UserLookupRepository,
      {} as unknown as UserPresenceService,
      {} as unknown as ConnectionRequestRepository,
      noBlocks(),
      new ConversationMapper(),
      allowedRoles(),
    );

    await expect(
      service.getOrCreate(
        '123e4567-e89b-12d3-a456-426614174000',
        '123E4567-E89B-12D3-A456-426614174000',
      ),
    ).rejects.toThrow(
      /No es posible iniciar una conversaci/,
    );
  });

  it('recovers gracefully from concurrent creation unique constraint collision (P2002)', async () => {
    const existingConv = {
      id: 'conv-concurrent',
      userAId: 'user-a',
      userBId: 'user-b',
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      userA: {
        id: 'user-a',
        firstName: 'User',
        lastName: 'A',
        photoUrl: null,
      },
      userB: {
        id: 'user-b',
        firstName: 'User',
        lastName: 'B',
        photoUrl: null,
      },
      messages: [],
    };

    const conversationRepositoryMock = {
      findByOrderedPair: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingConv),
      createWithParticipants: vi.fn().mockRejectedValue({
        code: 'P2002',
        message:
          'Unique constraint failed on the fields: (user_a_id, user_b_id)',
      }),
    } as unknown as ConversationRepository;

    const participantRepositoryMock = {
      findByConversationAndUser: vi.fn().mockResolvedValue(null),
      countUnread: vi.fn().mockResolvedValue(0),
    } as unknown as ConversationParticipantRepository;

    const userLookupRepositoryMock = {
      findById: vi.fn().mockResolvedValue({
        id: 'user-b',
        isActive: true,
      }),
    } as unknown as UserLookupRepository;

    const userPresenceServiceMock = {
      mapOnlineStatus: vi.fn().mockResolvedValue(new Map()),
    } as unknown as UserPresenceService;

    const connectionRequestRepositoryMock = {
      findAcceptedRequest: vi.fn().mockResolvedValue({
        id: 'accepted-request',
      }),
    } as unknown as ConnectionRequestRepository;

    const service = new ConversationService(
      conversationRepositoryMock,
      participantRepositoryMock,
      userLookupRepositoryMock,
      userPresenceServiceMock,
      connectionRequestRepositoryMock,
      noBlocks(),
      new ConversationMapper(),
      allowedRoles(),
    );

    const result = await service.getOrCreateWithStatus(
      'user-a',
      'user-b',
    );

    expect(result.isCreated).toBe(false);
    expect(result.conversation.id).toBe('conv-concurrent');
  });

  it('maps custom binary photo to base64 data URI in contact avatarUrl', async () => {
    const photoBuffer = Buffer.from('fake-image-binary-data');

    const conversationRepositoryMock = {
      findUserConversations: vi.fn().mockResolvedValue([
        {
          id: 'conv-photo',
          userAId: 'user-me',
          userBId: 'user-other',
          updatedAt: new Date('2026-01-01T00:00:00Z'),
          userA: {
            id: 'user-me',
            firstName: 'Me',
            lastName: 'Self',
          },
          userB: {
            id: 'user-other',
            firstName: 'Other',
            lastName: 'User',
            photoUrl: new Uint8Array(photoBuffer),
          },
          messages: [],
        },
      ]),
    } as unknown as ConversationRepository;

    const participantRepositoryMock = {
      findByConversationAndUser: vi.fn().mockResolvedValue(null),
      countUnread: vi.fn().mockResolvedValue(0),
    } as unknown as ConversationParticipantRepository;

    const userPresenceServiceMock = {
      mapOnlineStatus: vi.fn().mockResolvedValue(new Map()),
    } as unknown as UserPresenceService;

    const service = new ConversationService(
      conversationRepositoryMock,
      participantRepositoryMock,
      {} as unknown as UserLookupRepository,
      userPresenceServiceMock,
      {} as unknown as ConnectionRequestRepository,
      noBlocks(),
      new ConversationMapper(),
      allowedRoles(),
    );

    const conversations =
      await service.findAllForUser('user-me');

    expect(conversations[0]?.contact?.avatarUrl).toBe(
      `data:image/jpeg;base64,${photoBuffer.toString('base64')}`,
    );
  });

  describe('isBlockedByMe', () => {
    const buildConversation = (id: string, contactId: string) => ({
      id,
      userAId: 'user-me',
      userBId: contactId,
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      userA: { id: 'user-me', firstName: 'Me', lastName: 'Self' },
      userB: { id: contactId, firstName: 'Contact', lastName: id },
      messages: [],
    });

    const buildService = (blockedIds: string[], conversations: unknown[]) => {
      const blockService = {
        findBlockedIdsBy: vi.fn().mockResolvedValue(new Set(blockedIds)),
        isBlockedBetween: vi.fn().mockImplementation(
          async (_userId: string, contactId: string) =>
            blockedIds.includes(contactId),
        ),
      };
      const service = new ConversationService(
        {
          findUserConversations: vi.fn().mockResolvedValue(conversations),
          findByOrderedPair: vi.fn().mockResolvedValue(conversations[0] ?? null),
        } as unknown as ConversationRepository,
        {
          findByConversationAndUser: vi.fn().mockResolvedValue(null),
          countUnread: vi.fn().mockResolvedValue(0),
        } as unknown as ConversationParticipantRepository,
        { findById: vi.fn().mockResolvedValue({ id: 'user-blocked', isActive: true }) } as unknown as UserLookupRepository,
        { mapOnlineStatus: vi.fn().mockResolvedValue(new Map()) } as unknown as UserPresenceService,
        {
          findAcceptedRequest: vi.fn().mockResolvedValue({ id: 'accepted-request' }),
        } as unknown as ConnectionRequestRepository,
        blockService as unknown as BlockService,
        new ConversationMapper(),
        allowedRoles(),
      );
      return { service, blockService };
    };

    it('marks only the conversation with the blocked contact and queries blocks once', async () => {
      const { service, blockService } = buildService(['user-blocked'], [
        buildConversation('conv-1', 'user-blocked'),
        buildConversation('conv-2', 'user-ok'),
        buildConversation('conv-3', 'user-ok-2'),
      ]);

      const result = await service.findAllForUser('user-me');

      expect(result.map((c) => c.isBlockedByMe)).toEqual([true, false, false]);
      expect(blockService.findBlockedIdsBy).toHaveBeenCalledTimes(1);
      expect(blockService.findBlockedIdsBy).toHaveBeenCalledWith('user-me');
    });

    it('returns false for the blocked user (does not reveal who blocked)', async () => {
      const { service } = buildService([], [buildConversation('conv-1', 'user-blocker')]);
      const result = await service.findAllForUser('user-me');
      expect(result[0]?.isBlockedByMe).toBe(false);
    });

    it('impide abrir una conversación con un usuario bloqueado', async () => {
      const { service } = buildService(
        ['user-blocked'],
        [buildConversation('conv-1', 'user-blocked')],
      );

      await expect(
        service.getOrCreateWithStatus('user-me', 'user-blocked'),
      ).rejects.toThrow(UserBlockedException);
    });
  });

  it('impide crear una conversación sin conexión aceptada', async () => {
    const conversationRepositoryMock = {
      findByOrderedPair: vi.fn().mockResolvedValue(null),
      createWithParticipants: vi.fn(),
    };

    const userLookupRepositoryMock = {
      findById: vi.fn().mockResolvedValue({
        id: 'user-b',
        isActive: true,
      }),
    };

    const connectionRequestRepositoryMock = {
      findAcceptedRequest: vi.fn().mockResolvedValue(null),
    };

    const service = new ConversationService(
      conversationRepositoryMock as unknown as ConversationRepository,
      {} as unknown as ConversationParticipantRepository,
      userLookupRepositoryMock as unknown as UserLookupRepository,
      {} as unknown as UserPresenceService,
      connectionRequestRepositoryMock as unknown as ConnectionRequestRepository,
      noBlocks(),
      new ConversationMapper(),
      allowedRoles(),
    );

    await expect(
      service.getOrCreateWithStatus('user-a', 'user-b'),
    ).rejects.toThrow(ForbiddenException);

    expect(
      connectionRequestRepositoryMock.findAcceptedRequest,
    ).toHaveBeenCalledWith('user-a', 'user-b');

    expect(
      conversationRepositoryMock.createWithParticipants,
    ).not.toHaveBeenCalled();
  });

  it('permite crear una conversación cuando existe conexión aceptada', async () => {
    const createdConversation = {
      id: 'conv-new',
      userAId: 'user-a',
      userBId: 'user-b',
      updatedAt: new Date('2026-01-02T10:00:00Z'),
      userA: {
        id: 'user-a',
        firstName: 'User',
        lastName: 'A',
        photoUrl: null,
      },
      userB: {
        id: 'user-b',
        firstName: 'User',
        lastName: 'B',
        photoUrl: null,
      },
      messages: [],
    };

    const conversationRepositoryMock = {
      findByOrderedPair: vi.fn().mockResolvedValue(null),
      createWithParticipants: vi
        .fn()
        .mockResolvedValue(createdConversation),
    };

    const participantRepositoryMock = {
      findByConversationAndUser: vi.fn().mockResolvedValue(null),
      countUnread: vi.fn().mockResolvedValue(0),
    };

    const userLookupRepositoryMock = {
      findById: vi.fn().mockResolvedValue({
        id: 'user-b',
        isActive: true,
      }),
    };

    const userPresenceServiceMock = {
      mapOnlineStatus: vi.fn().mockResolvedValue(new Map()),
    };

    const connectionRequestRepositoryMock = {
      findAcceptedRequest: vi.fn().mockResolvedValue({
        id: 'request-accepted',
        senderId: 'user-a',
        receiverId: 'user-b',
      }),
    };

    const service = new ConversationService(
      conversationRepositoryMock as unknown as ConversationRepository,
      participantRepositoryMock as unknown as ConversationParticipantRepository,
      userLookupRepositoryMock as unknown as UserLookupRepository,
      userPresenceServiceMock as unknown as UserPresenceService,
      connectionRequestRepositoryMock as unknown as ConnectionRequestRepository,
      noBlocks(),
      new ConversationMapper(),
      allowedRoles(),
    );

    const result = await service.getOrCreateWithStatus(
      'user-a',
      'user-b',
    );

    expect(result.isCreated).toBe(true);
    expect(result.conversation.id).toBe('conv-new');

    expect(
      connectionRequestRepositoryMock.findAcceptedRequest,
    ).toHaveBeenCalledWith('user-a', 'user-b');

    expect(
      conversationRepositoryMock.createWithParticipants,
    ).toHaveBeenCalledOnce();
  });

  it('devuelve una conversación existente sin crear otra', async () => {
    const existingConversation = {
      id: 'conv-existing',
      userAId: 'user-a',
      userBId: 'user-b',
      updatedAt: new Date('2026-01-02T10:00:00Z'),
      userA: {
        id: 'user-a',
        firstName: 'User',
        lastName: 'A',
        photoUrl: null,
      },
      userB: {
        id: 'user-b',
        firstName: 'User',
        lastName: 'B',
        photoUrl: null,
      },
      messages: [],
    };

    const conversationRepositoryMock = {
      findByOrderedPair: vi
        .fn()
        .mockResolvedValue(existingConversation),
      createWithParticipants: vi.fn(),
    };

    const participantRepositoryMock = {
      findByConversationAndUser: vi.fn().mockResolvedValue(null),
      countUnread: vi.fn().mockResolvedValue(0),
    };

    const userLookupRepositoryMock = {
      findById: vi.fn().mockResolvedValue({
        id: 'user-b',
        isActive: true,
      }),
    };

    const userPresenceServiceMock = {
      mapOnlineStatus: vi.fn().mockResolvedValue(new Map()),
    };

    const connectionRequestRepositoryMock = {
      findAcceptedRequest: vi.fn(),
    };

    const service = new ConversationService(
      conversationRepositoryMock as unknown as ConversationRepository,
      participantRepositoryMock as unknown as ConversationParticipantRepository,
      userLookupRepositoryMock as unknown as UserLookupRepository,
      userPresenceServiceMock as unknown as UserPresenceService,
      connectionRequestRepositoryMock as unknown as ConnectionRequestRepository,
      noBlocks(),
      new ConversationMapper(),
      allowedRoles(),
    );

    const result = await service.getOrCreateWithStatus(
      'user-a',
      'user-b',
    );

    expect(result.isCreated).toBe(false);
    expect(result.conversation.id).toBe('conv-existing');

    expect(
      conversationRepositoryMock.createWithParticipants,
    ).not.toHaveBeenCalled();

    expect(
      connectionRequestRepositoryMock.findAcceptedRequest,
    ).not.toHaveBeenCalled();
  });
});