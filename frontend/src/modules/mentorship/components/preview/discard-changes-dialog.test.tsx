import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscardChangesDialog } from "./discard-changes-dialog";

const setup = (open = true) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <DiscardChangesDialog open={open} onConfirm={onConfirm} onCancel={onCancel} />,
  );
  return { onConfirm, onCancel };
};

describe("DiscardChangesDialog", () => {
  afterEach(cleanup);

  it("muestra el mensaje de descarte de la HU", () => {
    setup();
    expect(
      screen.getByRole("heading", {
        name: "¿Desea descartar los cambios realizados?",
      }),
    ).toBeInTheDocument();
  });

  it("confirma el descarte", () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancela el descarte con Seguir editando", () => {
    const { onConfirm, onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("no se renderiza cuando está cerrado", () => {
    setup(false);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});