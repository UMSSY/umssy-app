import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SlotAvailabilityPreview } from "./slot-availability-preview";

afterEach(cleanup);

async function openModal() {
  const user = userEvent.setup();
  render(<SlotAvailabilityPreview />);
  await user.click(screen.getByRole("button", { name: "Consultar cupos" }));
  return { user, dialog: await screen.findByRole("dialog") };
}

describe("SlotAvailabilityPreview", () => {
  it("identifica los datos simulados y alterna disponibilidad sin cantidades", async () => {
    const user = userEvent.setup();
    render(<SlotAvailabilityPreview />);
    expect(screen.getByText(/Datos simulados para desarrollo y pruebas/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Todos los cupos están ocupados");
    await user.click(screen.getByRole("button", { name: "Simular cupos disponibles" }));
    expect(screen.getByRole("status")).toHaveTextContent("Hay cupos disponibles");
    expect(screen.queryByRole("button", { name: "Consultar cupos" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Simular cupos ocupados" }));
    expect(screen.getByRole("button", { name: "Consultar cupos" })).toBeInTheDocument();
  });

  it("explica FIFO y mantiene Solicitar cupo sin registrar una solicitud", async () => {
    const { user, dialog } = await openModal();
    expect(within(dialog).getByRole("heading", { name: "No hay cupos disponibles" })).toBeInTheDocument();
    expect(within(dialog).getByText(/la solicitud más antigua se atiende primero/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Solicitar cupo" }));
    expect(within(dialog).getByRole("status")).toHaveTextContent("No se ha enviado ninguna solicitud");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it.each(["Cancelar", "Cerrar modal"])("cierra con %s y devuelve el foco", async (name) => {
    const { user, dialog } = await openModal();
    await user.click(within(dialog).getByRole("button", { name }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Consultar cupos" })).toHaveFocus();
  });

  it("cierra con Escape", async () => {
    const { user } = await openModal();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("desenfoca el fondo y cierra al hacer clic fuera", async () => {
    const { user } = await openModal();
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay?.className).toContain("backdrop-blur");
    expect(overlay).not.toBeNull();
    await user.click(overlay!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
