export interface AttachmentResponse {
  id: string;
  messageId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  createdAt: string;
}
