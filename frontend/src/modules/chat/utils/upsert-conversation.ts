import type { Conversation } from "../types/conversation.types";

export function upsertConversation(
  conversations: Conversation[],
  conversation: Conversation,
): Conversation[] {
  const exists = conversations.some((item) => item.id === conversation.id);
  return exists
    ? conversations.map((item) => (item.id === conversation.id ? conversation : item))
    : [conversation, ...conversations];
}
