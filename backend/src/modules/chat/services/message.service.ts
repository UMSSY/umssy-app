import { MessageMapper } from '../mappers/message.mapper.js';

import {
  Inject,
  Injectable,
  Logger,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import { MessageStatusService } from './message-status.service.js';
import { ChatRolePolicyService } from './chat-role-policy.service.js';
import { BlockService } from './block.service.js';
import { ChatVisibilityService } from './chat-visibility.service.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { EventsService } from '../../events/services/events.service.js';
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
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly participantRepository: ConversationParticipantRepository,
    private readonly messageStatusService: MessageStatusService,
    private readonly blockService: BlockService,
    private readonly chatRolePolicyService: ChatRolePolicyService,
    private readonly messageMapper: MessageMapper,
    @Optional()
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService?: NotificationsService,
    @Optional()
    @Inject(forwardRef(() => ChatVisibilityService))
    private readonly chatVisibilityService?: ChatVisibilityService,
    @Optional()
    @Inject(forwardRef(() => UserLookupRepository))
    private readonly userLookupRepository?: UserLookupRepository,
    @Optional()
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService?: EventsService,
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
        {
          contextType: conversation.contextType ?? undefined,
          contextId: conversation.contextId ?? undefined,
        },
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

    await this.dispatchMessageNotification({
      conversationId: params.conversationId,
      senderId: params.senderId,
      previewText: content,
      conversation,
    });

    return this.messageMapper.toResponse(created);
  }

  async dispatchMessageNotification(params: {
    conversationId: string;
    senderId: string;
    previewText: string;
    conversation?: {
      id: string;
      eventId?: string | null;
      userAId?: string | null;
      userBId?: string | null;
    } | null;
  }): Promise<void> {
    if (!this.notificationsService) return;

    try {
      const conversation =
        params.conversation ??
        (await this.conversationRepository.findById(params.conversationId));
      if (!conversation) return;

      const sender = await this.userLookupRepository?.findActiveById(
        params.senderId,
      );
      const senderName = sender
        ? `${sender.firstName} ${sender.lastName}`.trim()
        : 'Usuario';

      const isGroup = Boolean(conversation.eventId);
      let recipientIds: string[] = [];

      if (isGroup) {
        const participants =
          await this.conversationRepository.findParticipantsByConversationId(
            params.conversationId,
          );
        recipientIds = participants
          .map((p) => p.userId)
          .filter((uid) => uid !== params.senderId);
      } else {
        const otherId = this.getOtherParticipantId(
          conversation,
          params.senderId,
        );
        if (otherId) {
          recipientIds = [otherId];
        }
      }

      if (recipientIds.length === 0) return;

      const eligibleRecipients: string[] = [];
      let lastRecipientCount = 1;

      for (const recipientId of recipientIds) {
        if (
          await this.blockService.isBlockedBetween(params.senderId, recipientId)
        ) {
          continue;
        }

        if (
          this.chatVisibilityService?.isConversationOpen(
            recipientId,
            params.conversationId,
          )
        ) {
          continue;
        }

        eligibleRecipients.push(recipientId);

        const participant =
          await this.participantRepository.findByConversationAndUser(
            params.conversationId,
            recipientId,
          );
        const count = await this.participantRepository.countUnread(
          params.conversationId,
          recipientId,
          participant?.lastReadAt ?? null,
        );
        lastRecipientCount = Math.max(1, count);
      }

      if (eligibleRecipients.length === 0) return;

      if (isGroup) {
        let groupName = 'Grupo de chat';
        if (conversation.eventId && this.eventsService) {
          const event = await this.eventsService.findById(conversation.eventId);
          if (event?.title) {
            groupName = event.title;
          }
        }

        await this.notificationsService.notify({
          recipientIds: eligibleRecipients,
          actorId: params.senderId,
          type: NotificationType.CHAT_GROUP_MESSAGE,
          payload: {
            groupName,
            senderName,
            previewText: params.previewText,
            messageCount: lastRecipientCount,
          },
          actionUrl: `/chat?conversationId=${params.conversationId}`,
          groupKey: params.conversationId,
        });
      } else {
        await this.notificationsService.notify({
          recipientIds: eligibleRecipients,
          actorId: params.senderId,
          type: NotificationType.CHAT_MESSAGE,
          payload: {
            senderName,
            previewText: params.previewText,
            messageCount: lastRecipientCount,
          },
          actionUrl: `/chat?conversationId=${params.conversationId}`,
          groupKey: params.conversationId,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to dispatch message notification for conversation ${params.conversationId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
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
