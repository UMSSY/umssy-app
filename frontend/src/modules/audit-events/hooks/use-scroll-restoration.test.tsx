import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCROLL_RESTORE_DELAY_MS } from "../constants/audit-log.constants";
import { useScrollRestoration } from "./use-scroll-restoration";

function stubScrollingRoot(initial: number) {
  const root = document.documentElement;
  let top = initial;
  Object.defineProperty(root, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = value;
    },
  });
  return {
    read: () => top,
    reset: (value: number) => {
      top = value;
    },
    dispose: () => {
      delete (root as { scrollTop?: number }).scrollTop;
    },
  };
}

describe("useScrollRestoration", () => {
  let root: ReturnType<typeof stubScrollingRoot>;

  beforeEach(() => {
    vi.useFakeTimers();
    root = stubScrollingRoot(640);
  });

  afterEach(() => {
    root.dispose();
    cleanup();
    vi.useRealTimers();
  });

  it("restaura el scroll guardado en el siguiente cuadro y lo reafirma tras la animación", () => {
    const { result } = renderHook(() => useScrollRestoration<HTMLDivElement>());

    act(() => result.current.save());
    root.reset(0);
    act(() => result.current.restore());
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(root.read()).toBe(640);

    root.reset(10);
    act(() => {
      vi.advanceTimersByTime(SCROLL_RESTORE_DELAY_MS);
    });
    expect(root.read()).toBe(640);
  });

  it("no hace nada si se pide restaurar sin haber guardado", () => {
    const { result } = renderHook(() => useScrollRestoration<HTMLDivElement>());

    root.reset(200);
    act(() => result.current.restore());
    act(() => {
      vi.advanceTimersByTime(SCROLL_RESTORE_DELAY_MS + 50);
    });

    expect(root.read()).toBe(200);
  });

  it("restaura una sola vez por cada guardado", () => {
    const { result } = renderHook(() => useScrollRestoration<HTMLDivElement>());

    act(() => result.current.save());
    act(() => result.current.restore());
    act(() => {
      vi.advanceTimersByTime(SCROLL_RESTORE_DELAY_MS + 50);
    });
    root.reset(33);
    act(() => result.current.restore());
    act(() => {
      vi.advanceTimersByTime(SCROLL_RESTORE_DELAY_MS + 50);
    });

    expect(root.read()).toBe(33);
  });

  it("cancela la reafirmación pendiente al desmontar", () => {
    const { result, unmount } = renderHook(() => useScrollRestoration<HTMLDivElement>());

    act(() => result.current.save());
    act(() => result.current.restore());
    unmount();
    root.reset(7);
    act(() => {
      vi.advanceTimersByTime(SCROLL_RESTORE_DELAY_MS + 50);
    });

    expect(root.read()).toBe(7);
  });

  it("usa como ancla el elemento al que se enlaza la referencia", () => {
    function Probe() {
      const { anchorRef, save } = useScrollRestoration<HTMLDivElement>();
      return <div ref={anchorRef} data-testid="anchor" onClick={save} />;
    }

    const { getByTestId } = render(<Probe />);
    expect(getByTestId("anchor")).toBeInTheDocument();
  });
});
