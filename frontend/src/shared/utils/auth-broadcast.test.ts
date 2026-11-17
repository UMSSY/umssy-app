import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  AUTH_BROADCAST_CHANNEL,
  broadcastAuthEvent,
  useAuthBroadcastSync,
  type AuthBroadcastMessage,
} from "./auth-broadcast";

describe("auth-broadcast", () => {
  const originalBroadcastChannel = window.BroadcastChannel;
  let mockPostMessage: ReturnType<typeof vi.fn>;
  let mockClose: ReturnType<typeof vi.fn>;
  let mockInstances: Array<{
    name: string;
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onmessage: ((event: MessageEvent<AuthBroadcastMessage>) => void) | null;
  }>;

  beforeEach(() => {
    mockInstances = [];
    mockPostMessage = vi.fn();
    mockClose = vi.fn();

    class MockBroadcastChannel {
      name: string;
      onmessage: ((event: MessageEvent<AuthBroadcastMessage>) => void) | null = null;
      postMessage = mockPostMessage;
      close = mockClose;

      constructor(name: string) {
        this.name = name;
        mockInstances.push(this);
      }
    }

    // @ts-expect-error - mock channel
    window.BroadcastChannel = MockBroadcastChannel;
  });

  afterEach(() => {
    window.BroadcastChannel = originalBroadcastChannel;
  });

  it("broadcastAuthEvent envía mensaje al canal umssy_auth y cierra el canal", () => {
    broadcastAuthEvent({ type: "SESSION_CLOSED", reason: "SESSION_REVOKED" });

    expect(mockInstances).toHaveLength(1);
    expect(mockInstances[0].name).toBe(AUTH_BROADCAST_CHANNEL);
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SESSION_CLOSED",
      reason: "SESSION_REVOKED",
    });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it("broadcastAuthEvent no arroja error si BroadcastChannel no está disponible", () => {
    // @ts-expect-error - simular entorno sin BroadcastChannel
    delete window.BroadcastChannel;

    expect(() => {
      broadcastAuthEvent({ type: "LOGOUT" });
    }).not.toThrow();
  });

  it("broadcastAuthEvent no arroja error si postMessage o el canal arroja excepción", () => {
    mockPostMessage.mockImplementation(() => {
      throw new Error("Channel error");
    });

    expect(() => {
      broadcastAuthEvent({ type: "SESSION_CLOSED", reason: "REFRESH_INVALID" });
    }).not.toThrow();
  });

  it("useAuthBroadcastSync escucha mensajes y ejecuta el callback correspondiente", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useAuthBroadcastSync(callback));

    expect(mockInstances).toHaveLength(1);
    const channelInstance = mockInstances[0];

    // Simular recepción de mensaje desde otra pestaña
    const message: AuthBroadcastMessage = {
      type: "SESSION_CLOSED",
      reason: "PASSWORD_CHANGED",
    };
    channelInstance.onmessage?.({
      data: message,
    } as MessageEvent<AuthBroadcastMessage>);

    expect(callback).toHaveBeenCalledWith(message);

    unmount();
    expect(channelInstance.close).toHaveBeenCalledTimes(1);
  });

  it("useAuthBroadcastSync no falla si BroadcastChannel no existe en el entorno", () => {
    // @ts-expect-error - simular entorno sin BroadcastChannel
    delete window.BroadcastChannel;

    const callback = vi.fn();
    expect(() => {
      const { unmount } = renderHook(() => useAuthBroadcastSync(callback));
      unmount();
    }).not.toThrow();
  });
});

