import { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { Button } from "@/components/ui/button";

import { MessagingUiProvider } from "../contexts/messaging-ui-context";
import { ChatView } from "../views/chat-view";
import * as chatApi from "../services/chat-api";
import { ChatDock, ChatPanel } from "./chat-panel";

const socketMock = vi.hoisted(() => ({
  connected: true,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("@/shared/contexts/auth-context", () => ({
  useAuth: () => ({
    roles: ["mentor"],
    isLoading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("./chat-socket", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./chat-socket")>();

  return {
    ...actual,
    getChatSocket: () => socketMock,
  };
});

const CONVERSATIONS = [
  {
    id: "conversation-1",
    contact: {
      id: "user-1",
      fullName: "María Fernández",
      avatarUrl: null,
      isOnline: false,
    },
    lastMessage: null,
    unreadCount: 0,
    updatedAt: "2026-10-22T12:00:00Z",
  },
];

function MessagingFixture() {
  const [isFullView, setIsFullView] = useState(false);

  return (
    <MessagingUiProvider>
      <Button onClick={() => setIsFullView(true)}>
        Mostrar historial
      </Button>

      {isFullView ? (
        <ChatView />
      ) : (
        <>
          <ChatPanel roles={["mentor"]} />
          <ChatDock />
        </>
      )}
    </MessagingUiProvider>
  );
}

beforeEach(() => {
  socketMock.connected = true;
  socketMock.on.mockReset();
  socketMock.off.mockReset();
  socketMock.emit.mockReset();
  socketMock.disconnect.mockReset();

  vi.spyOn(chatApi, "getConversations").mockResolvedValue(
    CONVERSATIONS,
  );

  vi.spyOn(chatApi, "getPaginatedMessages").mockResolvedValue({
    data: [],
    hasMore: false,
    nextCursor: null,
  });

  vi.spyOn(
    chatApi,
    "markConversationAsRead",
  ).mockResolvedValue(undefined);

  vi.spyOn(
    chatApi,
    "getCurrentSessionUserId",
  ).mockReturnValue("me");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ChatPanel", () => {
  it(
    "does not fetch messages until opened and is unavailable to an administrator",
    () => {
      const { rerender } = render(
        <MessagingUiProvider>
          <ChatPanel roles={["mentor"]} />
        </MessagingUiProvider>,
      );

      expect(
        screen.getByRole("button", {
          name: "Abrir mensajes rápidos",
        }),
      ).toBeInTheDocument();

      expect(
        chatApi.getConversations,
      ).not.toHaveBeenCalled();

      rerender(
        <MessagingUiProvider>
          <ChatPanel roles={["administrativo"]} />
        </MessagingUiProvider>,
      );

      expect(
        screen.queryByRole("button", {
          name: "Abrir mensajes rápidos",
        }),
      ).not.toBeInTheDocument();
    },
  );

  it(
    "keeps the selected conversation and draft when closed, reopened and expanded",
    async () => {
      render(<MessagingFixture />);

      fireEvent.click(
        screen.getByRole("button", {
          name: "Abrir mensajes rápidos",
        }),
      );

      expect(
        screen.queryByRole("dialog"),
      ).not.toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Mostrar historial",
        }),
      ).toBeEnabled();

      fireEvent.click(
        await screen.findByText("María Fernández"),
      );

      const input = await screen.findByRole("textbox", {
        name: "Campo de redacción de mensaje",
      });

      fireEvent.change(input, {
        target: {
          value: "Quisiera coordinar la mentoría",
        },
      });

      expect(
        screen.getByRole("button", {
          name: "Volver a la lista de chats",
        }),
      ).toBeVisible();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Cerrar mensajes rápidos",
        }),
      );

      await waitFor(() => {
        expect(
          screen.queryByRole("textbox", {
            name: "Campo de redacción de mensaje",
          }),
        ).not.toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Abrir mensajes rápidos",
        }),
      );

      expect(
        await screen.findByRole("textbox", {
          name: "Campo de redacción de mensaje",
        }),
      ).toHaveValue("Quisiera coordinar la mentoría");

      fireEvent.click(
        screen.getByRole("link", {
          name: "Abrir mensajes en pantalla completa",
        }),
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: "Mostrar historial",
        }),
      );

      expect(
        await screen.findByRole("textbox", {
          name: "Campo de redacción de mensaje",
        }),
      ).toHaveValue("Quisiera coordinar la mentoría");
    },
  );

  it(
    "shares a pending send when opening the full history and clears only after completion",
    async () => {
      let finishSend!: () => void;

      socketMock.emit.mockImplementation(
        (
          event: string,
          _payload: unknown,
          callback?: (result: unknown) => void,
        ) => {
          if (event !== "message:send" || !callback) {
            return;
          }

          finishSend = () =>
            callback({
              ok: true,
              message: {
                id: "sent-1",
                conversationId: "conversation-1",
                senderId: "me",
                content: "Primer mensaje",
                createdAt: "2026-10-22T12:00:00Z",
                timestamp: "2026-10-22T12:00:00Z",
              },
            });
        },
      );

      const sentCalls = () =>
        socketMock.emit.mock.calls.filter(
          ([event]) => event === "message:send",
        );

      render(<MessagingFixture />);

      fireEvent.click(
        screen.getByRole("button", {
          name: "Abrir mensajes rápidos",
        }),
      );

      fireEvent.click(
        await screen.findByText("María Fernández"),
      );

      const input = await screen.findByRole("textbox", {
        name: "Campo de redacción de mensaje",
      });

      await waitFor(() => {
        expect(input).toBeEnabled();
      });

      fireEvent.change(input, {
        target: {
          value: "Primer mensaje",
        },
      });

      const sendButton = screen.getByRole("button", {
        name: "Enviar mensaje",
      });

      await waitFor(() => {
        expect(sendButton).toBeEnabled();
      });

      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(sentCalls()).toHaveLength(1);
      });

      expect(sentCalls()[0][1]).toEqual({
        conversationId: "conversation-1",
        content: "Primer mensaje",
      });

      fireEvent.click(
        screen.getByRole("link", {
          name: "Abrir mensajes en pantalla completa",
        }),
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: "Mostrar historial",
        }),
      );

      const fullInput = await screen.findByRole("textbox", {
        name: "Campo de redacción de mensaje",
      });

      expect(fullInput).toBeDisabled();
      expect(fullInput).toHaveValue("Primer mensaje");

      await act(async () => {
        finishSend();
      });

      await waitFor(() => {
        expect(fullInput).toBeEnabled();
      });

      await waitFor(() => {
        expect(fullInput).toHaveValue("");
      });

      fireEvent.change(fullInput, {
        target: {
          value: "Siguiente mensaje",
        },
      });

      expect(fullInput).toHaveValue("Siguiente mensaje");

      expect(sentCalls()).toHaveLength(1);
    },
  );
});