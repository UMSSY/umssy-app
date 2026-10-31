export interface RawConversationMessage {
  id: string;
  senderId: string;
  content: string | null;
  sentAt: Date;
}
