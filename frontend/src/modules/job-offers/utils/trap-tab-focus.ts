import type { KeyboardEvent } from "react";

const TABBABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getTabbableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
    (element) => !element.closest("[hidden], [inert], [aria-hidden='true']"),
  );
}

// Mantiene el foco dentro del diálogo de forma síncrona. La trampa de Base UI mueve el foco
// en el siguiente frame, así que al mantener Tab presionado el foco podía salir al fondo.
export function trapTabFocus(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== "Tab") return;

  const container = event.currentTarget;
  const tabbables = getTabbableElements(container);
  if (tabbables.length === 0) {
    event.preventDefault();
    return;
  }

  const first = tabbables[0];
  const last = tabbables[tabbables.length - 1];
  const active = document.activeElement;
  const isOutside = !(active instanceof HTMLElement) || !container.contains(active);

  if (event.shiftKey && (isOutside || active === first)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (isOutside || active === last)) {
    event.preventDefault();
    first.focus();
  }
}
