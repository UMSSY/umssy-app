import { UserNotFoundException } from '../exceptions/index.js';
import { Injectable } from '@nestjs/common';
import type { ConversationResponse } from '../responses/conversation.response.js';

import type { RawConversationMessage } from '../types/raw-conversation-message.types.js';
import type { RawConversationUser } from '../types/raw-conversation-user.types.js';
import type { RawConversationRecord } from '../types/raw-conversation-record.types.js';

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

  toAvatarUrl(photo?: Uint8Array | null): string | null {
    if (!photo || photo.length === 0) return null;
    return `data:image/jpeg;base64,${Buffer.from(photo).toString('base64')}`;
  }

  toEventConversationResponse(
    conversation: RawConversationRecord,
  ): ConversationResponse {
    if (!conversation.event) throw new UserNotFoundException();
    return {
      id: conversation.id,
      eventId: conversation.event.id,
      eventTitle: conversation.event.title,
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
  }): ConversationResponse {
    const { conversation, contact, isOnline, unreadCount, isBlockedByMe } =
      params;
    const avatarUrl = this.toAvatarUrl(contact.photoUrl);

    return {
      id: conversation.id,
      contact: {
        id: contact.id,
        fullName: `${contact.firstName} ${contact.lastName}`.trim(),
        avatarUrl,
        isOnline,
      },
      lastMessage: this.toLastMessage(conversation.messages[0]),
      unreadCount,
      isBlockedByMe,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }
}
