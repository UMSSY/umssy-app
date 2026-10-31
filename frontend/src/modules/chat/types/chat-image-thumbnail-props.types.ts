import type { MessageAttachment } from './attachment.types';

export interface ChatImageThumbnailProps {
  attachment: MessageAttachment;
  caption?: string | null;
  isOwn?: boolean;
  onImageClick?: (attachment: MessageAttachment) => void;
}

