import type { Conversation } from "../types/conversation.types";

export function findConversationByContext(
  conversations: Conversation[],
  contextId: string,
): Conversation | undefined {
  return conversations.find((item) => item.contextId === contextId);
}
