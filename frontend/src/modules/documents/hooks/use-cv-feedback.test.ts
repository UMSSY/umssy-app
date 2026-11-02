import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCvFeedback } from "./use-cv-feedback";

describe("useCvFeedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("starts without feedback", () => {
    const { result } = renderHook(() => useCvFeedback());

    expect(result.current.feedback).toBeNull();
  });

  it("hides a success message after five seconds", () => {
    const { result } = renderHook(() => useCvFeedback());

    act(() => result.current.setFeedback({ type: "success", message: "Tu CV se cargó correctamente." }));
    act(() => vi.advanceTimersByTime(4999));

    expect(result.current.feedback).toEqual({ type: "success", message: "Tu CV se cargó correctamente." });

    act(() => vi.advanceTimersByTime(1));

    expect(result.current.feedback).toBeNull();
  });

  it("keeps an error message until the next action", () => {
    const { result } = renderHook(() => useCvFeedback());

    act(() => result.current.setFeedback({ type: "error", message: "No se pudo subir tu CV." }));
    act(() => vi.advanceTimersByTime(60000));

    expect(result.current.feedback).toEqual({ type: "error", message: "No se pudo subir tu CV." });
  });

  it("restarts the time when a new success message replaces the previous one", () => {
    const { result } = renderHook(() => useCvFeedback());

    act(() => result.current.setFeedback({ type: "success", message: "El CV se eliminó." }));
    act(() => vi.advanceTimersByTime(3000));
    act(() => result.current.setFeedback({ type: "success", message: "Tu CV se cargó correctamente." }));
    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.feedback?.message).toBe("Tu CV se cargó correctamente.");

    act(() => vi.advanceTimersByTime(2000));

    expect(result.current.feedback).toBeNull();
  });

  it("does not hide an error that replaced a success message", () => {
    const { result } = renderHook(() => useCvFeedback());

    act(() => result.current.setFeedback({ type: "success", message: "El CV se eliminó." }));
    act(() => result.current.setFeedback({ type: "error", message: "No se pudo eliminar tu CV." }));
    act(() => vi.advanceTimersByTime(10000));

    expect(result.current.feedback?.type).toBe("error");
  });
});
