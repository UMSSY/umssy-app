import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionInactivity } from "./use-session-inactivity";

describe("useSessionInactivity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not show warning modal while user remains active (CA8)", () => {
    const onTimeout = vi.fn();
    const onRefresh = vi.fn();

    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60, // 15 min
        warningSeconds: 3 * 60, // 3 min
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    expect(result.current.isWarningOpen).toBe(false);

    // Avanza 11 minutos (sin llegar a los 12 minutos donde empieza la advertencia)
    act(() => {
      vi.advanceTimersByTime(11 * 60 * 1000);
    });
    expect(result.current.isWarningOpen).toBe(false);

    // Simula interacción del usuario (click / scroll) que reinicia la inactividad
    act(() => {
      window.dispatchEvent(new MouseEvent("click"));
    });

    // Avanza otros 11 minutos desde la interacción
    act(() => {
      vi.advanceTimersByTime(11 * 60 * 1000);
    });

    // Como el usuario estuvo activo, la sesión no expira ni sale el modal
    expect(result.current.isWarningOpen).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("opens warning modal at minute 12 with 03:00 countdown when inactive (CA4)", () => {
    const onTimeout = vi.fn();
    const onRefresh = vi.fn();

    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60, // 900s
        warningSeconds: 3 * 60, // 180s (3 min)
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    // Avanza exactamente 12 minutos (15 - 3 = 12 min = 720 s)
    act(() => {
      vi.advanceTimersByTime(12 * 60 * 1000);
    });

    // Abre el modal de advertencia y la cuenta regresiva empieza en 180s (03:00)
    expect(result.current.isWarningOpen).toBe(true);
    expect(result.current.secondsLeft).toBe(180);

    // Avanza 1 segundo
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondsLeft).toBe(179);
  });

  it("resets countdown and closes modal when stayConnected is executed (CA5)", async () => {
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

    // Avanza a la ventana de advertencia
    act(() => {
      vi.advanceTimersByTime(12 * 60 * 1000);
    });
    expect(result.current.isWarningOpen).toBe(true);

    // El usuario pulsa "Seguir conectado"
    await act(async () => {
      await result.current.stayConnected();
    });

    // Llama al refresh del backend, cierra el modal y restablece el tiempo
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.isWarningOpen).toBe(false);
    expect(result.current.secondsLeft).toBe(180);
  });

  it("triggers onTimeout when countdown reaches zero without activity (CA6)", () => {
    const onTimeout = vi.fn();

    renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        checkIntervalMs: 1000,
        onTimeout,
      }),
    );

    // Avanza 15 minutos completos
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("respects absoluteExpiresAt cap even if user is active", () => {
    const onTimeout = vi.fn();
    const absoluteExpiresAt = new Date(Date.now() + 60 * 1000).toISOString(); // 1 min

    const { result } = renderHook(() =>
      useSessionInactivity({
        idleTimeoutSeconds: 15 * 60,
        warningSeconds: 3 * 60,
        absoluteExpiresAt,
        checkIntervalMs: 1000,
        onTimeout,
      }),
    );

    // Avanza 30s: entra en warningSeconds porque el tope absoluto queda en 30s (< 180s)
    act(() => {
      vi.advanceTimersByTime(30 * 1000);
    });
    expect(result.current.isWarningOpen).toBe(true);
    expect(result.current.secondsLeft).toBe(30);

    // Avanza los 30s restantes: expira absolutamente
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
        autoRefreshIntervalSeconds: 10 * 60, // 10 min
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    // Simula interacción del usuario en el minuto 5
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
      window.dispatchEvent(new MouseEvent("click"));
    });

    expect(onRefresh).not.toHaveBeenCalled();

    // Avanza hasta el minuto 10 (cumple el intervalo de 10 min y hubo actividad)
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
        autoRefreshIntervalSeconds: 10 * 60, // 10 min
        checkIntervalMs: 1000,
        onTimeout,
        onRefresh,
      }),
    );

    // No hay clics ni interacción, solo corre el tiempo por 10 min
    await act(async () => {
      vi.advanceTimersByTime(10 * 60 * 1000 + 1000);
    });

    // No debe renovar porque no hubo actividad nueva
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
