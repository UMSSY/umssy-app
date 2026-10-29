import type { MessageAttachment } from './attachment.types';

export type AttachmentType = 'image' | 'file' | 'audio';

export interface UserSummary {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  role?: string | null;
  roleName?: string | null;
  email?: string | null;
  isEmailVisible?: boolean;
  academicTitle?: string | null;
  isAcademicTitleVisible?: boolean;
  skills?: string[];
  areSkillsVisible?: boolean;
}

export type MessageStatus = 'sending' | 'sent' | 'error' | 'read';

export interface LastMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  timestamp?: string;
  status?: MessageStatus;
  isAttachment?: boolean;
  attachmentType?: AttachmentType | null;
  attachment?: MessageAttachment | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  createdAt: string;
  sentAt?: string;
  isAttachment?: boolean;
  attachmentType?: AttachmentType | null;
  attachment?: MessageAttachment | null;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  contact: UserSummary;
  lastMessage?: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
  isBlockedByMe?: boolean;
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

export interface SendMessagePayload {
  conversationId: string;
  senderId?: string;
  content: string;
}

export interface SendMessageOptions {
  forceError?: boolean;
  forceOffline?: boolean;
  latencyMs?: number;
}

export type SendMessageResponse = StandardApiResponse<Message>;
