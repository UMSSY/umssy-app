export type AttachmentType = 'image' | 'file' | 'audio';

export interface UserSummary {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
}

export interface LastMessage {
  id: string;
  senderId: string;
  content: string;
  isAttachment: boolean;
  attachmentType?: AttachmentType | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  contact: UserSummary;
  lastMessage?: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export type ConversationFilter = 'all' | 'unread';

export interface GetConversationsParams {
  searchQuery?: string;
  filter?: ConversationFilter;
}

export interface StandardApiResponse<T> {
  statusCode: number;
  data: T;
  offset?: number;
  page?: number;
  detail: string;
  ok: boolean;
}