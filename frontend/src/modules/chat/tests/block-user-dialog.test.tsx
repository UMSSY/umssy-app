import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockUserDialog } from "../components/block-user-dialog";

function renderDialog(onConfirm: () => Promise<void>) {
  const onOpenChange = vi.fn();
  render(
    <BlockUserDialog
      open
      onOpenChange={onOpenChange}
      contactName="Maria Fernandez"
      onConfirm={onConfirm}
    />,
  );
  return { onOpenChange };
}

describe("BlockUserDialog", () => {
  afterEach(() => cleanup());

  it("muestra el título con el nombre del contacto y los botones", async () => {
    renderDialog(vi.fn().mockResolvedValue(undefined));

    expect(await screen.findByText("¿Quieres bloquear a Maria Fernandez?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bloquear" })).toBeInTheDocument();
  });

  it("'Cancelar' cierra sin llamar a la API", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { onOpenChange } = renderDialog(onConfirm);

    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("'Bloquear' llama a la API y cierra sin mensaje adicional", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { onOpenChange } = renderDialog(onConfirm);

    await user.click(await screen.findByRole("button", { name: "Bloquear" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("deshabilita los botones mientras se procesa", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    renderDialog(onConfirm);

    await user.click(await screen.findByRole("button", { name: "Bloquear" }));

    expect(screen.getByRole("button", { name: "Bloqueando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    resolve();
  });

  it("si hay error de red muestra el mensaje y no cierra la ventana", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error("Network Error"));
    const { onOpenChange } = renderDialog(onConfirm);

    await user.click(await screen.findByRole("button", { name: "Bloquear" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo bloquear. Intenta de nuevo.");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Bloquear" })).toBeEnabled();
  });
});