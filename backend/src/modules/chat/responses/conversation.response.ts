interface ConversationBaseResponse {
  id: string;

  contact: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    isOnline: boolean;
  };
  lastMessage: {
    id: string;
    senderId: string;
    content: string;
    isAttachment: boolean;
    attachmentType: 'image' | 'file' | 'audio' | null;
    createdAt: string;
  } | null;
  unreadCount: number;
  isBlockedByMe: boolean;
  updatedAt: string;
}
export interface DirectConversationResponse extends ConversationBaseResponse {
  eventId?: never;
}

export interface EventConversationResponse extends Omit<
  ConversationBaseResponse,
  'contact'
> {
  eventId: string;
  eventTitle: string;
  contact?: never;
}

export type ConversationResponse =
  DirectConversationResponse | EventConversationResponse;
