import type { Conversation } from "../types/conversation.types";

export function withContactHeadline(conversation: Conversation, headline?: string | null): Conversation {
  if (!headline || !conversation.contact || conversation.contact.headline) return conversation;
  return { ...conversation, contact: { ...conversation.contact, headline } };
}
