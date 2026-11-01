import { ForbiddenException, Injectable } from '@nestjs/common';

import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import { ConnectionRequestRepository } from '../repositories/connection-request.repository.js';
import { ConversationMapper, type RawConversationRecord } from '../mappers/conversation.mapper.js';

import { UserPresenceService } from './user-presence.service.js';
import { BlockService } from './block.service.js';
import { ChatRolePolicyService } from './chat-role-policy.service.js';
import { ConversationMapper } from '../mappers/conversation.mapper.js';
import type { RawConversationRecord } from '../types/raw-conversation-record.types.js';

import {
  InactiveUserException,
  SelfConversationException,
  UserNotFoundException,
  UserBlockedException,
} from '../exceptions/index.js';

import type { ConversationResponse } from '../responses/conversation.response.js';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly participantRepository: ConversationParticipantRepository,
    private readonly userLookupRepository: UserLookupRepository,
    private readonly userPresenceService: UserPresenceService,
    private readonly connectionRequestRepository: ConnectionRequestRepository,
    private readonly blockService: BlockService,
    private readonly conversationMapper: ConversationMapper,
    private readonly chatRolePolicyService: ChatRolePolicyService,
  ) {}

  async getOrCreate(
    currentUserId: string,
    contactId: string,
  ): Promise<ConversationResponse> {
    const { conversation } = await this.getOrCreateWithStatus(
      currentUserId,
      contactId,
    );

    return conversation;
  }

  async getOrCreateWithStatus(
    currentUserId: string,
    contactId: string,
  ): Promise<{
    conversation: ConversationResponse;
    isCreated: boolean;
  }> {
    const normalizedCurrentUserId = currentUserId.trim().toLowerCase();
    const normalizedContactId = contactId.trim().toLowerCase();

    if (normalizedCurrentUserId === normalizedContactId) {
      throw new SelfConversationException();
    }

    const contact = await this.userLookupRepository.findById(
      normalizedContactId,
    );

    if (!contact) {
      throw new UserNotFoundException();
    }

    if (!contact.isActive) {
      throw new InactiveUserException();
    }

    const [userAId, userBId] =
      normalizedCurrentUserId < normalizedContactId
        ? [normalizedCurrentUserId, normalizedContactId]
        : [normalizedContactId, normalizedCurrentUserId];

    const blockedIds = await this.blockService.findBlockedIdsBy(
      normalizedCurrentUserId,
    );

    // HU-13: impedir abrir o crear conversaciones con usuarios bloqueados.
    if (
      await this.blockService.isBlockedBetween(
        normalizedCurrentUserId,
        normalizedContactId,
      )
    ) {
      throw new UserBlockedException();
    }

    // HU-08: consultar los roles vigentes antes de abrir o crear una conversación.
    await this.chatRolePolicyService.assertCanCommunicate(
      normalizedCurrentUserId,
      normalizedContactId,
    );

    const existing = await this.conversationRepository.findByOrderedPair(
      userAId,
      userBId,
    );

    if (existing) {
      const conversation = await this.toResponse(
        existing,
        normalizedCurrentUserId,
        blockedIds,
      );

      return {
        conversation,
        isCreated: false,
      };
    }

    // HU-09: exigir una conexión aceptada antes de crear una conversación.
    const acceptedRequest =
      await this.connectionRequestRepository.findAcceptedRequest(
        userAId,
        userBId,
      );

    if (!acceptedRequest) {
      throw new ForbiddenException(
        'Debes tener una solicitud de conexión aceptada para iniciar una conversación.',
      );
    }

    try {
      const created = await this.conversationRepository.createWithParticipants(
        userAId,
        userBId,
        new Date(),
      );

      const conversation = await this.toResponse(
        created,
        normalizedCurrentUserId,
        blockedIds,
      );

      return {
        conversation,
        isCreated: true,
      };
    } catch (error: unknown) {
      // Recuperación ante creación concurrente.
      const err = error as {
        code?: string;
        message?: string;
      };

      if (
        err?.code === 'P2002' ||
        err?.message?.includes('P2002') ||
        err?.message?.includes('Unique constraint')
      ) {
        const concurrentExisting =
          await this.conversationRepository.findByOrderedPair(
            userAId,
            userBId,
          );

        if (concurrentExisting) {
          const conversation = await this.toResponse(
            concurrentExisting,
            normalizedCurrentUserId,
            blockedIds,
          );

          return {
            conversation,
            isCreated: false,
          };
        }
      }

      throw error;
    }
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const participant =
      await this.participantRepository.findByConversationAndUser(
        conversationId,
        userId,
      );

    return participant !== null;
  }

  async findAllForUser(
    currentUserId: string,
  ): Promise<ConversationResponse[]> {
    const [list, blockedIds] = await Promise.all([
      this.conversationRepository.findUserConversations(currentUserId),
      this.blockService.findBlockedIdsBy(currentUserId),
    ]);

    return Promise.all(
      list.map((conversation) =>
        this.toResponse(conversation, currentUserId, blockedIds),
      ),
    );
  }

  private async toResponse(
    conversation: RawConversationRecord,
    currentUserId: string,
    blockedIds: ReadonlySet<string>,
  ): Promise<ConversationResponse> {
    // Las salas de eventos no se convierten como conversaciones privadas.
    if (
      conversation.event?.id ||
      (!conversation.userAId && !conversation.userBId)
    ) {
      return this.conversationMapper.toEventConversationResponse(conversation);
    }

    const contact =
      conversation.userAId === currentUserId
        ? conversation.userB
        : conversation.userA;

    if (!contact) {
      throw new UserNotFoundException();
    }

    const [onlineMap, participant] = await Promise.all([
      this.userPresenceService.mapOnlineStatus([contact.id]),
      this.participantRepository.findByConversationAndUser(
        conversation.id,
        currentUserId,
      ),
    ]);

    const unreadCount = participant
      ? await this.participantRepository.countUnread(
          conversation.id,
          currentUserId,
          participant.lastReadAt,
        )
      : 0;

    return this.conversationMapper.toDirectConversationResponse({
      conversation,
      contact,
      isOnline: onlineMap.get(contact.id) ?? false,
      unreadCount,
      isBlockedByMe: blockedIds.has(contact.id.toLowerCase()),
    });
  }
}
