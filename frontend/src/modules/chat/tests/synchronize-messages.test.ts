import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { synchronizeMessages } from "../services/synchronize-messages";
import { getPaginatedMessages } from "../services/chat-api";
import { messagesQueryKey } from "../constants/messages-query-key";
import type { Message } from "../types/conversation.types";
import type { MessagesPage } from "../types/messages-page.types";
import type { InfiniteData } from "@tanstack/react-query";

vi.mock("../services/chat-api", () => ({ getPaginatedMessages: vi.fn() }));
const message = (id: number, conversationId = "a"): Message => ({
  id: String(id),
  conversationId,
  senderId: "sender",
  content: `Mensaje ${id}`,
  timestamp: new Date(id * 1000).toISOString(),
  createdAt: new Date(id * 1000).toISOString(),
  status: "sent",
});
const page = (
  ids: number[],
  hasMore = false,
  nextCursor: string | null = null,
) => ({ data: ids.map((id) => message(id)), hasMore, nextCursor });
let client: QueryClient;
const cached = () =>
  client.getQueryData<InfiniteData<MessagesPage>>(messagesQueryKey("a"))!;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient();
  client.setQueryData(messagesQueryKey("a"), {
    pages: [
      { messages: [message(2), message(3)], hasMore: true, nextCursor: "2" },
      { messages: [message(1)], hasMore: false, nextCursor: null },
    ],
    pageParams: [null, "2"],
  });
});

describe("sincronización de mensajes", () => {
  it("recupera varias páginas hasta el historial conocido, ordena y no duplica", async () => {
    vi.mocked(getPaginatedMessages)
      .mockResolvedValueOnce(page([7, 6], true, "6"))
      .mockResolvedValueOnce(page([5, 4], true, "4"))
      .mockResolvedValueOnce(page([3, 2], true, "2"));
    await synchronizeMessages(client, "a", new AbortController().signal);
    expect(cached().pages[0].messages.map((m) => m.id)).toEqual([
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
    ]);
    expect(cached().pages[1].messages.map((m) => m.id)).toEqual(["1"]);
    expect(getPaginatedMessages).toHaveBeenCalledTimes(3);
    expect(cached().pages[0].nextCursor).toBe("2");
  });
  it("conserva el historial cuando no hay mensajes nuevos", async () => {
    const before = cached();
    vi.mocked(getPaginatedMessages).mockResolvedValue(page([0, 1, 2, 3], true, "0"));
    await synchronizeMessages(client, "a", new AbortController().signal);
    expect(cached()).toEqual(before);
  });
  it("no modifica ninguna conversación si se cancela durante la recuperación", async () => {
    const before = cached();
    const controller = new AbortController();
    vi.mocked(getPaginatedMessages).mockImplementation(async () => {
      controller.abort();
      return page([4]);
    });
    await expect(
      synchronizeMessages(client, "a", controller.signal),
    ).rejects.toThrow();
    expect(cached()).toEqual(before);
    expect(client.getQueryData(messagesQueryKey("b"))).toBeUndefined();
  });
  it("mantiene los mensajes si falla una página intermedia", async () => {
    const before = cached();
    vi.mocked(getPaginatedMessages)
      .mockResolvedValueOnce(page([8, 9], true, "8"))
      .mockRejectedValueOnce(new Error("Sin red"));
    await expect(
      synchronizeMessages(client, "a", new AbortController().signal),
    ).rejects.toThrow("Sin red");
    expect(cached()).toEqual(before);
  });
  it("descarta mensajes de otra conversación", async () => {
    vi.mocked(getPaginatedMessages).mockResolvedValue({
      data: [message(4), message(5, "b")],
      hasMore: false,
      nextCursor: null,
    });
    await synchronizeMessages(client, "a", new AbortController().signal);
    expect(cached().pages[0].messages.map((m) => m.id)).toEqual([
      "2",
      "3",
      "4",
    ]);
  });
});
