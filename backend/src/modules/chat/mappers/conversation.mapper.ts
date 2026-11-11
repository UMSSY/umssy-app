import { Injectable } from '@nestjs/common';

import { UserNotFoundException } from '../exceptions/index.js';

import type {
  ConversationResponse,
  EventConversationResponse,
} from '../responses/conversation.response.js';

import type { RawConversationMessage } from '../types/raw-conversation-message.types.js';
import type { RawConversationUser } from '../types/raw-conversation-user.types.js';
import type { RawConversationRecord } from '../types/raw-conversation-record.types.js';
import type { RawConversationParticipant } from '../types/raw-conversation-participant.types.js';
import type { EventRoomJoinedPayload } from '../types/event-room-joined-payload.types.js';

@Injectable()
export class ConversationMapper {
  private toLastMessage(
    message?: RawConversationMessage,
  ): ConversationResponse['lastMessage'] {
    if (!message) return null;

    const content = message.content ?? '';
    const isAttachment = content.startsWith('[Archivo] ');

    return {
      id: message.id,
      senderId: message.senderId,
      content: isAttachment ? content.slice(10) : content,
      isAttachment,
      attachmentType: isAttachment ? 'file' : null,
      createdAt: message.sentAt.toISOString(),
    };
  }

  private toEventParticipants(
    participants: RawConversationParticipant[],
  ): EventRoomJoinedPayload['participants'] {
    return participants.map((participant) => ({
      id: participant.userId,
      fullName:
        `${participant.user.firstName} ${participant.user.lastName}`.trim(),
    }));
  }

  toAvatarUrl(photo?: Uint8Array | null): string | null {
    if (!photo || photo.length === 0) return null;

    return `data:image/jpeg;base64,${Buffer.from(photo).toString('base64')}`;
  }

  toEventConversationResponse(
    conversation: RawConversationRecord,
  ): EventConversationResponse {
    if (!conversation.event) {
      throw new UserNotFoundException();
    }

    return {
      id: conversation.id,
      eventId: conversation.event.id,
      eventTitle: conversation.event.title,
      createdAt: (
        conversation.createdAt ?? conversation.updatedAt
      ).toISOString(),
      participants: this.toEventParticipants(conversation.participants ?? []),
      lastMessage: this.toLastMessage(conversation.messages[0]),
      unreadCount: 0,
      isBlockedByMe: false,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  toDirectConversationResponse(params: {
    conversation: RawConversationRecord;
    contact: RawConversationUser;
    isOnline: boolean;
    unreadCount: number;
    isBlockedByMe: boolean;
    academicTitle: string | null;
    skills: string[];
  }): ConversationResponse {
    const {
      conversation,
      contact,
      isOnline,
      unreadCount,
      isBlockedByMe,
      academicTitle,
      skills,
    } = params;

    const avatarUrl = this.toAvatarUrl(contact.photoUrl);
    const roleName = contact.roles?.[0]?.role?.name ?? null;

    return {
      id: conversation.id,
      contact: {
        id: contact.id,
        fullName: `${contact.firstName} ${contact.lastName}`.trim(),
        avatarUrl,
        isOnline,
        role: roleName,
        roleName,
        email: contact.email ?? null,
        academicTitle,
        skills,
      },
      lastMessage: this.toLastMessage(conversation.messages[0]),
      unreadCount,
      isBlockedByMe,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  toEventRoomJoinedPayload(params: {
    conversationId: string;
    eventId: string;
    eventTitle: string;
    createdAt: Date;
    participants: RawConversationParticipant[];
  }): EventRoomJoinedPayload {
    return {
      conversationId: params.conversationId,
      eventId: params.eventId,
      name: params.eventTitle,
      createdAt: params.createdAt.toISOString(),
      participants: this.toEventParticipants(params.participants),
    };
  }
}
