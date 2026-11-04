import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatRoom } from "../components/chat-room";
import type { ChatConnectionStatus } from "../types/chat-connection-status.types";

const conversation = {
  id: "a",
  contact: { id: "other", fullName: "Carlos Rojas", isOnline: true },
  unreadCount: 0,
  updatedAt: "2026-01-01",
};
const messages = [
  {
    id: "m1",
    conversationId: "a",
    senderId: "other",
    content: "Mensaje existente",
    timestamp: "2026-01-01",
    createdAt: "2026-01-01",
    status: "sent" as const,
  },
];
afterEach(cleanup);

describe("avisos de conexión en la sala", () => {
  it("conserva historial y borrador, cierra avisos y permite enviar tras sincronizar", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const room = (connectionStatus: ChatConnectionStatus) => (
      <ChatRoom
        conversation={conversation}
        messages={messages}
        currentUserId="me"
        onBack={vi.fn()}
        onSendMessage={onSendMessage}
        connectionStatus={connectionStatus}
      />
    );
    const { rerender } = render(room("offline"));
    expect(screen.getByText("Sin conexión a internet")).toBeInTheDocument();
    expect(screen.getByText("Mensaje existente")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("message-textarea"), {
      target: { value: "Mi borrador" },
    });
    expect(screen.getByTestId("send-button")).toBeDisabled();
    fireEvent.keyDown(screen.getByTestId("message-textarea"), { key: "Enter" });
    expect(onSendMessage).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar aviso de conexión" }),
    );
    expect(
      screen.queryByText("Sin conexión a internet"),
    ).not.toBeInTheDocument();
    rerender(room("reconnecting"));
    expect(
      screen.getByText("Reconectando y sincronizando mensajes..."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar aviso de conexión" }),
    );
    expect(
      screen.queryByText("Reconectando y sincronizando mensajes..."),
    ).not.toBeInTheDocument();
    rerender(room("offline"));
    expect(screen.getByText("Sin conexión a internet")).toBeInTheDocument();
    rerender(room("connected"));
    expect(
      screen.queryByText("Sin conexión a internet"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("message-textarea")).toHaveValue("Mi borrador");
    expect(screen.getByTestId("send-button")).toBeEnabled();
    fireEvent.click(screen.getByTestId("send-button"));
    await waitFor(() =>
      expect(onSendMessage).toHaveBeenCalledWith("Mi borrador"),
    );
    await waitFor(() =>
      expect(screen.getByTestId("message-textarea")).toHaveValue(""),
    );
  });
});
