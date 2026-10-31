import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import { QueryClient, QueryClientProvider} from "@tanstack/react-query";

import { afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import { EmptyChatState } from "../components/empty-chat-state";
import { ConversationSkeleton } from "../components/conversation-skeleton";
import { ConversationItem } from "../components/conversation-item";
import { ConversationList } from "../components/conversation-list";
import { ChatView } from "../views/chat-view";
import { getChatSocket } from "../components/chat-socket";
import * as chatApi from "../services/chat-api";
import type { Conversation, Message } from "../types/conversation.types";

vi.mock("../components/chat-socket", () => ({
  getChatSocket: vi.fn(),
}));

const mockConversationWithAvatar: Conversation = {
  id: "conv-1",
  contact: {
    id: "user-1",
    fullName: "Maria Fernandez",
    avatarUrl: "https://example.com/avatar.jpg",
    isOnline: true,
  },
  lastMessage: {
    id: "msg-1",
    senderId: "user-1",
    content: "Hola mundo",
    isAttachment: false,
    createdAt: new Date().toISOString(),
  },
  unreadCount: 3,
  updatedAt: new Date().toISOString(),
};

const mockConversationWithInitialsAndAttachment: Conversation = {
  id: "conv-2",
  contact: {
    id: "user-2",
    fullName: "Pablo Perez",
    avatarUrl: null,
    isOnline: false,
  },
  lastMessage: {
    id: "msg-2",
    senderId: "user-2",
    content: "archivo.pdf",
    isAttachment: true,
    attachmentType: "file",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  unreadCount: 0,
  updatedAt: new Date(Date.now() - 86400000).toISOString(),
};

const mockConversationWithAudio: Conversation = {
  id: "conv-3",
  contact: {
    id: "user-3",
    fullName: "Mario Alcocer",
    avatarUrl: null,
    isOnline: false,
  },
  lastMessage: {
    id: "msg-3",
    senderId: "user-3",
    content: "audio.mp3",
    isAttachment: true,
    attachmentType: "audio",
    createdAt: new Date().toISOString(),
  },
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const mockConversationWithoutMessages: Conversation = {
  id: "conv-4",
  contact: {
    id: "user-4",
    fullName: "Claudia Torrico",
    avatarUrl: null,
    isOnline: false,
  },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const conversation: Conversation = {
  id: "empty-chat",
  contact: {
    id: "user-1",
    fullName: "Ana Pérez",
    avatarUrl: null,
    isOnline: true,
  },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const sentMessage = {
  id: "sent-msg-1",
  conversationId: conversation.id,
  senderId: "user-1",
  content: "Hola",
  isAttachment: false,
  createdAt: new Date().toISOString(),
} as Message;

const mockSocket = {
  connected: true,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
};

beforeEach(() => {
  vi.mocked(getChatSocket).mockReturnValue(
    mockSocket as unknown as ReturnType<typeof getChatSocket>,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function renderChat() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ChatView />
    </QueryClientProvider>,
  );
}

describe("Chat Components", () => {
  it("EmptyChatState debe renderizar texto y responder al boton", () => {
    const handleAction = vi.fn();
    render(
      <EmptyChatState
        description="Sin conversaciones"
        actionLabel="Iniciar chat"
        onAction={handleAction}
      />,
    );
    expect(screen.getByText("Sin conversaciones")).toBeDefined();
    fireEvent.click(screen.getByText("Iniciar chat"));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("ConversationSkeleton debe renderizarse sin errores", () => {
    const { container } = render(<ConversationSkeleton />);
    expect(container.querySelectorAll(".animate-pulse").length).toBe(4);
  });

  it("ConversationItem debe renderizar avatar, nombre, badge y disparar seleccion", () => {
    const handleSelect = vi.fn();
    const { container } = render(
      <ConversationItem
        conversation={mockConversationWithAvatar}
        isSelected={false}
        onSelect={handleSelect}
      />,
    );
    expect(screen.getByText("Maria Fernandez")).toBeDefined();
    expect(screen.getByText("Hola mundo")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    fireEvent.click(button!);
    expect(handleSelect).toHaveBeenCalledWith(mockConversationWithAvatar);
  });

  it("ConversationItem debe mostrar iniciales y etiqueta de adjunto archivo", () => {
    render(
      <ConversationItem
        conversation={mockConversationWithInitialsAndAttachment}
        isSelected={true}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("PP")).toBeDefined();
    expect(screen.getByText(/\[Archivo\]/)).toBeDefined();
  });

  it("ConversationItem debe mostrar etiqueta de audio y texto de conversacion iniciada", () => {
    const { unmount } = render(
      <ConversationItem
        conversation={mockConversationWithAudio}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(/\[Audio\]/)).toBeDefined();
    unmount();
    render(
      <ConversationItem
        conversation={mockConversationWithoutMessages}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Conversación iniciada")).toBeDefined();
  });

  it("conserva el borrador tras fallar el envío y lo limpia solo cuando se envía correctamente", async () => {
    vi.spyOn(chatApi, "getConversations").mockResolvedValue([conversation]);
    vi.spyOn(chatApi, "getPaginatedMessages")
      .mockResolvedValueOnce({ data: [], hasMore: false, nextCursor: null })
      .mockResolvedValue({ data: [sentMessage], hasMore: false, nextCursor: null });

    let attempts = 0;
    const sendEmit = vi.fn(
      (
        event: string,
        _payload: unknown,
        callback?: (result: { ok: boolean; message?: Message; error?: string }) => void,
      ) => {
        if (event !== "message:send" || !callback) return;
        attempts += 1;
        if (attempts === 1) {
          callback({ ok: false, error: "offline" });
        } else {
          callback({ ok: true, message: sentMessage });
        }
      },
    );
    vi.mocked(getChatSocket).mockReturnValue({
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: sendEmit,
    } as unknown as ReturnType<typeof getChatSocket>);

    renderChat();
    fireEvent.click(await screen.findByText("Ana Pérez"));
    await screen.findByText(/Aún no hay mensajes/);
    const textarea = screen.getByTestId("message-textarea");
    fireEvent.change(textarea, { target: { value: "Hola" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    await waitFor(() => {
      expect(sendEmit).toHaveBeenCalledWith(
        "message:send",
        { conversationId: conversation.id, content: "Hola" },
        expect.any(Function),
      );
    });
    expect(textarea).toHaveValue("Hola");
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await waitFor(() => {
  expect(
    sendEmit.mock.calls.filter(
      (call) => call[0] === "message:send"
    )
  ).toHaveLength(2);

  expect(textarea).toHaveValue("");

  expect(
    screen.queryByText(/No se pudo enviar el mensaje/i)
  ).toBeNull();
});
  });

  it("ConversationList debe permitir buscar, cambiar filtros y cargar mas", () => {
    const handleSearch = vi.fn();
    const handleFilter = vi.fn();
    const handleLoadMore = vi.fn();
    render(
      <ConversationList
        conversations={[mockConversationWithAvatar]}
        connectionRequests={[]}
        selectedId={null}
        selectedRequestId={null}
        isLoading={false}
        isLoadingRequests={false}
        isRequestsError={false}
        hasMore={true}
        activeFilter="all"
        searchQuery=""
        onSelectConversation={vi.fn()}
        onSelectRequest={vi.fn()}
        onFilterChange={handleFilter}
        onSearchChange={handleSearch}
        onLoadMore={handleLoadMore}
        onStartNewChat={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Buscar personas..."), {
      target: { value: "Maria" },
    });
    expect(handleSearch).toHaveBeenCalledWith("Maria");
    fireEvent.click(screen.getByText("Sin leer"));
    expect(handleFilter).toHaveBeenCalledWith("unread");
    fireEvent.click(screen.getByText("Cargar más conversaciones"));
    expect(handleLoadMore).toHaveBeenCalled();
  });

  it("ConversationList debe mostrar los diferentes mensajes de estado vacio segun filtros", () => {
    const baseProps = {
      conversations: [],
      connectionRequests: [],
      selectedId: null,
      selectedRequestId: null,
      isLoading: false,
      isLoadingRequests: false,
      isRequestsError: false,
      hasMore: false,
      onSelectConversation: vi.fn(),
      onSelectRequest: vi.fn(),
      onFilterChange: vi.fn(),
      onSearchChange: vi.fn(),
    };
    const { rerender } = render(
      <ConversationList {...baseProps} activeFilter="unread" searchQuery="" />,
    );
    expect(screen.getByText("No tienes mensajes ni solicitudes pendientes.")).toBeDefined();
    rerender(
      <ConversationList {...baseProps} activeFilter="all" searchQuery="TextoNoExistente" />,
    );
    expect(screen.getByText("No se encontraron conversaciones ni solicitudes que coincidan con tu búsqueda.")).toBeDefined();
    rerender(
      <ConversationList {...baseProps} activeFilter="all" searchQuery="" />,
    );
    expect(screen.getByText("Aún no tienes conversaciones ni solicitudes registradas.")).toBeDefined();
  });
});
