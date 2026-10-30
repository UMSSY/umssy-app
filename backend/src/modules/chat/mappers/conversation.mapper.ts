import { Injectable } from '@nestjs/common';
import type { ConversationResponse } from '../responses/conversation.response.js';

export interface RawConversationMessage {
  id: string;
  senderId: string;
  content: string | null;
  sentAt: Date;
}

export interface RawConversationUser {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: Uint8Array | null;
}

export interface RawConversationEvent {
  id: string;
  title: string;
}

export interface RawConversationRecord {
  id: string;
  userAId: string | null;
  userBId: string | null;
  updatedAt: Date;
  userA: RawConversationUser | null;
  userB: RawConversationUser | null;
  messages: RawConversationMessage[];
  event?: RawConversationEvent | null;
}

@Injectable()
export class ConversationMapper {
  toAvatarUrl(photo?: Uint8Array | null): string | null {
    if (!photo || photo.length === 0) return null;
    return `data:image/jpeg;base64,${Buffer.from(photo).toString('base64')}`;
  }

  toEventConversationResponse(
    conversation: RawConversationRecord,
  ): ConversationResponse {
    const lastMessage = conversation.messages[0];
    const safeContent = lastMessage?.content ?? '';
    const isAttachment = Boolean(safeContent.startsWith('[Archivo] '));
    const content = isAttachment ? safeContent.slice(10) : safeContent;
    const attachmentType = isAttachment ? ('file' as const) : null;

    return {
      id: conversation.id,
      eventId: conversation.event?.id,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            content,
            isAttachment,
            attachmentType,
            createdAt: lastMessage.sentAt.toISOString(),
          }
        : null,
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
  }): ConversationResponse {
    const { conversation, contact, isOnline, unreadCount, isBlockedByMe } = params;
    const lastMessage = conversation.messages[0];
    const safeContent = lastMessage?.content ?? '';
    const isAttachment = safeContent.startsWith('[Archivo] ');
    const content = isAttachment ? safeContent.slice(10) : safeContent;
    const attachmentType = isAttachment ? ('file' as const) : null;
    const avatarUrl = this.toAvatarUrl(contact.photoUrl);

    return {
      id: conversation.id,
      contact: {
        id: contact.id,
        fullName: `${contact.firstName} ${contact.lastName}`.trim(),
        avatarUrl,
        isOnline,
      },
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            content,
            isAttachment,
            attachmentType,
            createdAt: lastMessage.sentAt.toISOString(),
          }
        : null,
      unreadCount,
      isBlockedByMe,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }
}
