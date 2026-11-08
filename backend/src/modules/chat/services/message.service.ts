import { MessageMapper } from '../mappers/message.mapper.js';

import { Injectable } from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import { MessageStatusService } from './message-status.service.js';
import { ChatRolePolicyService } from './chat-role-policy.service.js';
import { BlockService } from './block.service.js';
import {
  ConversationNotFoundException,
  InvalidMessageContentException,
  NotConversationParticipantException,
  UserBlockedException,
} from '../exceptions/index.js';
import { MAX_MESSAGE_LENGTH } from '../constants/chat.constants.js';
import type { MessageResponse } from '../responses/message.response.js';
import { countCharacters } from '../utils/unicode-counter.js';

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly participantRepository: ConversationParticipantRepository,
    private readonly messageStatusService: MessageStatusService,
    private readonly blockService: BlockService,
    private readonly chatRolePolicyService: ChatRolePolicyService,
    private readonly messageMapper: MessageMapper,
  ) {}

  async send(params: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<MessageResponse> {
    const conversation = await this.conversationRepository.findById(
      params.conversationId,
    );

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    const participant =
      await this.participantRepository.findByConversationAndUser(
        params.conversationId,
        params.senderId,
      );

    if (!participant) {
      throw new NotConversationParticipantException();
    }

    const otherParticipantId = this.getOtherParticipantId(
      conversation,
      params.senderId,
    );

    if (
      otherParticipantId &&
      (await this.blockService.isBlockedBetween(
        params.senderId,
        otherParticipantId,
      ))
    ) {
      throw new UserBlockedException();
    }

    if (otherParticipantId) {
      await this.chatRolePolicyService.assertCanCommunicate(
        params.senderId,
        otherParticipantId,
      );
    }

    const content = this.sanitize(params.content);
    const characterCount = countCharacters(content);

    if (characterCount === 0) {
      throw new InvalidMessageContentException(
        'El contenido del mensaje no puede estar vacío',
      );
    }

    if (characterCount > MAX_MESSAGE_LENGTH) {
      throw new InvalidMessageContentException(
        `El contenido del mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres`,
      );
    }

    const sentStatusId = await this.messageStatusService.getSentId();
    const now = new Date();

    const created = await this.messageRepository.create({
      conversationId: params.conversationId,
      senderId: params.senderId,
      content,
      statusId: sentStatusId,
      sentAt: now,
    });

    await this.conversationRepository.touchLastMessage(
      params.conversationId,
      created.id,
      now,
    );

    await this.participantRepository.markRead(
      params.conversationId,
      params.senderId,
      now,
    );

    return this.messageMapper.toResponse(created);
  }

  async getPage(params: {
    conversationId: string;
    userId: string;
    cursor: string | null;
    limit: number;
  }) {
    const participant =
      await this.participantRepository.findByConversationAndUser(
        params.conversationId,
        params.userId,
      );

    if (!participant) {
      throw new NotConversationParticipantException();
    }

    const page = await this.messageRepository.findPage({
      conversationId: params.conversationId,
      cursor: params.cursor,
      limit: params.limit,
    });

    return {
      data: page.data.map((record) => this.messageMapper.toResponse(record)),
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    const participant =
      await this.participantRepository.findByConversationAndUser(
        conversationId,
        userId,
      );

    if (!participant) {
      throw new NotConversationParticipantException();
    }

    await this.participantRepository.markRead(
      conversationId,
      userId,
      new Date(),
    );
  }

  private getOtherParticipantId(
    conversation: {
      userAId?: string | null;
      userBId?: string | null;
    },
    senderId: string,
  ): string | null {
    const { userAId, userBId } = conversation;

    if (!userAId || !userBId) {
      return null;
    }

    const sender = senderId.trim().toLowerCase();

    return userAId.toLowerCase() === sender ? userBId : userAId;
  }

  private sanitize(raw: string): string {
    const cleaned = raw
      .split('')
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code >= 32 || code === 10 || code === 13;
      })
      .join('');

    return cleaned.trim();
  }
}
