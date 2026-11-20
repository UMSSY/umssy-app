import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { trapTabFocus } from "./trap-tab-focus";

function renderTrap() {
  render(
    <>
      <Button type="button">Fondo</Button>
      <div role="dialog" onKeyDown={trapTabFocus}>
        <Button type="button">Primero</Button>
        <a href="https://maps.app.goo.gl/TechBolivia">Enlace</a>
        <Button type="button" disabled>
          Deshabilitado
        </Button>
        <Button type="button">Último</Button>
      </div>
    </>,
  );
  return {
    first: screen.getByRole("button", { name: "Primero" }),
    last: screen.getByRole("button", { name: "Último" }),
  };
}

describe("trapTabFocus", () => {
  afterEach(() => cleanup());

  it("desde el último elemento vuelve al primero sin salir del diálogo", () => {
    const { first, last } = renderTrap();
    last.focus();

    const notCancelled = fireEvent.keyDown(last, { key: "Tab" });

    expect(notCancelled).toBe(false);
    expect(document.activeElement).toBe(first);
  });

  it("con Shift+Tab desde el primero va al último", () => {
    const { first, last } = renderTrap();
    first.focus();

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it("deja avanzar normalmente entre elementos intermedios", () => {
    const { first } = renderTrap();
    first.focus();

    expect(fireEvent.keyDown(first, { key: "Tab" })).toBe(true);
  });

  it("ignora las demás teclas", () => {
    const { last } = renderTrap();
    last.focus();

    expect(fireEvent.keyDown(last, { key: "Enter" })).toBe(true);
    expect(document.activeElement).toBe(last);
  });
});
