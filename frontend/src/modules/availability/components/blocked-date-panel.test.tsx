import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { availabilityApi } from "../services/availability.api";
import type { BlockedDate } from "../types/blocked-date.types";
import { BlockedDatePanel } from "./blocked-date-panel";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const date: BlockedDate = { id: "d1", mentorId: "m1", blockedOn: "2026-10-26", reason: "Viaje", createdAt: "" };

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(toast.error).mockClear();
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-24T02:00:00Z") });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("BlockedDatePanel", () => {
  it.each(["", "   ", " Viaje "])("bloquea con motivo opcional %s y cierra tras guardar", async (reason) => {
    const save = vi.spyOn(availabilityApi, "blockDate").mockResolvedValue(date);
    const onClose = vi.fn();
    renderWithQuery(<BlockedDatePanel date={date.blockedOn} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText("Motivo (opcional)"), { target: { value: reason } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Bloquear fecha" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(save).toHaveBeenCalledWith({ blockedOn: date.blockedOn, reason: reason.trim() || null });
  });

  it("rechaza 101 caracteres y permite exactamente 100", async () => {
    const save = vi.spyOn(availabilityApi, "blockDate").mockResolvedValue(date);
    renderWithQuery(<BlockedDatePanel date={date.blockedOn} onClose={vi.fn()} />);
    const field = screen.getByLabelText("Motivo (opcional)");
    fireEvent.change(field, { target: { value: "a".repeat(101) } });
    expect(screen.getByRole("alert")).toHaveTextContent("El motivo no puede superar los 100 caracteres");
    expect(screen.getByRole("button", { name: "Bloquear fecha" })).toBeDisabled();
    fireEvent.submit(field.closest("form")!);
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: "a".repeat(100) } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Bloquear fecha" }));
    expect(save).toHaveBeenCalledWith({ blockedOn: date.blockedOn, reason: "a".repeat(100) });
  });

  it("impide fechas pasadas incluso al enviar el formulario", () => {
    const save = vi.spyOn(availabilityApi, "blockDate");
    renderWithQuery(<BlockedDatePanel date="2026-10-22" onClose={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pueden bloquear fechas pasadas");
    expect(screen.getByRole("button", { name: "Bloquear fecha" })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText("Motivo (opcional)").closest("form")!);
    expect(save).not.toHaveBeenCalled();
  });

  it("permite hoy en Bolivia aunque UTC ya sea el día siguiente", async () => {
    const save = vi.spyOn(availabilityApi, "blockDate").mockResolvedValue(date);
    renderWithQuery(<BlockedDatePanel date="2026-10-23" onClose={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Bloquear fecha" }));
    expect(save).toHaveBeenCalledWith({ blockedOn: "2026-10-23", reason: null });
  });

  it.each(["Viaje", null])("muestra el bloqueo y desbloquea por id, motivo %s", async (reason) => {
    const remove = vi.spyOn(availabilityApi, "unblockDate").mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderWithQuery(<BlockedDatePanel date={date.blockedOn} blockedDate={{ ...date, reason }} onClose={onClose} />);
    expect(screen.queryByLabelText("Motivo (opcional)")).not.toBeInTheDocument();
    if (reason) expect(screen.getByText(`Motivo: ${reason}`)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Desbloquear fecha" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(remove).toHaveBeenCalledWith("d1");
  });

  it("permite desbloquear una fecha pasada", async () => {
    const remove = vi.spyOn(availabilityApi, "unblockDate").mockResolvedValue(undefined);
    renderWithQuery(<BlockedDatePanel date="2026-10-22" blockedDate={date} onClose={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Desbloquear fecha" }));
    expect(remove).toHaveBeenCalledWith("d1");
  });

  it.each([[409, "No puedes bloquear un día con citas confirmadas"], [400, "No se pueden bloquear fechas pasadas"]])("mantiene el panel y muestra el detail ante %s", async (statusCode, detail) => {
    vi.spyOn(availabilityApi, "blockDate").mockRejectedValue({ response: { data: { statusCode, detail } } });
    const onClose = vi.fn();
    renderWithQuery(<BlockedDatePanel date={date.blockedOn} onClose={onClose} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Bloquear fecha" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(detail));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("mantiene abierto el panel si falla desbloquear", async () => {
    vi.spyOn(availabilityApi, "unblockDate").mockRejectedValue(new Error("Network"));
    const onClose = vi.fn();
    renderWithQuery(<BlockedDatePanel date={date.blockedOn} blockedDate={date} onClose={onClose} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Desbloquear fecha" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al desbloquear la fecha"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("evita envíos duplicados y deshabilita acciones mientras guarda", async () => {
    let resolve!: (value: BlockedDate) => void;
    const save = vi.spyOn(availabilityApi, "blockDate").mockImplementation(() => new Promise((done) => { resolve = done; }));
    renderWithQuery(<BlockedDatePanel date={date.blockedOn} onClose={vi.fn()} />);
    const form = screen.getByLabelText("Motivo (opcional)").closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => resolve(date));
  });

  it("cancelar sin cambios cierra sin enviar", async () => {
    const save = vi.spyOn(availabilityApi, "blockDate");
    const onClose = vi.fn();
    renderWithQuery(<BlockedDatePanel date={date.blockedOn} onClose={onClose} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(save).not.toHaveBeenCalled();
  });
});
