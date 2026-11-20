import type { Socket } from "socket.io-client";
import { describe, expect, it, vi } from "vitest";
import { joinChatConversation } from "../services/join-chat-conversation";

describe("confirmación de entrada a la sala", () => {
  it("acepta la respuesta envuelta por el interceptor de la epic", async () => {
    const socket = {
      connected: true,
      emit: vi.fn((_event, _body, ack) =>
        ack({ ok: true, data: { ok: true } }),
      ),
    } as unknown as Socket;
    await expect(
      joinChatConversation(socket, "a", new AbortController().signal),
    ).resolves.toBeUndefined();
  });
  it("no confunde un envelope exitoso con una autorización rechazada", async () => {
    const socket = {
      connected: true,
      emit: vi.fn((_event, _body, ack) =>
        ack({ ok: true, data: { ok: false, error: "Sin acceso" } }),
      ),
    } as unknown as Socket;
    await expect(
      joinChatConversation(socket, "a", new AbortController().signal),
    ).rejects.toThrow("Sin acceso");
  });
});
