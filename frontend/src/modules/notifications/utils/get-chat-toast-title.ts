import { CHAT_MESSAGE_TITLE_PREFIXES } from "../constants/chat-message-toast.constants";

export function getChatToastTitle(title: string): string {
  const prefix = CHAT_MESSAGE_TITLE_PREFIXES.find((value) => title.startsWith(value));
  const name = prefix ? title.slice(prefix.length).trim() : title.trim();
  return name || title;
}