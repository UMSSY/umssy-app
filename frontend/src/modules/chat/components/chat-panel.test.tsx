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
  useSearchParams: () => new URLSearchParams(window.location.search),
  usePathname: () => "/dashboard",
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("../services/chat-socket", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/chat-socket")>();

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

      expect(fullInput).toHaveAttribute("readonly");
      expect(fullInput).toHaveAttribute("aria-busy", "true");
      expect(fullInput).toHaveValue("Primer mensaje");

      await act(async () => {
        finishSend();
      });

      await waitFor(() => {
        expect(fullInput).not.toHaveAttribute("readonly");
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

  it("follows the visible area of the screen while open so the input stays above the keyboard", () => {
    const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0 });
    vi.stubGlobal("visualViewport", viewport);

    try {
      render(
        <MessagingUiProvider>
          <ChatPanel roles={["mentor"]} />
          <ChatDock />
        </MessagingUiProvider>,
      );
      const dock = screen.getByTestId("chat-dock");
      expect(dock.style.getPropertyValue("--chat-dock-height")).toBe("100dvh");

      fireEvent.click(screen.getByRole("button", { name: "Abrir mensajes rápidos" }));
      expect(dock.style.getPropertyValue("--chat-dock-height")).toBe("800px");

      act(() => {
        viewport.height = 420;
        viewport.offsetTop = 60;
        viewport.dispatchEvent(new Event("resize"));
      });
      expect(dock.style.getPropertyValue("--chat-dock-height")).toBe("420px");
      expect(dock.style.getPropertyValue("--chat-dock-top")).toBe("60px");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("locks the page behind and keeps the focused field visible when the keyboard changes the visible area on mobile", async () => {
    const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0 });
    const scrollIntoView = vi.fn();
    vi.stubGlobal("visualViewport", viewport);
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(width < 48rem)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
      render(
        <MessagingUiProvider>
          <ChatPanel roles={["mentor"]} />
          <ChatDock />
        </MessagingUiProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Abrir mensajes rápidos" }));
      expect(document.documentElement.style.overflow).toBe("hidden");

      scrollIntoView.mockClear();
      act(() => {
        viewport.height = 420;
        viewport.dispatchEvent(new Event("resize"));
      });
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" }));

      fireEvent.click(screen.getByRole("button", { name: "Cerrar mensajes rápidos" }));
      expect(document.documentElement.style.overflow).toBe("");
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      vi.unstubAllGlobals();
    }
  });

  it("updates page scroll locking across the md breakpoint while the chat stays open", () => {
    const mediaQuery = Object.assign(new EventTarget(), { matches: true });
    const matchMedia = vi.fn().mockReturnValue(mediaQuery);
    vi.stubGlobal("matchMedia", matchMedia);
    const root = document.documentElement;
    const originalOverflow = root.style.overflow;
    root.style.overflow = "auto";

    try {
      const { unmount } = render(
        <MessagingUiProvider>
          <ChatPanel roles={["mentor"]} />
          <ChatDock />
        </MessagingUiProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Abrir mensajes rápidos" }));
      expect(matchMedia).toHaveBeenCalledWith("(width < 48rem)");
      expect(root.style.overflow).toBe("hidden");

      mediaQuery.matches = false;
      mediaQuery.dispatchEvent(new Event("change"));
      expect(root.style.overflow).toBe("auto");
      expect(screen.getByRole("button", { name: "Cerrar mensajes rápidos" })).toBeInTheDocument();

      mediaQuery.matches = true;
      mediaQuery.dispatchEvent(new Event("change"));
      expect(root.style.overflow).toBe("hidden");

      unmount();
      expect(root.style.overflow).toBe("auto");
      mediaQuery.dispatchEvent(new Event("change"));
      expect(root.style.overflow).toBe("auto");
    } finally {
      root.style.overflow = originalOverflow;
      vi.unstubAllGlobals();
    }
  });

  it("discounts the browser toolbar that Chrome still counts as hidden when the keyboard opens", () => {
    const viewport = Object.assign(new EventTarget(), { height: 717, offsetTop: 0 });
    vi.stubGlobal("visualViewport", viewport);
    vi.stubGlobal("innerWidth", 411);
    vi.stubGlobal("innerHeight", 717);

    try {
      render(
        <MessagingUiProvider>
          <ChatPanel roles={["mentor"]} />
          <ChatDock />
        </MessagingUiProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Abrir mensajes rápidos" }));
      const dock = screen.getByTestId("chat-dock");

      act(() => {
        vi.stubGlobal("innerHeight", 773);
        viewport.height = 773;
        window.dispatchEvent(new Event("resize"));
      });
      expect(dock.style.getPropertyValue("--chat-dock-height")).toBe("773px");

      act(() => {
        viewport.height = 395;
        viewport.dispatchEvent(new Event("resize"));
      });
      expect(dock.style.getPropertyValue("--chat-dock-height")).toBe("339px");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

vi.mock('../hooks/use-chat-connection', () => ({
  useChatConnection: () => ({ status: 'connected', refreshMessages: vi.fn() }),
}));
