import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  executeSharedRefresh,
  REFRESH_LOCK_NAME,
} from "./session-refresh-lock";

describe("session-refresh-lock", () => {
  const originalLocks = navigator.locks;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "locks", {
      value: originalLocks,
      configurable: true,
      writable: true,
    });
  });

  it("ejecuta la función de refresh y retorna true cuando no hay candado previo", async () => {
    const mockRefresh = vi.fn().mockResolvedValue({ ok: true });
    const result = await executeSharedRefresh(mockRefresh);

    expect(result).toBe(true);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("reutiliza la promesa en curso ante llamadas concurrentes locales", async () => {
    let finishPromise!: () => void;
    const slowRefresh = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishPromise = resolve;
        }),
    );

    const call1 = executeSharedRefresh(slowRefresh);
    const call2 = executeSharedRefresh(slowRefresh);

    expect(slowRefresh).toHaveBeenCalledTimes(1);

    finishPromise();
    const [res1, res2] = await Promise.all([call1, call2]);
    expect(res1).toBe(true);
    expect(res2).toBe(true);
  });

  it("utiliza navigator.locks si está disponible y respeta si otra pestaña tiene el candado", async () => {
    const mockRequest = vi.fn().mockImplementation(
      (
        name: string,
        options: { ifAvailable: boolean },
        callback: (lock: { name: string } | null) => Promise<void>,
      ) => {
        expect(name).toBe(REFRESH_LOCK_NAME);
        expect(options.ifAvailable).toBe(true);
        // Simular que otra pestaña tiene el candado (lock === null)
        return callback(null);
      },
    );

    Object.defineProperty(navigator, "locks", {
      value: { request: mockRequest },
      configurable: true,
      writable: true,
    });

    const mockRefresh = vi.fn();
    const result = await executeSharedRefresh(mockRefresh);

    expect(result).toBe(false);
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
