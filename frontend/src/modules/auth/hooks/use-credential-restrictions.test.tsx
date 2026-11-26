import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCredentialRestrictions } from "./use-credential-restrictions";
import type { CredentialLimit, CredentialOperation } from "../types/credential-limit.types";
import { formatRemainingTime } from "../utils/format-remaining-time";

function limit(operation: CredentialOperation, seconds: number): CredentialLimit {
  return { code: "TEST_LIMIT", operation, retryAfterSeconds: seconds, retryAt: Date.now() + seconds * 1000 };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("restricciones de credenciales", () => {
  it("normaliza el correo y mantiene independientes las operaciones y las cuentas", () => {
    const { result } = renderHook(useCredentialRestrictions);
    act(() => { result.current.restrict(" User@Example.test ", limit("login", 900), "Inicio limitado"); });
    expect(result.current.getRestriction("login", "user@example.test")?.remainingSeconds).toBe(900);
    expect(result.current.getRestriction("request", "user@example.test")).toBeNull();
    expect(result.current.getRestriction("login", "other@example.test")).toBeNull();
  });

  it("actualiza el contador y libera la operación al cumplirse la espera", () => {
    const { result } = renderHook(useCredentialRestrictions);
    act(() => { result.current.restrict("user@example.test", limit("request", 2), "Espera"); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.getRestriction("request", "user@example.test")?.remainingSeconds).toBe(1);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.getRestriction("request", "user@example.test")).toBeNull();
    expect(result.current.isBlocked("request", "user@example.test")).toBe(false);
  });

  it("una espera corta no reemplaza un bloqueo todavía vigente", () => {
    const { result } = renderHook(useCredentialRestrictions);
    act(() => { result.current.restrict("user@example.test", limit("request", 900), "Cuota alcanzada"); });
    act(() => { result.current.restrict("user@example.test", limit("request", 120), "Espera breve"); });
    expect(result.current.getRestriction("request", "user@example.test")).toMatchObject({ message: "Cuota alcanzada", remainingSeconds: 900 });
  });

  it("un nuevo envío no elimina la restricción de verificación", () => {
    const { result } = renderHook(useCredentialRestrictions);
    act(() => { result.current.restrict("user@example.test", limit("verify", 900), "Verificación limitada"); });
    act(() => { result.current.restrict("user@example.test", limit("request", 120), "Espera de reenvío"); });
    act(() => { vi.advanceTimersByTime(120000); });
    expect(result.current.getRestriction("request", "user@example.test")).toBeNull();
    expect(result.current.isBlocked("verify", "user@example.test")).toBe(true);
  });

  it.each(["focus", "visibilitychange"])("actualiza el reloj al recibir %s después de suspender la pestaña", (event) => {
    const { result } = renderHook(useCredentialRestrictions);
    act(() => { result.current.restrict("user@example.test", limit("reset", 2), "Confirmación limitada"); });
    vi.setSystemTime(Date.now() + 3000);
    expect(result.current.isBlocked("reset", "user@example.test")).toBe(false);
    act(() => { (event === "focus" ? window : document).dispatchEvent(new Event(event)); });
    expect(result.current.getRestriction("reset", "user@example.test")).toBeNull();
  });

  it("ignora los errores sin metadatos de restricción", () => {
    const { result } = renderHook(useCredentialRestrictions);
    act(() => { expect(result.current.restrict("user@example.test", null, "Error")).toBe(false); });
    expect(result.current.getRestriction("request", "user@example.test")).toBeNull();
  });

  it("retira los temporizadores al desmontar", () => {
    const clear = vi.spyOn(window, "clearInterval");
    const { result, unmount } = renderHook(useCredentialRestrictions);
    act(() => { result.current.restrict("user@example.test", limit("verify", 900), "Espera"); });
    unmount();
    expect(clear).toHaveBeenCalled();
  });
});

it.each([[0, "00:00"], [1, "00:01"], [120, "02:00"], [900, "15:00"]])("presenta la espera %s como %s", (seconds, expected) => {
  expect(formatRemainingTime(Number(seconds))).toBe(expected);
});
