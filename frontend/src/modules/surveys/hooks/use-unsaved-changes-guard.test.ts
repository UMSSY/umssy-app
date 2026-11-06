import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";

function click(id: string, init: MouseEventInit = {}) {
  act(() => {
    document.getElementById(id)?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
  });
}

describe("useUnsavedChangesGuard", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("bloquea recargas y enlaces internos solo cuando está activo", () => {
    document.body.innerHTML = `
      <a id="internal" href="/backoffice/surveys?x=1">Interno</a>
      <a id="external" href="https://example.com/a">Externo</a>
      <a id="blank" href="/otra" target="_blank">Nueva pestaña</a>
      <a id="same" href="${window.location.pathname}">Misma página</a>
      <span id="text">Texto</span>`;
    const { result, rerender } = renderHook(({ active }) => useUnsavedChangesGuard(active), {
      initialProps: { active: false },
    });

    const inactiveUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(inactiveUnload);
    expect(inactiveUnload.defaultPrevented).toBe(false);

    rerender({ active: true });
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    for (const id of ["external", "blank", "same", "text"]) click(id);
    click("internal", { ctrlKey: true });
    expect(result.current.pendingHref).toBeNull();

    click("internal");
    expect(result.current.pendingHref).toBe("/backoffice/surveys?x=1");

    act(() => result.current.clearPendingHref());
    expect(result.current.pendingHref).toBeNull();
  });

  it("deja de bloquear al desactivarse", () => {
    const { rerender } = renderHook(({ active }) => useUnsavedChangesGuard(active), { initialProps: { active: true } });

    rerender({ active: false });
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);

    expect(unload.defaultPrevented).toBe(false);
  });
});
