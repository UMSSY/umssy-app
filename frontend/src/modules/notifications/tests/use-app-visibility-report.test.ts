import { renderHook } from "@testing-library/react";
import type { Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { useAppVisibilityReport } from "../hooks/use-app-visibility-report";
import { getNotificationsSocket } from "../services/notifications-socket";

vi.mock("@/shared/services/storage/access-token-storage", () => ({
  getAccessToken: vi.fn(),
  subscribeAccessToken: vi.fn(() => () => undefined),
}));
vi.mock("../services/notifications-socket", () => ({
  getNotificationsSocket: vi.fn(),
  resetNotificationsSocket: vi.fn(),
}));

function createSocket(connected: boolean) {
  return { connected, emit: vi.fn(), on: vi.fn(), off: vi.fn() };
}

function setVisibilityState(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
}

beforeEach(() => {
  vi.clearAllMocks();
  setVisibilityState("visible");
});

afterEach(() => {
  setVisibilityState("visible");
});

describe("useAppVisibilityReport", () => {
  it("no abre el socket si no hay sesión", () => {
    vi.mocked(getAccessToken).mockReturnValue(null);

    renderHook(() => useAppVisibilityReport());

    expect(getNotificationsSocket).not.toHaveBeenCalled();
  });

  it("informa visible al montar con el socket conectado", () => {
    const socket = createSocket(true);
    vi.mocked(getAccessToken).mockReturnValue("token");
    vi.mocked(getNotificationsSocket).mockReturnValue(socket as unknown as Socket);

    renderHook(() => useAppVisibilityReport());

    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith("visibility:changed", { visible: true });
  });

  it("informa oculto cuando la página pasa a segundo plano", () => {
    const socket = createSocket(true);
    vi.mocked(getAccessToken).mockReturnValue("token");
    vi.mocked(getNotificationsSocket).mockReturnValue(socket as unknown as Socket);
    renderHook(() => useAppVisibilityReport());

    setVisibilityState("hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(socket.emit).toHaveBeenLastCalledWith("visibility:changed", { visible: false });
  });

  it("espera a la conexión para informar el estado", () => {
    const socket = createSocket(false);
    vi.mocked(getAccessToken).mockReturnValue("token");
    vi.mocked(getNotificationsSocket).mockReturnValue(socket as unknown as Socket);

    renderHook(() => useAppVisibilityReport());
    expect(socket.emit).not.toHaveBeenCalled();

    const connectHandler = socket.on.mock.calls.find(([event]) => event === "connect")?.[1] as () => void;
    connectHandler();

    expect(socket.emit).toHaveBeenCalledWith("visibility:changed", { visible: true });
  });
});
