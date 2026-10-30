import type { Message } from "../types/conversation.types";

export function mergeMessages(
  conversationId: string,
  messages: Message[],
): Message[] {
  return [
    ...new Map(
      messages
        .filter((message) => message.conversationId === conversationId)
        .map((message) => [message.id, message]),
    ).values(),
  ].sort(
    (a, b) =>
      Date.parse(a.timestamp || a.createdAt) -
        Date.parse(b.timestamp || b.createdAt) || a.id.localeCompare(b.id),
  );
}
