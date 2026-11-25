import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_LAST_ACTIVITY_KEY } from "@/shared/services/storage/session-activity-storage";
import { useSessionInactivity } from "./use-session-inactivity";

describe("useSessionInactivity", () => {
  const originalBroadcastChannel = window.BroadcastChannel;
  let broadcastChannels: Array<{
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onmessage: ((event: MessageEvent) => void) | null;
  }>;

  beforeEach(() => {
    // La actividad se comparte entre pestañas: cada caso parte sin marcas previas
    localStorage.clear();
    vi.useFakeTimers();
    localStorage.clear();
    broadcastChannels = [];

    class MockBroadcastChannel {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage = vi.fn((data: unknown) => {
        for (const instance of broadcastChannels) {
          if (instance !== this && instance.onmessage) {
            instance.onmessage({ data } as MessageEvent);
          }
        }
      });
      close = vi.fn();

      constructor() {
        broadcastChannels.push(this);
      }
    }

    // @ts-expect-error - test double for BroadcastChannel
    window.BroadcastChannel = MockBroadcastChannel;
  });

  afterEach(() => {
    window.BroadcastChannel = originalBroadcastChannel;
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not show warning modal while user remains active", () => {
    const onTimeout = vi.fn();
    const onRefresh = vi.fn();

    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    expect(result.current.isWarningOpen).toBe(false);

    act(() => {
      vi.advanceTimersByTime(11 * 60 * 1000);
    });
    expect(result.current.isWarningOpen).toBe(false);

    act(() => {
      window.dispatchEvent(new MouseEvent("click"));
    });

    act(() => {
      vi.advanceTimersByTime(11 * 60 * 1000);
    });

    expect(result.current.isWarningOpen).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("opens warning modal at minute 12 with 03:00 countdown when inactive", () => {
    const onTimeout = vi.fn();
    const onRefresh = vi.fn();

    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(12 * 60 * 1000);
    });

    expect(result.current.isWarningOpen).toBe(true);
    expect(result.current.secondsLeft).toBe(180);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondsLeft).toBe(179);
  });

  it("resets countdown and closes modal when stayConnected is executed", async () => {
    const onTimeout = vi.fn();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(12 * 60 * 1000);
    });
    expect(result.current.isWarningOpen).toBe(true);

    await act(async () => {
      await result.current.stayConnected();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.isWarningOpen).toBe(false);
    expect(result.current.secondsLeft).toBe(180);
  });

  it("triggers onTimeout when countdown reaches zero without activity", () => {
    const onTimeout = vi.fn();

    renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        checkIntervalMs: 1000,
        onTimeout,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("respects absoluteExpiresAt cap even if user is active", () => {
    const onTimeout = vi.fn();
    const absoluteExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();

    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        absoluteExpiresAt,
        checkIntervalMs: 1000,
        onTimeout,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(30 * 1000);
    });
    expect(result.current.isWarningOpen).toBe(true);
    expect(result.current.secondsLeft).toBe(30);

    act(() => {
      vi.advanceTimersByTime(30 * 1000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("renueva automáticamente el token periódicamente si hubo actividad del usuario", async () => {
    const onTimeout = vi.fn();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        autoRefreshIntervalSeconds: 10 * 60,
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
      window.dispatchEvent(new MouseEvent("click"));
    });

    expect(onRefresh).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("no renueva automáticamente si el usuario no tuvo interacción durante el intervalo", async () => {
    const onTimeout = vi.fn();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        autoRefreshIntervalSeconds: 10 * 60,
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    await act(async () => {
      vi.advanceTimersByTime(10 * 60 * 1000 + 1000);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("cierra la advertencia cuando otra pestaña transmite actividad por BroadcastChannel", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        checkIntervalMs: 1000,
        onTimeout,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(12 * 60 * 1000);
    });
    expect(result.current.isWarningOpen).toBe(true);

    const listenerChannel = broadcastChannels.find((channel) => channel.onmessage);
    expect(listenerChannel).toBeDefined();

    act(() => {
      listenerChannel?.onmessage?.({
        data: { type: "ACTIVITY", timestamp: Date.now() },
      } as MessageEvent);
    });

    expect(result.current.isWarningOpen).toBe(false);
    expect(result.current.secondsLeft).toBe(180);

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("evita expirar si localStorage registra actividad reciente de otra pestaña", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        checkIntervalMs: 1000,
        onTimeout,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(14 * 60 * 1000);
    });
    expect(result.current.isWarningOpen).toBe(true);

    act(() => {
      const freshTimestamp = Date.now();
      localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(freshTimestamp));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: SESSION_LAST_ACTIVITY_KEY,
          newValue: String(freshTimestamp),
        }),
      );
    });

    expect(result.current.isWarningOpen).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
