let activeConversationId: string | null = null;

export function setActiveConversationId(conversationId: string | null): void {
  activeConversationId = conversationId;
}

export function getActiveConversationId(): string | null {
  return activeConversationId;
}
