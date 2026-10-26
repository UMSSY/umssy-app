import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { ParticipationView } from "../../views/participation-view";
import { SlotAvailabilityPreview } from "./slot-availability-preview";
import * as service from "../../services/slot-request-preview.service";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navigation.push }) }));
vi.mock("../../services/technical-areas.service", () => ({ getMentorTechnicalAreas: vi.fn().mockRejectedValue({ isAxiosError: true, response: { status: 404 } }) }));
vi.mock("@/modules/mentorship/services/orientation-type.service", () => ({ getMentorOrientationTypes: vi.fn().mockRejectedValue({ isAxiosError: true, response: { status: 404 } }) }));

const key = ["mentor-slot-request-preview", null];
const request: service.PendingSlotRequest = { id: "request-original", registeredAt: "2026-10-20T16:00:00Z", areas: ["Backend"], orientations: ["Revisión de CV"] };

function renderPending() {
  const result = renderWithQuery(null);
  result.client.setQueryData(key, { request, notice: null });
  result.rerender(<ParticipationView />);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar solicitud" }));
  return result;
}

async function respond() {
  await act(async () => { await vi.advanceTimersByTimeAsync(801); });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_HU7_PREVIEW", "true");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", "local");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-24T16:00:00Z"));
  navigation.push.mockClear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Cancelación de solicitud pendiente", () => {
  it("muestra el aviso FIFO y Volver conserva la solicitud original", () => {
    const { client } = renderPending();
    const dialog = screen.getByRole("dialog", { name: "¿Cancelar solicitud de cupo?" });
    expect(within(dialog).getByText(/perderás tu prioridad/)).toHaveTextContent("ingresarás al final de la cola");
    fireEvent.click(within(dialog).getByRole("button", { name: "Volver" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(client.getQueryData(key)).toEqual({ request, notice: null });
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it.each(["X", "Escape", "fuera"])("cierra con %s sin cancelar", async (method) => {
    vi.useRealTimers();
    const simulate = vi.spyOn(service, "simulateSlotCancellation");
    const { client } = renderPending();
    const user = userEvent.setup();
    if (method === "X") await user.click(screen.getByRole("button", { name: "Cerrar modal de cancelación" }));
    if (method === "Escape") await user.keyboard("{Escape}");
    if (method === "fuera") await user.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(client.getQueryData(key)).toEqual({ request, notice: null });
    expect(simulate).not.toHaveBeenCalled();
  });

  it("bloquea controles y cierre, evita envíos repetidos y confirma solo después del éxito", async () => {
    const simulate = vi.spyOn(service, "simulateSlotCancellation");
    const { client } = renderPending();
    const confirm = screen.getByRole("button", { name: "Confirmar cancelación" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(simulate).toHaveBeenCalledTimes(1);
    expect(simulate).toHaveBeenCalledWith("success", request.id);
    expect(screen.getByRole("button", { name: "Cancelando solicitud..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Volver" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cerrar modal de cancelación" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Error al cancelar" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    const overlay = document.querySelector('[data-slot="dialog-overlay"]')!;
    fireEvent.pointerDown(overlay, { button: 0, pointerType: "mouse" });
    fireEvent.pointerUp(overlay, { button: 0, pointerType: "mouse" });
    fireEvent.click(overlay);
    expect(screen.getByRole("dialog", { name: "¿Cancelar solicitud de cupo?" })).toHaveAttribute("aria-busy", "true");
    expect(client.getQueryData(key)).toEqual({ request, notice: null });
    expect(screen.queryByText("Solicitud cancelada correctamente")).not.toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
    await respond();
    expect(client.getQueryData(key)).toEqual({ request: null, notice: "cancelled" });
    expect(screen.getByRole("dialog", { name: "Solicitud cancelada correctamente" })).toBeInTheDocument();
    expect(navigation.push).toHaveBeenCalledTimes(1);
    expect(navigation.push).toHaveBeenCalledWith("/mentors/participation");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(screen.getByRole("heading", { name: "Mi participación" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Participa como mentor" })).toBeInTheDocument();
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
  });

  it("conserva identificador, fecha y datos al fallar, y permite reintentar", async () => {
    const { client } = renderPending();
    fireEvent.click(screen.getByRole("button", { name: "Error al cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }));
    await respond();
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cancelar tu solicitud");
    expect(client.getQueryData(key)).toEqual({ request, notice: null });
    expect(screen.queryByText("Solicitud cancelada correctamente")).not.toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirmar cancelación" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(screen.getByText(/Registrada el/)).toHaveTextContent("20 de octubre de 2026");
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar solicitud" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelación exitosa" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }));
    await respond();
    expect(client.getQueryData(key)).toEqual({ request: null, notice: "cancelled" });
  });

  it("una solicitud posterior obtiene identificador y fecha nuevos", async () => {
    const { client, rerender } = renderPending();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }));
    await respond();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    rerender(<SlotAvailabilityPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Consultar cupos" }));
    fireEvent.click(screen.getByRole("button", { name: "Solicitar cupo" }));
    await respond();
    const latest = client.getQueryData<{ request: service.PendingSlotRequest }>(key)!.request;
    expect(latest.id).not.toBe(request.id);
    expect(new Date(latest.registeredAt).getTime()).toBeGreaterThan(new Date(request.registeredAt).getTime());
    expect(screen.getByRole("dialog", { name: "Solicitud registrada correctamente" })).toBeInTheDocument();
  });

  it.each([["production", "local"], ["development", "prod"]])("no cancela datos simulados con NODE_ENV=%s APP_ENV=%s", async (nodeEnv, appEnv) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", appEnv);
    await expect(service.simulateSlotCancellation("success", request.id)).rejects.toThrow("Simulación no disponible");
  });
});
