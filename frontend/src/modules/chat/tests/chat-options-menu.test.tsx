import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatOptionsMenu } from "../components/chat-options-menu";

function renderMenu(isBlocked: boolean) {
  const onBlockSelect = vi.fn();
  const onUnblockSelect = vi.fn();
  render(
    <ChatOptionsMenu
      isBlocked={isBlocked}
      onBlockSelect={onBlockSelect}
      onUnblockSelect={onUnblockSelect}
    />,
  );
  return { onBlockSelect, onUnblockSelect };
}

describe("ChatOptionsMenu", () => {
  afterEach(() => cleanup());

  it("tiene un botón accesible 'Más opciones'", () => {
    renderMenu(false);
    expect(screen.getByRole("button", { name: "Más opciones" })).toBeInTheDocument();
  });

  it("muestra 'Bloquear usuario' cuando el contacto no está bloqueado", async () => {
    const user = userEvent.setup();
    const { onBlockSelect } = renderMenu(false);

    fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
    const item = await screen.findByRole("menuitem", { name: "Bloquear usuario" });
    expect(screen.queryByRole("menuitem", { name: "Desbloquear usuario" })).not.toBeInTheDocument();

    await user.click(item);
    expect(onBlockSelect).toHaveBeenCalledTimes(1);
  });

  it("muestra 'Desbloquear usuario' cuando el contacto está bloqueado", async () => {
    const user = userEvent.setup();
    const { onUnblockSelect, onBlockSelect } = renderMenu(true);

    fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
    const item = await screen.findByRole("menuitem", { name: "Desbloquear usuario" });
    expect(screen.queryByRole("menuitem", { name: "Bloquear usuario" })).not.toBeInTheDocument();

    await user.click(item);
    expect(onUnblockSelect).toHaveBeenCalledTimes(1);
    expect(onBlockSelect).not.toHaveBeenCalled();
  });

  it("se abre con el teclado (Enter) y se cierra con Esc", async () => {
    const user = userEvent.setup();
    renderMenu(false);

    screen.getByRole("button", { name: "Más opciones" }).focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Bloquear usuario" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menuitem", { name: "Bloquear usuario" })).not.toBeInTheDocument(),
    );
  });

  it("permite elegir la opción con flechas y Enter", async () => {
    const user = userEvent.setup();
    const { onBlockSelect } = renderMenu(false);

    screen.getByRole("button", { name: "Más opciones" }).focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("menuitem", { name: "Bloquear usuario" });
    await user.keyboard("{Enter}");

    await waitFor(() => expect(onBlockSelect).toHaveBeenCalledTimes(1));
  });
});