import {
  readIndexedDb,
  updateIndexedDb,
  removeIndexedDb,
} from "@/shared/services/storage/browser-indexed-db";
import {
  getAccessToken,
  initializeAccessTokenStorage,
} from "@/shared/services/storage/access-token-storage";
import type { Message, MessageStatus } from "../types/conversation.types";

export const CHAT_MESSAGES_STORAGE_KEY = 'umssy_chat_messages_v1';
export const CHAT_READ_STATUS_STORAGE_KEY = 'umssy_chat_read_status_v1';

async function storageKey(prefix: string): Promise<string | null> {
  await initializeAccessTokenStorage();
  const token = getAccessToken();
  if (!token) return null;
  try {
    const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(atob(segment));
    if (
      !payload ||
      typeof payload !== "object" ||
      !("sub" in payload) ||
      typeof payload.sub !== "string"
    )
      return null;
    return `${prefix}:${payload.sub}`;
  } catch {
    return null;
  }
}

export async function getStoredMessages(): Promise<Message[]> {
  const key = await storageKey(CHAT_MESSAGES_STORAGE_KEY);
  if (!key) return [];
  const stored = await readIndexedDb<Message[]>(key);
  return Array.isArray(stored) ? stored : [];
}

export async function getMessagesByConversation(
  conversationId: string,
): Promise<Message[]> {
  return (await getStoredMessages())
    .filter((message) => message.conversationId === conversationId)
    .sort(
      (a, b) =>
        new Date(a.timestamp || a.createdAt || "").getTime() -
        new Date(b.timestamp || b.createdAt || "").getTime(),
    );
}

export async function saveStoredMessage(message: Message): Promise<Message> {
  const key = await storageKey(CHAT_MESSAGES_STORAGE_KEY);
  if (key)
    await updateIndexedDb<Message[]>(key, (current) => {
      const messages = Array.isArray(current) ? [...current] : [];
      const index = messages.findIndex((row) => row.id === message.id);
      if (index < 0) messages.push({ ...message });
      else messages[index] = { ...message };
      return messages;
    });
  return { ...message };
}

export async function updateStoredMessageStatus(
  messageId: string,
  newStatus: MessageStatus,
): Promise<Message | null> {
  const key = await storageKey(CHAT_MESSAGES_STORAGE_KEY);
  if (!key) return null;
  let changed: Message | null = null;
  await updateIndexedDb<Message[]>(key, (current) =>
    (current ?? []).map((row) => {
      if (row.id !== messageId) return row;
      changed = { ...row, status: newStatus };
      return changed;
    }),
  );
  return changed;
}

export const rehydrateStoredMessages = getStoredMessages;

export async function clearStoredMessages(): Promise<void> {
  const key = await storageKey(CHAT_MESSAGES_STORAGE_KEY);
  if (key) await removeIndexedDb(key);
  await clearStoredConversationReadState();
}

export async function getStoredConversationReadState(): Promise<
  Record<string, number>
> {
  const key = await storageKey(CHAT_READ_STATUS_STORAGE_KEY);
  if (!key) return {};
  const stored = await readIndexedDb<unknown>(key);
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
  return Object.fromEntries(
    Object.entries(stored).filter(
      ([, value]) =>
        typeof value === "number" && Number.isFinite(value) && value >= 0,
    ),
  );
}

export async function setStoredConversationUnreadCount(
  conversationId: string,
  unreadCount: number,
): Promise<void> {
  const key = await storageKey(CHAT_READ_STATUS_STORAGE_KEY);
  if (key)
    await updateIndexedDb<Record<string, number>>(key, (current) => ({
      ...current,
      [conversationId]: Math.max(0, unreadCount),
    }));
}

export function markStoredConversationAsRead(
  conversationId: string,
): Promise<void> {
  return setStoredConversationUnreadCount(conversationId, 0);
}

export async function clearStoredConversationReadState(): Promise<void> {
  const key = await storageKey(CHAT_READ_STATUS_STORAGE_KEY);
  if (key) await removeIndexedDb(key);
}
