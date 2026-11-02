import type { AttachmentResponse } from './attachment.response.js';

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'read' | 'error';
  isAttachment: boolean;
  attachmentType: 'image' | 'file' | 'audio' | null;
  attachments?: AttachmentResponse[];
  attachment?: AttachmentResponse;
}
