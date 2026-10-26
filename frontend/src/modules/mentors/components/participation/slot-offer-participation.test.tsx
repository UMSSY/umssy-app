import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { ParticipationView } from "../../views/participation-view";
import * as service from "../../services/slot-request-preview.service";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../../services/technical-areas.service", () => ({ getMentorTechnicalAreas: vi.fn().mockRejectedValue({ isAxiosError: true, response: { status: 404 } }) }));
vi.mock("@/modules/mentorship/services/orientation-type.service", () => ({ getMentorOrientationTypes: vi.fn().mockRejectedValue({ isAxiosError: true, response: { status: 404 } }) }));
const activation = vi.hoisted(() => vi.fn());
vi.mock("@/modules/mentorship/services/mentor-activation.service", () => ({ activateMentor: activation }));
const key = ["mentor-slot-request-preview", null];
const request = { id: "pending-1", registeredAt: "2026-10-20T16:00:00Z", areas: ["Backend", "Cloud"], orientations: ["Revisión de CV"] };

function setup(expiresAt = "2026-10-25T16:00:00Z", notice: "offered" | null = "offered") {
  const result = renderWithQuery(null);
  result.client.setQueryData(key, { request, notice, offer: { id: "offer-1", requestId: request.id, expiresAt, canRequestAgain: false } });
  result.rerender(<ParticipationView />);
  return result;
}
async function tick(ms: number) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
async function closeOffer() { fireEvent.click(screen.getByRole("button", { name: "Volver" })); await tick(1); }

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_HU7_PREVIEW", "true");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", "local");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-24T16:00:00Z"));
  activation.mockClear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Oferta de cupo y confirmación", () => {
  it.each(["X", "Escape", "fuera"])("cierra con %s sin modificar la oferta", async (method) => {
    vi.useRealTimers();
    const deadline = new Date(Date.now() + 86400000).toISOString();
    const { client } = setup(deadline);
    const user = userEvent.setup();
    if (method === "X") await user.click(screen.getByRole("button", { name: "Close" }));
    if (method === "Escape") await user.keyboard("{Escape}");
    if (method === "fuera") await user.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(client.getQueryData<{ offer: service.SlotOffer }>(key)!.offer.expiresAt).toBe(deadline);
    expect(client.getQueryData<{ request: typeof request }>(key)!.request).toEqual(request);
  });
  it("sustituye Pendiente y muestra el vencimiento en Bolivia", async () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: "¡Tienes un cupo disponible!" });
    expect(within(dialog).getByRole("timer")).toHaveTextContent("24h 0m 0s restantes");
    expect(within(dialog).getByText(/25 de octubre de 2026/)).toHaveTextContent("12:00 BOT (UTC-4)");
    await closeOffer();
    expect(screen.getByText("Cupo ofrecido")).toBeInTheDocument();
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar solicitud" })).not.toBeInTheDocument();
  });

  it("actualiza el contador automáticamente y la reapertura no cambia el vencimiento", async () => {
    const { client } = setup();
    await tick(65000);
    expect(screen.getByRole("timer", { name: "Tiempo restante para confirmar" })).toHaveTextContent("23h 58m 55s");
    await closeOffer();
    await tick(60000);
    fireEvent.click(screen.getByRole("button", { name: "Ver oferta" }));
    expect(screen.getByRole("timer", { name: "Tiempo restante para confirmar" })).toHaveTextContent("23h 57m 55s");
    expect(client.getQueryData<{ offer: service.SlotOffer }>(key)!.offer.expiresAt).toBe("2026-10-25T16:00:00Z");
  });

  it("crea la fecha del escenario una sola vez desde la solicitud pendiente", async () => {
    const { client, rerender } = renderWithQuery(null);
    client.setQueryData(key, { request, notice: null });
    rerender(<ParticipationView />);
    fireEvent.click(screen.getByRole("button", { name: "Simular cupo ofrecido" }));
    await tick(1);
    const deadline = client.getQueryData<{ offer: service.SlotOffer }>(key)!.offer.expiresAt;
    await closeOffer();
    await tick(60000);
    fireEvent.click(screen.getByRole("button", { name: "Ver oferta" }));
    expect(client.getQueryData<{ offer: service.SlotOffer }>(key)!.offer.expiresAt).toBe(deadline);
  });

  it("muestra carga, evita doble envío y reutiliza Activo solo tras la respuesta exitosa", async () => {
    const confirm = vi.spyOn(service, "simulateOfferConfirmation");
    const { client } = setup();
    const button = screen.getByRole("button", { name: "Confirmar participación" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Confirmando participación..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Volver" })).toBeDisabled();
    expect(screen.queryByText("Participación confirmada correctamente")).not.toBeInTheDocument();
    expect(activation).not.toHaveBeenCalled();
    await tick(801);
    expect(screen.getByRole("dialog", { name: "Participación confirmada correctamente" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await tick(1);
    expect(screen.getByRole("heading", { name: "Mi participación como mentor" })).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
    expect(screen.getByText("Revisión de CV")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gestionar disponibilidad" })).toBeInTheDocument();
    expect(client.getQueryData<{ active: typeof request }>(key)!.active).toEqual(request);
    expect(activation).not.toHaveBeenCalled();
  });

  it("conserva la oferta y los datos ante un error y permite reintentar", async () => {
    const { client } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Error al confirmar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar participación" }));
    await tick(801);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo confirmar tu participación");
    expect(client.getQueryData<{ request: typeof request }>(key)!.request).toEqual(request);
    expect(screen.queryByText("Participación confirmada correctamente")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmación exitosa" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar participación" }));
    await tick(801);
    expect(screen.getByRole("dialog", { name: "Participación confirmada correctamente" })).toBeInTheDocument();
  });

  it("deshabilita la confirmación al vencer automáticamente", async () => {
    const confirm = vi.spyOn(service, "simulateOfferConfirmation");
    setup("2026-10-24T16:00:02Z");
    await tick(2000);
    expect(screen.getByRole("button", { name: "Confirmar participación" })).toBeDisabled();
    expect(screen.getByRole("timer", { name: "Tiempo restante para confirmar" })).toHaveTextContent("El plazo ha vencido");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar participación" }));
    expect(confirm).not.toHaveBeenCalled();
  });

  it("rechaza una confirmación que vence durante el procesamiento", async () => {
    const { client } = setup("2026-10-24T16:00:00.500Z");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar participación" }));
    await tick(801);
    expect(screen.getByRole("alert")).toHaveTextContent("El plazo ha vencido");
    expect(screen.queryByText("Participación confirmada correctamente")).not.toBeInTheDocument();
    expect(client.getQueryData<{ request: typeof request }>(key)!.request).toEqual(request);
    expect(screen.getByRole("button", { name: "Confirmar participación" })).toBeDisabled();
  });

  it("no permite una nueva solicitud por vencimiento sin autorización del estado", async () => {
    const { client } = setup("2026-10-23T16:00:00Z");
    await closeOffer();
    expect(screen.getByRole("button", { name: "Volver a solicitar cupo" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Volver a solicitar cupo" }));
    expect(client.getQueryData<{ request: typeof request }>(key)!.request).toEqual(request);
    fireEvent.click(screen.getByRole("button", { name: "Simular autorización del servidor para nueva solicitud" }));
    await tick(1);
    expect(screen.getByRole("button", { name: "Volver a solicitar cupo" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Volver a solicitar cupo" }));
    await tick(10);
    expect(client.getQueryData(key)).toEqual({ request: null, notice: null });
    expect(screen.getByRole("link", { name: "Participa como mentor" })).toBeInTheDocument();
  });

  it("revalida el plazo absoluto aunque el contador visible estuviera desactualizado", async () => {
    const confirm = vi.spyOn(service, "simulateOfferConfirmation");
    setup();
    act(() => { vi.setSystemTime(new Date("2026-10-26T16:00:00Z")); });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar participación" }));
    await tick(1);
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("El plazo ha vencido");
    expect(screen.getByRole("button", { name: "Confirmar participación" })).toBeDisabled();
  });

  it.each([["production", "local"], ["development", "prod"]])("impide la simulación con NODE_ENV=%s APP_ENV=%s", async (nodeEnv, appEnv) => {
    vi.stubEnv("NODE_ENV", nodeEnv); vi.stubEnv("NEXT_PUBLIC_APP_ENV", appEnv);
    expect(() => service.simulateSlotOffer(request.id, false)).toThrow("Simulación no disponible");
    await expect(service.simulateOfferConfirmation("success", { id: "offer-1", requestId: request.id, expiresAt: "2026-10-25T16:00:00Z", canRequestAgain: false })).rejects.toThrow("Simulación no disponible");
  });
});
