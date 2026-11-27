import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { clearManualLogout, runManualLogout } from "./manual-logout";
import {
  executeSharedRefresh,
  REFRESH_LOCK_NAME,
  LAST_REFRESH_STORAGE_KEY,
} from "./session-refresh-lock";

describe("session-refresh-lock", () => {
  const originalLocks = navigator.locks;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    clearManualLogout();
    Object.defineProperty(navigator, "locks", {
      value: originalLocks,
      configurable: true,
      writable: true,
    });
    localStorage.clear();
  });

  it("ejecuta la función de refresh y retorna true cuando no hay candado previo", async () => {
    const mockRefresh = vi.fn().mockResolvedValue({ ok: true });
    const result = await executeSharedRefresh(mockRefresh);

    expect(result).toBe(true);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(LAST_REFRESH_STORAGE_KEY)).not.toBeNull();
  });

  it("utiliza defaultPerformRefresh llamando a /auth/refresh con withCredentials si no se pasa función", async () => {
    const postSpy = vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: { ok: true, accessToken: "new-token-123" },
    });

    const result = await executeSharedRefresh();

    expect(result).toBe(true);
    expect(postSpy).toHaveBeenCalledWith(
      expect.stringContaining("/auth/refresh"),
      {},
      { withCredentials: true, signal: expect.any(AbortSignal) },
    );
    postSpy.mockRestore();
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

  it("descarta una renovación iniciada antes del cierre incluso tras volver a iniciar sesión", async () => {
    let finishRefresh!: () => void;
    const refresh = executeSharedRefresh(
      () => new Promise<void>((resolve) => { finishRefresh = resolve; }),
    );

    await runManualLogout(async () => {});
    clearManualLogout();
    finishRefresh();

    await expect(refresh).resolves.toBe(false);
    expect(localStorage.getItem(LAST_REFRESH_STORAGE_KEY)).toBeNull();
  });

  it("con wait=false: retorna false inmediatamente si otra pestaña tiene el candado", async () => {
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
    const result = await executeSharedRefresh(mockRefresh, { wait: false });

    expect(result).toBe(false);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("con wait=true: espera al Web Lock y si otra pestaña acaba de renovar, no vuelve a llamar al backend", async () => {
    const mockRequest = vi.fn().mockImplementation(
      async (
        name: string,
        options: Record<string, unknown>,
        callback: (lock: { name: string } | null) => Promise<void>,
      ) => {
        expect(name).toBe(REFRESH_LOCK_NAME);
        // Sin ifAvailable (espera el candado)
        expect(options).toEqual({});

        // Simular que la otra pestaña renovó mientras esperábamos
        localStorage.setItem(LAST_REFRESH_STORAGE_KEY, String(Date.now() - 500)); // hace 500ms
        return callback({ name });
      },
    );

    Object.defineProperty(navigator, "locks", {
      value: { request: mockRequest },
      configurable: true,
      writable: true,
    });

    const mockRefresh = vi.fn();
    const result = await executeSharedRefresh(mockRefresh, { wait: true });

    // Debe retornar true sin haber llamado de nuevo al backend
    expect(result).toBe(true);
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
