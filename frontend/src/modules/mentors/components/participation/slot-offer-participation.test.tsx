import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { mentorParticipationService } from "../../services/mentor-participation.service";
import { SlotOfferParticipation } from "./slot-offer-participation";

const request = {
  id: "request", userId: "user", status: "OFFERED", queuedAt: "2026-10-26T12:00:00Z", createdAt: "2026-10-26T12:00:00Z",
  technicalAreaIds: [], orientationTypeIds: [],
  offer: { id: "real-offer-id", status: "OFFERED", offeredAt: "2026-10-26T12:00:00Z", expiresAt: "2026-10-27T12:00:00Z" },
};
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Oferta real HU7", () => {
  it("presenta la fecha BOT y confirma el ID recibido del servidor una sola vez", async () => {
    const future = { ...request, offer: { ...request.offer, expiresAt: new Date(Date.now() + 3600000).toISOString() } };
    let resolve!: () => void;
    const confirm = vi.spyOn(mentorParticipationService, "confirm").mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    const onConfirmed = vi.fn();
    renderWithQuery(<SlotOfferParticipation request={future} onConfirmed={onConfirmed} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver oferta" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("BOT (UTC-4)");
    const button = screen.getByRole("button", { name: "Confirmar participación" });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(confirm).toHaveBeenCalledWith("real-offer-id");
    expect(onConfirmed).not.toHaveBeenCalled();
    await act(async () => resolve());
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
  });

  it("al reabrir mantiene la fecha absoluta y bloquea confirmar al vencer", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T11:59:50Z"));
    const confirm = vi.spyOn(mentorParticipationService, "confirm");
    renderWithQuery(<SlotOfferParticipation request={request} onConfirmed={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver oferta" }));
    expect(screen.getByRole("timer", { name: "Tiempo restante para confirmar" })).toHaveTextContent("0h 0m 10s");
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    fireEvent.click(screen.getByRole("button", { name: "Ver oferta" }));
    expect(screen.getByRole("timer", { name: "Tiempo restante para confirmar" })).toHaveTextContent("0h 0m 5s");
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByRole("button", { name: "Confirmar participación" })).toBeDisabled();
    expect(screen.getByRole("timer", { name: "Tiempo restante para confirmar" })).toHaveTextContent("El plazo ha vencido");
    expect(confirm).not.toHaveBeenCalled();
  });

  it("mantiene visible el error de confirmación y permite reintentar", async () => {
    const future = { ...request, offer: { ...request.offer, expiresAt: new Date(Date.now() + 3600000).toISOString() } };
    vi.spyOn(mentorParticipationService, "confirm").mockRejectedValue(new Error("Network"));
    renderWithQuery(<SlotOfferParticipation request={future} onConfirmed={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver oferta" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar participación" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Comprueba tu conexión");
    expect(screen.getByRole("button", { name: "Confirmar participación" })).toBeEnabled();
  });
});
