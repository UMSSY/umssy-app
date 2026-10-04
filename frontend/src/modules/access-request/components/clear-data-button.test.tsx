import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClearDataButton } from "./clear-data-button";

afterEach(cleanup);

describe("ClearDataButton", () => {
  it("no muestra el diálogo hasta que se presiona el botón", () => {
    render(<ClearDataButton onConfirm={vi.fn()} />);

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Limpiar datos" })).toBeTruthy();
  });

  it("ejecuta onConfirm y cierra el diálogo al confirmar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ClearDataButton onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Limpiar datos" }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Sí, limpiar datos" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("no ejecuta onConfirm al cancelar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ClearDataButton onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Limpiar datos" }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });
});