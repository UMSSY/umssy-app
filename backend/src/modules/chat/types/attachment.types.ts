export interface AttachmentFileDownload {
  fileName: string;
  mimeType: string;
  fileSize: number;
  content: Buffer;
}

export interface AttachmentRecord {
  id: string;
  messageId: string;
  typeId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string | null;
  thumbnailUrl: string | null;
  createdAt: Date;
  type?: {
    title: string;
  };
}
