import { renderWithQuery as render } from "@/shared/testing/render-with-query";

import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ChatView } from "../views/chat-view";
import { ChatRoom } from "../components/chat-room";
import { getChatSocket } from "../components/chat-socket";
import * as chatApi from "../services/chat-api";

import type {
  Conversation,
  Message,
} from "../types/conversation.types";

vi.mock("../components/chat-socket", () => ({
  getChatSocket: vi.fn(),
}));

const conversation: Conversation = {
  id: "empty-chat",
  contact: {
    id: "contact",
    fullName: "Ana Pérez",
    avatarUrl: null,
    isOnline: false,
  },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: "2026-10-05T12:00:00Z",
};

const sentMessage: Message = {
  id: "sent",
  conversationId: conversation.id,
  senderId: "me",
  content: "Hola",
  status: "sent",
  timestamp: conversation.updatedAt,
  createdAt: conversation.updatedAt,
};

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
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <ChatView />
    </QueryClientProvider>,
  );
}

describe("Estados del chat", () => {
  it(
    "muestra carga, error y permite recuperar la lista sin mostrar un falso vacío",
    async () => {
      let rejectLoad!: (reason: Error) => void;

      vi.spyOn(chatApi, "getConversations")
        .mockImplementationOnce(
          () =>
            new Promise((_, reject) => {
              rejectLoad = reject;
            }),
        )
        .mockResolvedValueOnce([conversation]);

      renderChat();

      expect(
        screen.getByRole("status", {
          name: "Cargando conversaciones",
        }),
      ).toBeDefined();

      await act(async () => {
        rejectLoad(new Error("network"));
      });

      expect(
        await screen.findByRole("alertdialog"),
      ).toHaveTextContent(
        "No pudimos cargar tus conversaciones",
      );

      expect(
        screen.queryByText(
          "Aún no tienes ninguna conversación registrada.",
        ),
      ).toBeNull();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Reintentar",
        }),
      );

      expect(
        await screen.findByText("Ana Pérez"),
      ).toBeDefined();

      expect(
        screen.queryByRole("alertdialog"),
      ).toBeNull();
    },
  );

  it(
    "distingue carga y error del historial vacío y recupera la conversación al reintentar",
    async () => {
      vi.spyOn(
        chatApi,
        "getConversations",
      ).mockResolvedValue([conversation]);

      let rejectLoad!: (reason: Error) => void;

      vi.spyOn(chatApi, "getPaginatedMessages")
        .mockImplementationOnce(
          () =>
            new Promise((_, reject) => {
              rejectLoad = reject;
            }),
        )
        .mockResolvedValue({
          data: [],
          hasMore: false,
          nextCursor: null,
        });

      renderChat();

      fireEvent.click(
        await screen.findByText("Ana Pérez"),
      );

      expect(
        screen.getByTestId("initial-messages-loading"),
      ).toBeDefined();

      expect(
        screen.queryByText(/Aún no hay mensajes/),
      ).toBeNull();

      await act(async () => {
        rejectLoad(new Error("network"));
      });

      expect(
        await screen.findByRole("alert"),
      ).toHaveTextContent(
        "No pudimos cargar los mensajes",
      );

      expect(
        screen.queryByText(/Aún no hay mensajes/),
      ).toBeNull();

      expect(
        screen.getByTestId("message-textarea"),
      ).toBeDisabled();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Reintentar",
        }),
      );

      expect(
        await screen.findByText(/Aún no hay mensajes/),
      ).toBeDefined();

      expect(
        screen.getByTestId("message-textarea"),
      ).not.toBeDisabled();
    },
  );

  it(
    "conserva el borrador tras fallar el envío y lo limpia solo cuando se envía correctamente",
    async () => {
      vi.spyOn(
        chatApi,
        "getConversations",
      ).mockResolvedValue([conversation]);

      vi.spyOn(chatApi, "getPaginatedMessages")
        .mockResolvedValueOnce({
          data: [],
          hasMore: false,
          nextCursor: null,
        })
        .mockResolvedValue({
          data: [sentMessage],
          hasMore: false,
          nextCursor: null,
        });

      let attempts = 0;
      const sendEmit = vi.fn(
        (
          event: string,
          _payload: unknown,
          callback?: (result: {
            ok: boolean;
            message?: Message;
            error?: string;
          }) => void,
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

      fireEvent.click(
        await screen.findByText("Ana Pérez"),
      );

      await screen.findByText(
        /Aún no hay mensajes/,
      );

      const textarea = screen.getByTestId(
        "message-textarea",
      );

      fireEvent.change(textarea, {
        target: {
          value: "Hola",
        },
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Enviar mensaje",
        }),
      );

      expect(
        await screen.findByRole("alert"),
      ).toHaveTextContent(
        "No se pudo enviar",
      );

      expect(textarea).toHaveValue("Hola");

      await waitFor(() => {
        expect(sendEmit).toHaveBeenCalledWith(
          "message:send",
          { conversationId: conversation.id, content: "Hola" },
          expect.any(Function),
        );
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Enviar mensaje",
        }),
      );

      await waitFor(() => {
        expect(
          sendEmit.mock.calls.filter((call) => call[0] === "message:send"),
        ).toHaveLength(2);
        expect(textarea).toHaveValue("");
        expect(
          screen.queryByRole("alert"),
        ).toBeNull();
      });
    },
  );

  it(
    "elimina el error local después de reintentar correctamente en ChatRoom",
    async () => {
      const onSendMessage = vi
        .fn()
        .mockRejectedValueOnce(
          new Error("offline"),
        )
        .mockResolvedValueOnce(undefined);

      render(
        <ChatRoom
          conversation={conversation}
          messages={[]}
          currentUserId="me"
          onBack={vi.fn()}
          onSendMessage={onSendMessage}
        />,
      );

      const textarea = screen.getByTestId(
        "message-textarea",
      );

      fireEvent.change(textarea, {
        target: {
          value: "Hola",
        },
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Enviar mensaje",
        }),
      );

      expect(
        await screen.findByRole("alert"),
      ).toHaveTextContent(
        "No se pudo enviar",
      );

      expect(textarea).toHaveValue("Hola");

      fireEvent.click(
        screen.getByRole("button", {
          name: "Enviar mensaje",
        }),
      );

      await waitFor(() => {
        expect(onSendMessage).toHaveBeenCalledTimes(2);
        expect(textarea).toHaveValue("");
        expect(
          screen.queryByRole("alert"),
        ).toBeNull();
      });
    },
  );

  it(
    "conserva mensajes visibles y evita reintentos automáticos de una página que falló",
    () => {
      const retry = vi.fn();

      render(
        <ChatRoom
          conversation={conversation}
          messages={[
            {
              id: "message",
              conversationId: conversation.id,
              senderId: "contact",
              content: "Mensaje conservado",
              timestamp: conversation.updatedAt,
              createdAt: conversation.updatedAt,
              status: "sent",
            },
          ]}
          currentUserId="me"
          onBack={vi.fn()}
          onSendMessage={vi.fn()}
          hasMoreMessages
          isMessagesError
          isLoadingOlderError
          onLoadMoreMessages={retry}
        />,
      );

      expect(
        screen.getByText("Mensaje conservado"),
      ).toBeDefined();

      fireEvent.scroll(
        screen.getByTestId("messages-container"),
      );

      expect(retry).not.toHaveBeenCalled();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Reintentar",
        }),
      );

      expect(retry).toHaveBeenCalledTimes(1);
    },
  );
});