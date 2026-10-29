// Exportacion publica del modulo de mensajeria
export * from './views/chat-view';
export * from './types/conversation.types';
export * from './types/attachment.types';
export * from './types/link-preview.types';
export * from './contexts/socket-context';
export { ChatPanel, ChatDock } from "./components/chat-panel";
export { MessagingUiProvider } from "./contexts/messaging-ui-context";
export { ChatImageThumbnail } from "./components/chat-image-thumbnail";
export { ChatPdfCard } from "./components/chat-pdf-card";
export { ChatLinkPreviewCard } from "./components/chat-link-preview-card";
export { ChatMessageText } from "./components/chat-message-text";
export { MessageItem } from "./components/message-item";
export { useLinkPreview } from "./hooks/use-link-preview";
export {
  parseMessageWithLinks,
  extractFirstValidUrl,
  isSafeHttpUrl,
  extractDomainFromUrl,
} from "./utils/link-parser";
