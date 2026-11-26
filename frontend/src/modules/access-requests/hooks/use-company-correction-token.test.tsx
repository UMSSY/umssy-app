import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { discardCompanyCorrectionToken } from "../utils/company-correction-token-store";
import { useCompanyCorrectionToken } from "./use-company-correction-token";

const TOKEN = `ccr1.${"x".repeat(43)}`;

describe("useCompanyCorrectionToken", () => {
  afterEach(() => {
    cleanup();
    discardCompanyCorrectionToken();
    window.history.replaceState(null, "", "/");
  });

  it("lee el permiso del fragmento, lo limpia de la URL y lo conserva en memoria", () => {
    window.history.replaceState(null, "", `/request-access/status?code=EMP-2026-0001#token=${TOKEN}`);

    const { result } = renderHook(() => useCompanyCorrectionToken());

    expect(result.current.token).toBe(TOKEN);
    expect(window.location.hash).toBe("");
    expect(window.location.href).not.toContain(TOKEN);
  });

  it("no hay permiso sin fragmento y descartar lo deja en null", () => {
    window.history.replaceState(null, "", "/request-access/status?code=EMP-2026-0001");
    const empty = renderHook(() => useCompanyCorrectionToken());
    expect(empty.result.current.token).toBeNull();
    empty.unmount();

    window.history.replaceState(null, "", `/request-access/status#token=${TOKEN}`);
    const { result, rerender } = renderHook(() => useCompanyCorrectionToken());
    expect(result.current.token).toBe(TOKEN);

    result.current.discardToken();
    rerender();
    expect(result.current.token).toBeNull();
  });
});
