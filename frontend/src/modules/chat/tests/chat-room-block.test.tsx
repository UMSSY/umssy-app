import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatRoom } from "../components/chat-room";
import type { Conversation } from "../types/conversation.types";

const baseConversation: Conversation = {
  id: "conv-block-1",
  contact: { id: "user-contact-1", fullName: "Maria Fernandez", avatarUrl: null, isOnline: true },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
  isBlockedByMe: false,
};

function renderRoom(conversation: Conversation, handlers: {
  onBlockUser?: () => Promise<void>;
  onUnblockUser?: () => Promise<void>;
} = {}) {
  const onBlockUser = handlers.onBlockUser ?? vi.fn().mockResolvedValue(undefined);
  const onUnblockUser = handlers.onUnblockUser ?? vi.fn().mockResolvedValue(undefined);
  render(
    <ChatRoom
      conversation={conversation}
      messages={[]}
      currentUserId="current-user"
      onBack={vi.fn()}
      onSendMessage={vi.fn()}
      onBlockUser={onBlockUser}
      onUnblockUser={onUnblockUser}
    />,
  );
  return { onBlockUser, onUnblockUser };
}

describe("ChatRoom · menú de opciones y bloqueo", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra el botón ⋯ en la cabecera", () => {
    renderRoom(baseConversation);
    const header = screen.getByTestId("chat-room-header");
    expect(header).toContainElement(screen.getByRole("button", { name: "Más opciones" }));
  });

  it("Bloquear usuario → confirmación → Bloquear llama a onBlockUser", async () => {
    const user = userEvent.setup();
    const { onBlockUser } = renderRoom(baseConversation);

    fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Bloquear usuario" }));
    expect(await screen.findByText("¿Quieres bloquear a Maria Fernandez?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bloquear" }));

    await waitFor(() => expect(onBlockUser).toHaveBeenCalledTimes(1));
  });

  it("Cancelar no bloquea", async () => {
    const user = userEvent.setup();
    const { onBlockUser } = renderRoom(baseConversation);

    fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Bloquear usuario" }));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(onBlockUser).not.toHaveBeenCalled();
  });

  it("con contacto bloqueado, 'Desbloquear usuario' llama a onUnblockUser", async () => {
    const user = userEvent.setup();
    const { onUnblockUser } = renderRoom({ ...baseConversation, isBlockedByMe: true });

    fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Desbloquear usuario" }));

    await waitFor(() => expect(onUnblockUser).toHaveBeenCalledTimes(1));
  });

  it("si falla el desbloqueo muestra un mensaje de error", async () => {
    const user = userEvent.setup();
    renderRoom(
      { ...baseConversation, isBlockedByMe: true },
      { onUnblockUser: vi.fn().mockRejectedValue(new Error("Network Error")) },
    );

    fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Desbloquear usuario" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo desbloquear. Intenta de nuevo.");
  });

  it("sin handlers de bloqueo no se muestra el menú (compatibilidad)", () => {
    render(
      <ChatRoom
        conversation={baseConversation}
        messages={[]}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Más opciones" })).not.toBeInTheDocument();
  });
});