import { beforeEach, describe, expect, it, vi } from "vitest";
import { io } from "socket.io-client";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";

vi.mock("socket.io-client", () => ({ io: vi.fn() }));
vi.mock("@/shared/services/storage/access-token-storage", () => ({
  getAccessToken: vi.fn(),
}));
vi.mock("@/shared/config/env.config", () => ({
  ENV_CONFIG: { apiUrl: "http://localhost:8080/api" },
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("socket de chat de la epic", () => {
  it("usa el namespace /chat y actualiza el token antes de cada handshake", async () => {
    const socket = {
      connected: false,
      connect: vi.fn(),
      auth: undefined as unknown,
    };
    vi.mocked(io).mockReturnValue(socket as unknown as ReturnType<typeof io>);
    vi.mocked(getAccessToken).mockReturnValue("first-token");
    const { getChatSocket } = await import("../components/chat-socket");
    expect(getChatSocket()).toBe(socket);
    expect(io).toHaveBeenCalledWith(
      "http://localhost:8080/chat",
      expect.objectContaining({
        autoConnect: false,
        transports: ["websocket"],
      }),
    );
    expect(socket.connect).toHaveBeenCalledOnce();
    vi.mocked(getAccessToken).mockReturnValue("renewed-token");
    const callback = vi.fn();
    (socket.auth as (cb: typeof callback) => void)(callback);
    expect(callback).toHaveBeenCalledWith({ token: "renewed-token" });
    socket.connected = true;
    getChatSocket();
    expect(io).toHaveBeenCalledOnce();
    expect(socket.connect).toHaveBeenCalledOnce();
  });
  it("no abre el socket sin sesión", async () => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    const { getChatSocket } = await import("../components/chat-socket");
    expect(() => getChatSocket()).toThrow("No hay una sesión iniciada");
    expect(io).not.toHaveBeenCalled();
  });
});
