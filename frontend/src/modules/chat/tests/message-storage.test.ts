import "@/shared/testing/indexed-db.mock";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getAccessToken,
  saveAccessToken,
} from "@/shared/services/storage/access-token-storage";
import {
  readIndexedDb,
  writeIndexedDb,
} from "@/shared/services/storage/browser-indexed-db";
import {
  CHAT_MESSAGES_STORAGE_KEY,
  clearStoredMessages,
  getStoredMessages,
  getMessagesByConversation,
  saveStoredMessage,
  updateStoredMessageStatus,
  getStoredConversationReadState,
  setStoredConversationUnreadCount,
  markStoredConversationAsRead,
  clearStoredConversationReadState,
} from "../services/message-storage";
import type { Message } from "../types/conversation.types";

const token = (sub: string) =>
  `header.${btoa(JSON.stringify({ sub }))}.signature`;
const message: Message = {
  id: "message-1",
  conversationId: "conversation-1",
  senderId: "user-1",
  content: "Mensaje",
  status: "sending",
  timestamp: "2026-11-01T10:00:00Z",
  createdAt: "2026-11-01T10:00:00Z",
};

describe("chat IndexedDB persistence", () => {
  beforeEach(async () => {
    await saveAccessToken(token("user-1"));
    await clearStoredMessages();
  });

  it("starts with an empty cache", async () => {
    expect(await getStoredMessages()).toEqual([]);
  });
  it("persists and updates a message without duplicating it", async () => {
    await saveStoredMessage(message);
    await saveStoredMessage({ ...message, content: "Actualizado" });
    expect(await getStoredMessages()).toEqual([
      { ...message, content: "Actualizado" },
    ]);
    expect(await readIndexedDb(`${CHAT_MESSAGES_STORAGE_KEY}:user-1`)).toEqual([
      { ...message, content: "Actualizado" },
    ]);
    expect(localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)).toBeNull();
  });
  it("isolates cached messages and read states between users", async () => {
    await saveStoredMessage(message);
    await setStoredConversationUnreadCount("conversation-1", 3);
    await saveAccessToken(token("user-2"));
    expect(await getStoredMessages()).toEqual([]);
    expect(await getStoredConversationReadState()).toEqual({});
    await saveAccessToken(token("user-1"));
    expect(await getStoredMessages()).toEqual([message]);
    expect(await getStoredConversationReadState()).toEqual({
      "conversation-1": 3,
    });
  });
  it("filters and orders messages by conversation", async () => {
    await saveStoredMessage({
      ...message,
      id: "later",
      timestamp: "2026-11-01T12:00:00Z",
    });
    await saveStoredMessage(message);
    await saveStoredMessage({
      ...message,
      id: "other",
      conversationId: "other",
    });
    expect(
      (await getMessagesByConversation("conversation-1")).map((row) => row.id),
    ).toEqual(["message-1", "later"]);
  });
  it("updates delivery status and ignores unknown messages", async () => {
    await saveStoredMessage(message);
    expect(await updateStoredMessageStatus(message.id, "sent")).toEqual({
      ...message,
      status: "sent",
    });
    expect(await updateStoredMessageStatus("missing", "error")).toBeNull();
    expect(await getStoredMessages()).toEqual([{ ...message, status: "sent" }]);
  });
  it("ignores an invalid stored message collection", async () => {
    await writeIndexedDb(`${CHAT_MESSAGES_STORAGE_KEY}:user-1`, "invalid");
    expect(await getStoredMessages()).toEqual([]);
  });
  it("persists read state and clears it", async () => {
    await setStoredConversationUnreadCount("conversation-1", 4);
    expect(await getStoredConversationReadState()).toEqual({
      "conversation-1": 4,
    });
    await markStoredConversationAsRead("conversation-1");
    expect(await getStoredConversationReadState()).toEqual({
      "conversation-1": 0,
    });
    await clearStoredConversationReadState();
    expect(await getStoredConversationReadState()).toEqual({});
    expect(getAccessToken()).toBe(token("user-1"));
  });
});
