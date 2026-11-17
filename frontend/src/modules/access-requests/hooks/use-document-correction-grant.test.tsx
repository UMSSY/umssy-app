import { act, cleanup, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { useDocumentCorrectionGrant } from "./use-document-correction-grant";

const TOKEN = `dcr1.${"x".repeat(43)}`;

describe("useDocumentCorrectionGrant", () => {
  afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });

  it("lee el fragmento y retira solo el permiso confirmado, manteniendo código y otros parámetros", () => {
    window.history.replaceState({}, "", `/request-access/status?code=SOL-2026-0001#other=1&correctionToken=${TOKEN}`);
    const { result } = renderHook(useDocumentCorrectionGrant);
    expect(result.current.token).toBe(TOKEN);
    act(() => result.current.clearConfirmedToken("another-token"));
    expect(result.current.token).toBe(TOKEN);
    act(() => result.current.clearConfirmedToken(TOKEN));
    expect(result.current.token).toBeNull();
    expect(window.location.hash).toBe("#other=1");
    expect(window.location.search).toBe("?code=SOL-2026-0001");
  });

  it("actualiza el permiso cuando cambia el enlace y descarta el anterior", () => {
    window.history.replaceState({}, "", `/#correctionToken=${TOKEN}`);
    const { result } = renderHook(useDocumentCorrectionGrant);
    act(() => {
      window.history.replaceState({}, "", "/#correctionToken=invalid");
      window.dispatchEvent(new Event("hashchange"));
    });
    expect(result.current.token).toBeNull();
  });

  it("no incluye el permiso del navegador en el HTML generado en servidor", () => {
    window.history.replaceState({}, "", `/#correctionToken=${TOKEN}`);
    function Probe() {
      const { token } = useDocumentCorrectionGrant();
      return <p>{token ?? "Sin permiso en servidor"}</p>;
    }
    const html = renderToString(<Probe />);
    expect(html).toContain("Sin permiso en servidor");
    expect(html).not.toContain(TOKEN);
  });
});
