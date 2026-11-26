import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureCompanyCorrectionToken,
  discardCompanyCorrectionToken,
  getCompanyCorrectionTokenSnapshot,
  subscribeCompanyCorrectionToken,
} from "./company-correction-token-store";

const TOKEN = `ccr1.${"x".repeat(43)}`;

describe("company correction token store", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/request-access/status?code=EMP-2026-0001");
  });

  afterEach(() => {
    discardCompanyCorrectionToken();
    window.history.replaceState(null, "", "/");
  });

  it("guarda el permiso en memoria y lo retira de la URL", () => {
    window.history.replaceState(null, "", `/request-access/status?code=EMP-2026-0001&email=a%40b.com#token=${TOKEN}`);
    const listener = vi.fn();
    const unsubscribe = subscribeCompanyCorrectionToken(listener);

    captureCompanyCorrectionToken();

    expect(getCompanyCorrectionTokenSnapshot()).toBe(TOKEN);
    expect(listener).toHaveBeenCalledOnce();
    expect(window.location.hash).toBe("");
    expect(window.location.search).toBe("?code=EMP-2026-0001&email=a%40b.com");
    expect(window.location.href).not.toContain(TOKEN);
    unsubscribe();
  });

  it("una segunda lectura sin fragmento conserva el permiso ya guardado", () => {
    window.history.replaceState(null, "", `/request-access/status#token=${TOKEN}`);
    captureCompanyCorrectionToken();
    captureCompanyCorrectionToken();
    expect(getCompanyCorrectionTokenSnapshot()).toBe(TOKEN);
  });

  it("ignora un fragmento sin permiso válido y no toca la URL", () => {
    window.history.replaceState(null, "", "/request-access/status#token=corto");
    captureCompanyCorrectionToken();
    expect(getCompanyCorrectionTokenSnapshot()).toBeNull();
    expect(window.location.hash).toBe("#token=corto");
  });

  it("descarta el permiso, avisa a los suscriptores y deja de avisar tras cancelar la suscripción", () => {
    window.history.replaceState(null, "", `/request-access/status#token=${TOKEN}`);
    captureCompanyCorrectionToken();
    const listener = vi.fn();
    const unsubscribe = subscribeCompanyCorrectionToken(listener);

    discardCompanyCorrectionToken();
    expect(getCompanyCorrectionTokenSnapshot()).toBeNull();
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    discardCompanyCorrectionToken();
    expect(listener).toHaveBeenCalledOnce();
  });
});
