import type { ScrollPosition } from "../types/scroll-position.types";

const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/;

function isVerticallyScrollable(element: Element): boolean {
  return (
    element.scrollHeight > element.clientHeight &&
    SCROLLABLE_OVERFLOW.test(getComputedStyle(element).overflowY)
  );
}

export function captureScrollPositions(anchor: Element | null): ScrollPosition[] {
  const elements = new Set<Element>();
  elements.add(document.scrollingElement ?? document.documentElement);
  for (let current = anchor?.parentElement; current; current = current.parentElement) {
    if (isVerticallyScrollable(current)) elements.add(current);
  }
  return [...elements].map((element) => ({
    element,
    top: element.scrollTop,
    left: element.scrollLeft,
  }));
}

export function restoreScrollPositions(positions: ScrollPosition[]): void {
  for (const { element, top, left } of positions) {
    if (!element.isConnected) continue;
    if (element.scrollTop !== top) element.scrollTop = top;
    if (element.scrollLeft !== left) element.scrollLeft = left;
  }
}
