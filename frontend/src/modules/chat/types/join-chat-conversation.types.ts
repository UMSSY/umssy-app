export interface JoinChatConversationAck {
  ok?: boolean;
  error?: string;
  data?: {
    ok?: boolean;
    error?: string;
  };
}