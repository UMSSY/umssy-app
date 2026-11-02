import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeactivateParticipationModalProps } from "../../types/deactivate-participation-modal-props.types";
import { DeactivateParticipationModal } from "./deactivate-participation-modal";

function createProps(): DeactivateParticipationModalProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isLoading: false,
    errorMessage: null,
    hasFutureAppointments: false,
    areas: [],
    orientations: [],
  };
}

describe("DeactivateParticipationModal", () => {
  afterEach(cleanup);

  it("muestra las preferencias vacías sin impedir la confirmación", () => {
    const props = createProps();
    render(<DeactivateParticipationModal {...props} />);
    expect(screen.getAllByText("Sin configuración")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Desactivar participación" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("permite cerrar con Escape cuando no existe un envío pendiente", async () => {
    const props = createProps();
    render(<DeactivateParticipationModal {...props} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("impide cerrar o confirmar de nuevo mientras guarda", () => {
    const props = { ...createProps(), isLoading: true };
    render(<DeactivateParticipationModal {...props} />);
    expect(screen.getByRole("button", { name: "Procesando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cerrar modal" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("muestra otros errores sin ofrecer el enlace de citas", () => {
    render(<DeactivateParticipationModal {...createProps()} errorMessage="No se pudo guardar" />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar");
    expect(screen.queryByRole("link", { name: "Resolver mis citas en la agenda" })).not.toBeInTheDocument();
  });

  it("no muestra el diálogo cuando está cerrado", () => {
    render(<DeactivateParticipationModal {...createProps()} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
