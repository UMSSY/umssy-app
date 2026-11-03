import type { MessageAttachment } from './attachment.types';

export interface ChatPdfCardProps {
  attachment: MessageAttachment;
  isOwn?: boolean;
  onDownload?: (attachment: MessageAttachment) => void;
  isDownloading?: boolean;
}

