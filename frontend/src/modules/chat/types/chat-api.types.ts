import type { AttachmentType, Message } from './conversation.types';

export interface GetPaginatedMessagesParams {
  conversationId: string;
  cursor?: string | null;
  limit?: number;
}

export interface PaginatedMessagesResponse {
  data: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface RawBackendAttachmentItem {
  id: string;
  messageId?: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  type?: string | { title?: string } | null;
  createdAt?: string;
}

export interface RawBackendMessageItem {
  id?: string;
  conversationId?: string;
  senderId?: string;
  content?: string;
  timestamp?: string;
  createdAt?: string;
  sentAt?: string;
  status?: string;
  isAttachment?: boolean;
  attachmentType?: AttachmentType | null;
  attachment?: RawBackendAttachmentItem | null;
  attachments?: RawBackendAttachmentItem[];
}

export interface ChatUserResponse {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  role: string;
  isOnline: boolean;
}
