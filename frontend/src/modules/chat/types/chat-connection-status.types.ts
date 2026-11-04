export type ChatConnectionStatus =
  | "connected"
  | "offline"
  | "reconnecting";

export interface ChatConnectionState {
  conversationId: string | null;
  status: ChatConnectionStatus;
}