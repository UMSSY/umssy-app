import type { ChatConnectionStatus } from "./chat-connection-status.types";

export interface ChatConnectionBannerProps {
  status: Exclude<ChatConnectionStatus, "connected">;
}