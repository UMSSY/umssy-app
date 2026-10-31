import type { Message } from './conversation.types';
import type { MessageAttachment } from './attachment.types';

export interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showDateSeparator?: boolean;
  onDownloadAttachment?: (attachment: MessageAttachment) => void;
  onImageClick?: (attachment: MessageAttachment) => void;
}

