import { useState } from "react";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { Button } from "@/components/ui/button";
import { MessagingUiProvider } from "../contexts/messaging-ui-context";
import { ChatView } from "../views/chat-view";
import * as chatApi from "../services/chat-api";
import { ChatDock, ChatPanel } from "./chat-panel";

vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: () => ({ roles: ["mentor"], isLoading: false }) }));

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ replace: vi.fn() }) }));

const CONVERSATIONS = [{ id: "conversation-1", contact: { id: "user-1", fullName: "María Fernández", avatarUrl: null, isOnline: false }, lastMessage: null, unreadCount: 0, updatedAt: "2026-10-22T12:00:00Z" }];

function MessagingFixture() {
  const [isFullView, setIsFullView] = useState(false);
  return <MessagingUiProvider><Button onClick={() => setIsFullView(true)}>Mostrar historial</Button>{isFullView ? <ChatView /> : <><ChatPanel roles={["mentor"]} /><ChatDock /></>}</MessagingUiProvider>;
}

beforeEach(() => {
  vi.spyOn(chatApi, "getConversations").mockResolvedValue(CONVERSATIONS);
  vi.spyOn(chatApi, "getPaginatedMessages").mockResolvedValue({ data: [], hasMore: false, nextCursor: null });
  vi.spyOn(chatApi, "markConversationAsRead").mockResolvedValue(undefined);
  vi.spyOn(chatApi, "getCurrentSessionUserId").mockReturnValue("me");
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("ChatPanel", () => {
  it("does not fetch messages until opened and is unavailable to an administrator", () => {
    const { rerender } = render(<MessagingUiProvider><ChatPanel roles={["mentor"]} /></MessagingUiProvider>);
    expect(screen.getByRole("button", { name: "Abrir mensajes rápidos" })).toBeInTheDocument();
    expect(chatApi.getConversations).not.toHaveBeenCalled();
    rerender(<MessagingUiProvider><ChatPanel roles={["administrativo"]} /></MessagingUiProvider>);
    expect(screen.queryByRole("button", { name: "Abrir mensajes rápidos" })).not.toBeInTheDocument();
  });

  it("keeps the selected conversation and draft when closed, reopened and expanded", async () => {
    render(<MessagingFixture />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir mensajes rápidos" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostrar historial" })).toBeEnabled();
    fireEvent.click(await screen.findByText("María Fernández"));
    const input = await screen.findByRole("textbox", { name: "Campo de redaccion de mensaje" });
    fireEvent.change(input, { target: { value: "Quisiera coordinar la mentoría" } });
    expect(screen.getByRole("button", { name: "Volver a la lista de chats" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar mensajes rápidos" }));
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Campo de redaccion de mensaje" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Abrir mensajes rápidos" }));
    expect(await screen.findByRole("textbox", { name: "Campo de redaccion de mensaje" })).toHaveValue("Quisiera coordinar la mentoría");
    fireEvent.click(screen.getByRole("link", { name: "Abrir mensajes en pantalla completa" }));
    fireEvent.click(screen.getByRole("button", { name: "Mostrar historial" }));
    expect(await screen.findByRole("textbox", { name: "Campo de redaccion de mensaje" })).toHaveValue("Quisiera coordinar la mentoría");
  });
  it("shares a pending send when opening the full history and clears only after completion", async () => {
    let finishSend!: () => void;
    vi.spyOn(chatApi, "sendMessage").mockImplementation(() => new Promise((resolve) => {
      finishSend = () => resolve({ statusCode: 201, ok: true, detail: "Mensaje enviado", data: { id: "sent-1", conversationId: "conversation-1", senderId: "me", content: "Primer mensaje", createdAt: "2026-10-22T12:00:00Z", timestamp: "2026-10-22T12:00:00Z", status: "sent" } });
    }));
    render(<MessagingFixture />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir mensajes rápidos" }));
    fireEvent.click(await screen.findByText("María Fernández"));
    const input = await screen.findByRole("textbox", { name: "Campo de redaccion de mensaje" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "Primer mensaje" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await waitFor(() => expect(chatApi.sendMessage).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("link", { name: "Abrir mensajes en pantalla completa" }));
    fireEvent.click(screen.getByRole("button", { name: "Mostrar historial" }));
    const fullInput = await screen.findByRole("textbox", { name: "Campo de redaccion de mensaje" });
    expect(fullInput).toBeDisabled();
    expect(fullInput).toHaveValue("Primer mensaje");
    await act(async () => finishSend());
    await waitFor(() => expect(fullInput).toBeEnabled());
    expect(fullInput).toHaveValue("");
    fireEvent.change(fullInput, { target: { value: "Siguiente mensaje" } });
    expect(fullInput).toHaveValue("Siguiente mensaje");
    expect(chatApi.sendMessage).toHaveBeenCalledTimes(1);
  });

});
