export type AttachmentMediaType = 'IMAGE' | 'PDF';

export interface MessageAttachment {
  id: string;
  messageId?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string | null;
  type?: string | null;
  createdAt?: string;
}

