import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscardChangesDialog } from "./discard-changes-dialog";

describe("DiscardChangesDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("pregunta si se descartan los cambios y permite confirmar o seguir editando", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<DiscardChangesDialog open onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    expect(screen.getByRole("heading", { name: "¿Descartar cambios?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descartar" }));
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("no se muestra cerrado", () => {
    render(<DiscardChangesDialog open={false} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
