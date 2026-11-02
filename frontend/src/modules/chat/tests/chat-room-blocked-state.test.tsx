import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatRoom } from "../components/chat-room";
import type { Conversation, Message } from "../types/conversation.types";

const conversation: Conversation = {
  id: "conv-blocked-1",
  contact: { id: "user-contact-1", fullName: "Maria Fernandez", avatarUrl: null, isOnline: true },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
  isBlockedByMe: true,
};

const messages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-blocked-1",
    senderId: "user-contact-1",
    content: "Hola, buenas tardes",
    timestamp: new Date().toISOString(),
    status: "sent",
    createdAt: new Date().toISOString(),
  },
  {
    id: "msg-2",
    conversationId: "conv-blocked-1",
    senderId: "current-user",
    content: "Hola Maria",
    timestamp: new Date().toISOString(),
    status: "sent",
    createdAt: new Date().toISOString(),
  },
];

function renderRoom(
  conv: Conversation,
  overrides: Partial<{
    onUnblockUser: () => Promise<void>;
    onSendMessage: (content: string) => Promise<void>;
  }> = {},
) {
  const props = {
    onBlockUser: vi.fn().mockResolvedValue(undefined),
    onUnblockUser: overrides.onUnblockUser ?? vi.fn().mockResolvedValue(undefined),
    onSendMessage: overrides.onSendMessage ?? vi.fn().mockResolvedValue(undefined),
  };
  const utils = render(
    <ChatRoom
      conversation={conv}
      messages={messages}
      currentUserId="current-user"
      onBack={vi.fn()}
      {...props}
    />,
  );
  return { ...utils, ...props };
}

function forbiddenError(): AxiosError {
  return new AxiosError("Request failed with status code 403", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 403,
    data: { detail: "No es posible enviar mensajes en esta conversación" },
  } as AxiosResponse);
}

describe("ChatRoom · conversación bloqueada", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("la cabecera muestra 'Bloqueado' en lugar de 'En línea'", () => {
    renderRoom(conversation);

    expect(screen.getByTestId("chat-blocked-status")).toHaveTextContent("Bloqueado");
    expect(screen.queryByText("En línea")).not.toBeInTheDocument();
    expect(screen.queryByTestId("online-indicator")).not.toBeInTheDocument();
  });

  it("muestra el aviso y el botón 'Desbloquear' en la parte inferior", () => {
    renderRoom(conversation);

    const notice = screen.getByTestId("blocked-conversation-notice");
    expect(notice).toHaveTextContent("Has bloqueado a Maria Fernandez.");
    expect(notice).toHaveTextContent("No puedes enviar ni recibir mensajes de esta persona");
    expect(screen.getByRole("button", { name: "Desbloquear" })).toBeInTheDocument();
  });

  it("el campo de texto queda oculto mientras dure el bloqueo", () => {
    renderRoom(conversation);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("el historial sigue visible", () => {
    renderRoom(conversation);
    expect(screen.getByText("Hola, buenas tardes")).toBeInTheDocument();
    expect(screen.getByText("Hola Maria")).toBeInTheDocument();
  });

  it("el botón 'Desbloquear' del aviso llama a onUnblockUser", async () => {
    const user = userEvent.setup();
    const { onUnblockUser } = renderRoom(conversation);

    await user.click(screen.getByRole("button", { name: "Desbloquear" }));

    expect(onUnblockUser).toHaveBeenCalledTimes(1);
  });

  it("'Desbloquear usuario' del menú (⋯) también llama a onUnblockUser", async () => {
    const user = userEvent.setup();
    const { onUnblockUser } = renderRoom(conversation);

    fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Desbloquear usuario" }));

    await waitFor(() => expect(onUnblockUser).toHaveBeenCalledTimes(1));
  });

  it("al desbloquear vuelve el campo de mensajes, sin duplicar el historial", () => {
    const { rerender } = renderRoom(conversation);

    rerender(
      <ChatRoom
        conversation={{ ...conversation, isBlockedByMe: false }}
        messages={messages}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
        onBlockUser={vi.fn()}
        onUnblockUser={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("blocked-conversation-notice")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("En línea")).toBeInTheDocument();
    expect(screen.getAllByText("Hola, buenas tardes")).toHaveLength(1);
  });

  it("si falla el desbloqueo muestra el error y mantiene las restricciones", async () => {
    const user = userEvent.setup();
    renderRoom(conversation, {
      onUnblockUser: vi.fn().mockRejectedValue(new Error("Network Error")),
    });

    await user.click(screen.getByRole("button", { name: "Desbloquear" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo desbloquear. Intenta de nuevo.");
    expect(screen.getByTestId("blocked-conversation-notice")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("si el envío responde 403 muestra 'No es posible enviar mensajes en esta conversación'", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn().mockRejectedValue(forbiddenError());
    // Lado del usuario bloqueado: para él isBlockedByMe es false y ve el campo.
    renderRoom({ ...conversation, isBlockedByMe: false }, { onSendMessage });

    await user.type(screen.getByRole("textbox"), "Hola{Enter}");

    expect(await screen.findByTestId("blocked-send-error")).toHaveTextContent(
      "No es posible enviar mensajes en esta conversación",
    );
    expect(onSendMessage).toHaveBeenCalledTimes(1);
  });

  it("otros errores de envío siguen mostrando el mensaje genérico", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn().mockRejectedValue(new Error("Network Error"));
    renderRoom({ ...conversation, isBlockedByMe: false }, { onSendMessage });

    await user.type(screen.getByRole("textbox"), "Hola{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo enviar el mensaje");
    expect(screen.queryByTestId("blocked-send-error")).not.toBeInTheDocument();
  });
});