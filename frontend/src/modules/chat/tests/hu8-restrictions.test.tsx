import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ContactSearchModal } from "../components/contact-search-modal";
import { ChatRoom } from "../components/chat-room";
import type { Conversation } from "../types/conversation.types";
import { getChatActionErrorMessage } from "../utils/chat-action-error";

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  sendRequest: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("../hooks/use-contact-search", () => ({
  useContactSearch: mocks.search,
}));

vi.mock("../hooks/use-send-connection-request", () => ({
  useSendConnectionRequest: () => ({
    mutateAsync: mocks.sendRequest,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: [
      {
        senderId: "contact",
        receiverId: "me",
        status: { title: "ACCEPTED" },
      },
    ],
    isPending: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
  }),
}));

vi.mock("../services/connection-request-api", () => ({
  getSentConnectionRequests: vi.fn(),
  getReceivedConnectionRequests: vi.fn(),
  getAcceptedConnectionRequests: vi.fn(),
}));

vi.mock("../contexts/messaging-ui-context", () => ({
  useMessagingUi: () => null,
}));

vi.mock("../services/chat-api", () => ({
  downloadAttachment: vi.fn(),
}));

vi.mock("../components/contact-profile-modal", () => ({
  ContactProfileModal: () => null,
}));

vi.mock("../components/chat-options-menu", () => ({
  ChatOptionsMenu: () => null,
}));

vi.mock("../components/block-user-dialog", () => ({
  BlockUserDialog: () => null,
}));

vi.mock("../components/blocked-conversation-notice", () => ({
  BlockedConversationNotice: () => null,
}));

vi.mock("../components/message-item", () => ({
  MessageItem: () => null,
}));

vi.mock("../components/message-input-bar", () => ({
  MessageInputBar: ({
    value,
    onChange,
    onSend,
  }: {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
  }) => (
    <div>
      <textarea
        aria-label="Texto del mensaje"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" onClick={onSend}>
        Enviar prueba
      </button>
    </div>
  ),
}));

const contact = {
  id: "contact",
  fullName: "Contacto permitido",
  avatarUrl: null,
  headline: null,
  role: "STUDENT",
  isActive: true,
};

const conversation = {
  id: "conversation",
  contact: {
    ...contact,
    isOnline: false,
  },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: "2026-10-30T12:00:00Z",
  isBlockedByMe: false,
} as Conversation;

beforeEach(() => {
  vi.clearAllMocks();

  mocks.search.mockReturnValue({
    results: [contact],
    isSearching: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
  });
});

afterEach(() => {
  cleanup();
});

describe("HU8 tarea 4: filtro y avisos de restricción", () => {
  it("presenta los contactos devueltos por el buscador", () => {
    render(
      <ContactSearchModal
        isOpen
        onClose={vi.fn()}
        onSelectContact={vi.fn()}
      />,
    );

    expect(screen.getByText("Contacto permitido")).toBeTruthy();
    expect(screen.queryByText("Reclutador externo")).toBeNull();
  });

  it("presenta un estado vacío cuando no hay coincidencias", () => {
    mocks.search.mockReturnValue({
      results: [],
      isSearching: false,
      isError: false,
      error: null,
      refetch: mocks.refetch,
    });

    render(
      <ContactSearchModal
        isOpen
        onClose={vi.fn()}
        onSelectContact={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar contactos"), {
      target: { value: "Nadie" },
    });

    expect(
      screen.getByText(/No hay contactos disponibles/),
    ).toBeTruthy();
  });

  it.each([401, 403])(
    "distingue el error %s de una búsqueda sin resultados",
    (status) => {
      mocks.search.mockReturnValue({
        results: [],
        isSearching: false,
        isError: true,
        error: { response: { status } },
        refetch: mocks.refetch,
      });

      render(
        <ContactSearchModal
          isOpen
          onClose={vi.fn()}
          onSelectContact={vi.fn()}
        />,
      );

      expect(screen.getByRole("alert").textContent).toMatch(
        status === 401 ? /Inicia sesión/ : /restringida/,
      );

      expect(
        screen.queryByText(/No hay contactos disponibles/),
      ).toBeNull();
    },
  );

  it.each([401, 403])(
    "mantiene el modal abierto si crear la conversación falla con %s",
    async (status) => {
      const onClose = vi.fn();
      const onSelect = vi.fn().mockRejectedValue({
        response: { status },
      });

      render(
        <ContactSearchModal
          isOpen
          onClose={onClose}
          onSelectContact={onSelect}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /Abrir chat/ }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toMatch(
          status === 401 ? /Inicia sesión/ : /restringida/,
        );
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledTimes(1);
    },
  );

  it("espera la confirmación e impide una doble solicitud", async () => {
    let resolvePending: () => void = () => {};

    const pending = new Promise<void>((resolve) => {
      resolvePending = resolve;
    });

    const onSelect = vi.fn().mockReturnValue(pending);
    const onClose = vi.fn();

    render(
      <ContactSearchModal
        isOpen
        onClose={onClose}
        onSelectContact={onSelect}
      />,
    );

    const button = screen.getByRole("button", {
      name: /Abrir chat/,
    });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onClose).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledTimes(1);

    resolvePending();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it.each([401, 403])(
    "conserva el borrador cuando el mensaje es rechazado con %s",
    async (status) => {
      const onSend = vi.fn().mockRejectedValue({
        response: { status },
      });

      render(
        <ChatRoom
          conversation={conversation}
          messages={[]}
          currentUserId="me"
          onBack={vi.fn()}
          onSendMessage={onSend}
        />,
      );

      const input = screen.getByLabelText(
        "Texto del mensaje",
      ) as HTMLTextAreaElement;

      fireEvent.change(input, {
        target: { value: "Mi borrador" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Enviar prueba" }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toMatch(
          status === 401 ? /Inicia sesión/ : /restringida/,
        );
      });

      expect(input.value).toBe("Mi borrador");
      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onSend).toHaveBeenCalledWith("Mi borrador");
      expect(screen.getByText(/Aún no hay mensajes/)).toBeTruthy();
    },
  );

  it("no presenta un error de red como una restricción de roles", () => {
    const message = getChatActionErrorMessage(
      new Error("network"),
      "Intenta nuevamente",
    );

    expect(message).toBe("Intenta nuevamente");
  });
});