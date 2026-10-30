import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatConnection } from "../hooks/use-chat-connection";
import { synchronizeMessages } from "../services/synchronize-messages";
import { getChatSocket } from "../components/chat-socket";

vi.mock("../services/synchronize-messages", () => ({
  synchronizeMessages: vi.fn(),
}));
vi.mock("../components/chat-socket", () => ({ getChatSocket: vi.fn() }));
const listeners = new Map<string, (...args: unknown[]) => void>();
let joinResult = true;
let joinCallback: ((result: { ok: boolean }) => void) | undefined;
let deferJoin = false;
const socket = {
  connected: true,
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) =>
    listeners.set(event, handler),
  ),
  off: vi.fn((event: string) => listeners.delete(event)),
  emit: vi.fn(
    (
      _event: string,
      _payload: unknown,
      ack: (result: { ok: boolean }) => void,
    ) => {
      joinCallback = ack;
      if (!deferJoin) ack({ ok: joinResult });
    },
  ),
};
let client: QueryClient;
function network(online: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: online,
  });
  window.dispatchEvent(new Event(online ? "online" : "offline"));
}
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.clearAllMocks();
  listeners.clear();
  client = new QueryClient();
  joinResult = true;
  deferJoin = false;
  socket.connected = true;
  network(true);
  vi.mocked(getChatSocket).mockReturnValue(
    socket as unknown as ReturnType<typeof getChatSocket>,
  );
  vi.mocked(synchronizeMessages).mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  network(true);
  client.clear();
});

describe("recuperación con el socket de la epic", () => {
  it("espera conexión, confirmación de sala y sincronización antes de recuperarse", async () => {
    socket.connected = false;
    deferJoin = true;
    let resolve!: () => void;
    vi.mocked(synchronizeMessages).mockImplementation(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const { result } = renderHook(() => useChatConnection("a"), { wrapper });
    expect(result.current.status).toBe("reconnecting");
    expect(synchronizeMessages).not.toHaveBeenCalled();
    act(() => {
      socket.connected = true;
      listeners.get("connect")?.();
    });
    expect(synchronizeMessages).not.toHaveBeenCalled();
    await act(async () => joinCallback?.({ ok: true }));
    expect(result.current.status).toBe("reconnecting");
    await act(async () => resolve());
    expect(result.current.status).toBe("connected");
    expect(socket.emit).toHaveBeenCalledWith(
      "conversation:join",
      { conversationId: "a" },
      expect.any(Function),
    );
  });
  it("cancela la sincronización ante otra caída y vuelve a conectar sin recargar", async () => {
    let resolve!: () => void;
    vi.mocked(synchronizeMessages).mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const { result } = renderHook(() => useChatConnection("a"), { wrapper });
    await act(async () => {});
    act(() => network(false));
    expect(vi.mocked(synchronizeMessages).mock.calls[0][2].aborted).toBe(true);
    await act(async () => resolve());
    expect(result.current.status).toBe("offline");
    act(() => network(true));
    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect(synchronizeMessages).toHaveBeenCalledTimes(2);
  });
  it("no anuncia recuperación si falla la sincronización y reintenta", async () => {
    vi.useFakeTimers();
    vi.mocked(synchronizeMessages)
      .mockRejectedValueOnce(new Error("Servidor caído"))
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useChatConnection("a"), { wrapper });
    await act(async () => {});
    expect(result.current.status).toBe("reconnecting");
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.status).toBe("connected");
  });
  it("mantiene reconectando si el servidor rechaza o no confirma la sala", async () => {
    vi.useFakeTimers();
    deferJoin = true;
    const { result } = renderHook(() => useChatConnection("a"), { wrapper });
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(result.current.status).toBe("reconnecting");
    expect(synchronizeMessages).not.toHaveBeenCalled();
    deferJoin = false;
    joinResult = false;
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.status).toBe("reconnecting");
    expect(synchronizeMessages).not.toHaveBeenCalled();
  });
  it("cancela la sala anterior y recupera únicamente la nueva tras cambiar sin conexión", async () => {
    const { result, rerender } = renderHook(({ id }) => useChatConnection(id), {
      initialProps: { id: "a" },
      wrapper,
    });
    await waitFor(() => expect(result.current.status).toBe("connected"));
    act(() => network(false));
    rerender({ id: "b" });
    act(() => network(true));
    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect(vi.mocked(synchronizeMessages).mock.calls.at(-1)?.[1]).toBe("b");
  });
  it("recupera también mensajes que llegan durante la sincronización", async () => {
    let resolve!: () => void;
    vi.mocked(synchronizeMessages).mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const { result } = renderHook(() => useChatConnection("a"), { wrapper });
    await act(async () => {});
    act(() => listeners.get("message:new")?.({ conversationId: "a" }));
    await act(async () => resolve());
    expect(synchronizeMessages).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("connected");
    await act(async () =>
      listeners.get("message:new")?.({ conversationId: "a" }),
    );
    expect(synchronizeMessages).toHaveBeenCalledTimes(3);
  });
  it("no incorpora eventos de otra conversación y limpia sus suscripciones", async () => {
    const { result, unmount } = renderHook(() => useChatConnection("a"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.status).toBe("connected"));
    await act(async () =>
      listeners.get("message:new")?.({ conversationId: "b" }),
    );
    expect(synchronizeMessages).toHaveBeenCalledTimes(1);
    unmount();
    expect(listeners.size).toBe(0);
  });
  it("no da por recuperado un socket que falló aunque el navegador tenga internet", async () => {
    const { result } = renderHook(() => useChatConnection("a"), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("connected"));
    act(() => {
      socket.connected = false;
      listeners.get("connect_error")?.();
    });
    expect(result.current.status).toBe("reconnecting");
  });
});
