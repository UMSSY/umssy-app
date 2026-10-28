import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { SlotUnavailableDialog } from "./slot-availability-preview";

afterEach(cleanup);

describe("Solicitud de cupo real", () => {
  it("abre sin registrar y permite cancelar", () => {
    const submit = vi.fn(), close = vi.fn();
    renderWithQuery(<SlotUnavailableDialog open onOpenChange={close} isSubmitting={false} error={null} onSubmit={submit} />);
    expect(screen.getByText("Criterio de asignación institucional (FIFO)")).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(close).toHaveBeenCalledWith(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it("envía al confirmar y presenta errores reales", () => {
    const submit = vi.fn();
    renderWithQuery(<SlotUnavailableDialog open onOpenChange={vi.fn()} isSubmitting={false} error="No hay conexión" onSubmit={submit} />);
    fireEvent.click(screen.getByRole("button", { name: "Solicitar cupo" }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent("No hay conexión");
  });

  it("bloquea botones, Escape y cierre mientras procesa", async () => {
    const close = vi.fn(), submit = vi.fn();
    renderWithQuery(<SlotUnavailableDialog open onOpenChange={close} isSubmitting error={null} onSubmit={submit} />);
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviando solicitud..." })).toBeDisabled();
    await userEvent.setup().keyboard("{Escape}");
    expect(close).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });
});
