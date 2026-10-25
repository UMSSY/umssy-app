import { useState } from "react";
import { act, cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { useSlotRequestPreview } from "../../hooks/use-slot-request-preview";
import * as service from "../../services/slot-request-preview.service";
import { SlotUnavailableDialog } from "./slot-availability-preview";
import { PendingParticipation } from "./pending-participation";
import { ParticipationView } from "../../views/participation-view";

function TestFlow() {
  const preview = useSlotRequestPreview();
  const [open, setOpen] = useState(true);
  return preview.request ? <PendingParticipation /> : <SlotUnavailableDialog open={open} onOpenChange={setOpen} areas={["Backend"]} orientations={["Revisión de CV"]} />;
}

async function finishRequest() {
  await act(async () => { await vi.advanceTimersByTimeAsync(801); });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", "local");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-24T16:00:00Z"));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Solicitud pendiente simulada", () => {
  it("espera la respuesta, bloquea controles y cierre, y cambia a Pendiente con los datos", async () => {
    const simulate = vi.spyOn(service, "simulateSlotRequest");
    renderWithQuery(<TestFlow />);
    const submit = screen.getByRole("button", { name: "Solicitar cupo" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(screen.getByRole("button", { name: "Enviando solicitud..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cerrar modal" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.pointerDown(document.querySelector('[data-slot="dialog-overlay"]')!);
    expect(screen.getByRole("dialog", { name: "No hay cupos disponibles" })).toBeInTheDocument();
    expect(screen.queryByText("Solicitud registrada correctamente")).not.toBeInTheDocument();
    expect(simulate).toHaveBeenCalledTimes(1);
    await finishRequest();
    expect(screen.getByRole("dialog", { name: "Solicitud registrada correctamente" })).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Revisión de CV")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(screen.getByRole("heading", { name: "Mi participación como mentor" })).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar cupo" })).not.toBeInTheDocument();
  });

  it("muestra error sin éxito ni solicitud y permite reintentar", async () => {
    renderWithQuery(<TestFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Error" }));
    fireEvent.click(screen.getByRole("button", { name: "Solicitar cupo" }));
    await finishRequest();
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo registrar");
    expect(screen.queryByText("Solicitud registrada correctamente")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitar cupo" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Éxito" }));
    fireEvent.click(screen.getByRole("button", { name: "Solicitar cupo" }));
    await finishRequest();
    expect(screen.getByRole("dialog", { name: "Solicitud registrada correctamente" })).toBeInTheDocument();
  });

  it("recupera la solicitud duplicada e informa sin mostrar éxito de nuevo registro", async () => {
    renderWithQuery(<TestFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Duplicada" }));
    fireEvent.click(screen.getByRole("button", { name: "Solicitar cupo" }));
    await finishRequest();
    expect(screen.getByRole("dialog", { name: "Ya tienes una solicitud pendiente" })).toBeInTheDocument();
    expect(screen.queryByText("Solicitud registrada correctamente")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(screen.getByText("Solicitud enviada hace 3 días")).toBeInTheDocument();
  });

  it("conserva fecha e identidad, recalcula antigüedad al abrir y consulta desde Mi participación", async () => {
    const { client, rerender } = renderWithQuery(<TestFlow />);
    client.setQueryData(["auth-session", null], { id: "user-1", email: "titulado@fcyt.umss.edu.bo", roles: ["titulado"] });
    fireEvent.click(screen.getByRole("button", { name: "Solicitar cupo" }));
    await finishRequest();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    const original = client.getQueryData(["mentor-slot-request-preview", null]);
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(screen.getByText("Solicitud enviada hace menos de una hora")).toBeInTheDocument();
    expect(screen.getByText("titulado@fcyt.umss.edu.bo")).toBeInTheDocument();
    const date = screen.getByText(/Registrada el/).textContent;
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    act(() => { vi.setSystemTime(Date.now() + 3 * 86400000); });
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(screen.getByText("Solicitud enviada hace 3 días")).toBeInTheDocument();
    expect(screen.getByText(/Registrada el/)).toHaveTextContent(date!);
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(client.getQueryData(["mentor-slot-request-preview", null])).toEqual(original);
    rerender(<ParticipationView />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver detalle" })).toBeInTheDocument();
  });

  it("no envía otra operación si ya hay una solicitud y conserva la fecha original", async () => {
    const simulate = vi.spyOn(service, "simulateSlotRequest");
    const { client, rerender } = renderWithQuery(<TestFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Solicitar cupo" }));
    await finishRequest();
    const original = client.getQueryData<{ request: service.PendingSlotRequest }>(["mentor-slot-request-preview", null])!.request;
    rerender(<SlotUnavailableDialog open onOpenChange={() => {}} />);
    fireEvent.click(within(screen.getByRole("dialog", { name: "No hay cupos disponibles" })).getByRole("button", { name: "Solicitar cupo" }));
    expect(simulate).toHaveBeenCalledTimes(1);
    expect(client.getQueryData<{ request: service.PendingSlotRequest }>(["mentor-slot-request-preview", null])!.request).toEqual(original);
  });

  it("rechaza la simulación fuera de desarrollo", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(service.simulateSlotRequest("success", [], [])).rejects.toThrow("Simulación no disponible");
  });
});
