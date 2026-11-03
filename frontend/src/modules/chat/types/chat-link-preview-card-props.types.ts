import type { LinkPreviewData } from "./link-preview.types";

export interface ChatLinkPreviewCardProps {
  preview: LinkPreviewData;
  isOwn?: boolean;
  className?: string;
}

