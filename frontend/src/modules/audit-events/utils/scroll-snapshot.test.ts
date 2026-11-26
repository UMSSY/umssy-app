import { afterEach, describe, expect, it } from "vitest";
import { captureScrollPositions, restoreScrollPositions } from "./scroll-snapshot";

function scrollable(overflowY: string, scrollHeight: number, clientHeight: number, scrollTop = 0, scrollLeft = 0) {
  const element = document.createElement("div");
  element.style.overflowY = overflowY;
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
  Object.defineProperty(element, "scrollTop", { configurable: true, writable: true, value: scrollTop });
  Object.defineProperty(element, "scrollLeft", { configurable: true, writable: true, value: scrollLeft });
  return element;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("scroll-snapshot", () => {
  it("guarda siempre el scroll del documento aunque no haya ancla", () => {
    const positions = captureScrollPositions(null);

    expect(positions).toHaveLength(1);
    expect(positions[0].element).toBe(document.scrollingElement ?? document.documentElement);
  });

  it("incluye los ancestros con scroll vertical y omite los que no lo tienen", () => {
    const outer = scrollable("auto", 2000, 500, 300, 12);
    const noOverflow = scrollable("visible", 2000, 500, 50);
    const hidden = scrollable("hidden", 2000, 500, 70);
    const short = scrollable("auto", 400, 500, 0);
    const anchor = document.createElement("div");
    short.append(anchor);
    hidden.append(short);
    noOverflow.append(hidden);
    outer.append(noOverflow);
    document.body.append(outer);

    const elements = captureScrollPositions(anchor).map((position) => position.element);

    expect(elements).toContain(outer);
    expect(elements).not.toContain(noOverflow);
    expect(elements).not.toContain(hidden);
    expect(elements).not.toContain(short);
    expect(captureScrollPositions(anchor).find((position) => position.element === outer)).toMatchObject({ top: 300, left: 12 });
  });

  it("restaura la posición guardada tras un reinicio del scroll", () => {
    const container = scrollable("scroll", 3000, 600, 900, 40);
    const anchor = document.createElement("span");
    container.append(anchor);
    document.body.append(container);

    const positions = captureScrollPositions(anchor);
    container.scrollTop = 0;
    container.scrollLeft = 0;
    restoreScrollPositions(positions);

    expect(container.scrollTop).toBe(900);
    expect(container.scrollLeft).toBe(40);
  });

  it("no toca elementos que ya no están en el documento", () => {
    const container = scrollable("auto", 3000, 600, 900);
    const anchor = document.createElement("span");
    container.append(anchor);
    document.body.append(container);
    const positions = captureScrollPositions(anchor);

    container.remove();
    container.scrollTop = 5;
    restoreScrollPositions(positions);

    expect(container.scrollTop).toBe(5);
  });
});
