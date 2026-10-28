import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { registrationsService } from "@/modules/registrations";
import type { RegistrationResponse } from "@/modules/registrations";
import type { EventDetail } from "../types/event-detail.types";
import { EventRegistrationAction } from "./event-registration-action";
import { toast } from "sonner";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

const event: EventDetail = {
  id: "event-1",
  title: "Taller de React",
  category: { id: "category-1", name: "Tecnología" },
  description: "Aprende React",
  instructorName: "Ana",
  eventDate: "2026-11-20",
  startTime: "09:00",
  endTime: "12:00",
  location: "Aula 101",
  capacity: 30,
  availableSpots: 20,
  registrationCount: 10,
  statusId: "published",
  modalityId: "m1",
  modality: { id: "m1", title: "Presencial" },
};

const confirmed: RegistrationResponse = {
  id: "registration-1",
  eventId: event.id,
  status: "confirmed",
  qrToken: "qr-token",
  registeredAt: "2026-10-24T12:00:00Z",
  cancelledAt: null,
};

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-26T12:00:00Z"), toFake: ["Date"] });
  saveAccessToken("token-a");
  vi.spyOn(registrationsService, "getOwn").mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  clearAccessToken();
  vi.restoreAllMocks();
  push.mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.info).mockClear();
});

describe("EventRegistrationAction", () => {
  it('blocks already finished workshops without submitting a request', () => {
    const create = vi.spyOn(registrationsService, 'create');
    renderWithQuery(<EventRegistrationAction event={{ ...event, eventDate: '2026-10-25' }} />);
    expect(screen.getByRole('button', { name: 'El taller ya finalizó' })).toBeDisabled();
    expect(create).not.toHaveBeenCalled();
  });

  it('disables registration when the workshop finishes while the view remains open', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T15:59:59Z'));
    renderWithQuery(<EventRegistrationAction event={event} />);
    expect(screen.getByRole('button', { name: 'Inscribirme' })).toBeEnabled();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole('button', { name: 'El taller ya finalizó' })).toBeDisabled();
  });

  it("confirms before submitting and prevents a second request while pending", async () => {
    let resolve!: (value: RegistrationResponse) => void;
    const create = vi.spyOn(registrationsService, "create").mockImplementation(() => new Promise((done) => { resolve = done; }));
    renderWithQuery(<EventRegistrationAction event={event} />);
    fireEvent.click(screen.getByRole("button", { name: "Inscribirme" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Taller de React");
    expect(screen.getByRole("dialog")).toHaveTextContent("2026-11-20");
    expect(screen.getByRole("dialog")).toHaveTextContent("09:00 - 12:00");
    expect(create).not.toHaveBeenCalled();
    const confirm = screen.getByRole("button", { name: "Confirmar" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await act(async () => { resolve(confirmed); });
    await waitFor(() => expect(screen.getByRole("button", { name: "Ya estás inscrito" })).toBeDisabled());
    expect(screen.getByText("Inscripción confirmada.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels without submitting", () => {
    const create = vi.spyOn(registrationsService, "create");
    renderWithQuery(<EventRegistrationAction event={event} />);
    fireEvent.click(screen.getByRole("button", { name: "Inscribirme" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(create).not.toHaveBeenCalled();
  });

  it("routes guests to login and disables full workshops", () => {
    clearAccessToken();
    const { rerender } = renderWithQuery(<EventRegistrationAction event={event} />);
    fireEvent.click(screen.getByRole("button", { name: "Inscribirme" }));
    expect(push).toHaveBeenCalledWith("/login?next=%2Fevents");
    rerender(<EventRegistrationAction event={{ ...event, availableSpots: 0, registrationCount: 30 }} />);
    expect(screen.getByRole("button", { name: "Taller lleno" })).toBeDisabled();
  });

  it("shows the registered state from the own registration lookup", async () => {
    vi.mocked(registrationsService.getOwn).mockResolvedValue(confirmed);
    renderWithQuery(<EventRegistrationAction event={event} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Ya estás inscrito" })).toBeDisabled());
  });

  it("recognizes confirmed proposal support immediately after publication", () => {
    const create = vi.spyOn(registrationsService, "create");
    renderWithQuery(<EventRegistrationAction event={{ ...event, status: "Publicado", hasSupported: true }} />);
    expect(screen.getByRole("button", { name: "Ya estás inscrito" })).toBeDisabled();
    expect(create).not.toHaveBeenCalled();
  });

  it("shows the catalog fallback and allows retry after a network failure", async () => {
    vi.spyOn(registrationsService, "create").mockRejectedValue(new Error("offline"));
    renderWithQuery(<EventRegistrationAction event={event} />);
    fireEvent.click(screen.getByRole("button", { name: "Inscribirme" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(screen.getByText("No pudimos completar la operación. Inténtalo más tarde.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("returns to the list when the backend reports a missing workshop", async () => {
    const onEventNotFound = vi.fn();
    vi.spyOn(registrationsService, "create").mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { statusCode: 404, ok: false, code: "EVENT_NOT_FOUND", detail: "Private detail", data: null } },
    });
    renderWithQuery(<EventRegistrationAction event={event} onEventNotFound={onEventNotFound} />);
    fireEvent.click(screen.getByRole("button", { name: "Inscribirme" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(onEventNotFound).toHaveBeenCalledOnce());
    expect(toast.error).toHaveBeenCalledWith("No encontramos el evento solicitado.");
  });

  it("sends an expired session to login with the catalog message", async () => {
    vi.spyOn(registrationsService, "create").mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { statusCode: 401, ok: false, code: "AUTH_REQUIRED", detail: "Private detail", data: null } },
    });
    renderWithQuery(<EventRegistrationAction event={event} />);
    fireEvent.click(screen.getByRole("button", { name: "Inscribirme" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?next=%2Fevents"));
    expect(toast.info).toHaveBeenCalledWith("Debes iniciar sesión para continuar.");
  });

  it.each([
    ["EVENT_FULL", "Taller lleno", "Ya no quedan cupos disponibles."],
    ["EVENT_FINISHED", "El taller ya finalizó", "El taller ya finalizó"],
    ["ALREADY_REGISTERED", "Ya estás inscrito", "Ya estás inscrito en este evento."],
    ["REGISTRATION_CLOSED", "Inscripción cerrada", "El plazo de inscripción y cancelación ha terminado."],
    ["EVENT_CANCELLED", "Inscripción cerrada", "Este evento ha sido cancelado y no admite inscripciones."],
    ["EVENT_NOT_OPEN", "Inscripción cerrada", "Este evento no está habilitado para inscripciones."],
  ])("synchronizes the action after %s", async (code, button, message) => {
    vi.spyOn(registrationsService, "create").mockRejectedValue({
      isAxiosError: true,
      response: { status: ["REGISTRATION_CLOSED", "EVENT_CANCELLED", "EVENT_NOT_OPEN"].includes(code) ? 422 : 409, data: { statusCode: ["REGISTRATION_CLOSED", "EVENT_CANCELLED", "EVENT_NOT_OPEN"].includes(code) ? 422 : 409, ok: false, code, detail: "Private detail", data: null } },
    });
    renderWithQuery(<EventRegistrationAction event={event} />);
    fireEvent.click(screen.getByRole("button", { name: "Inscribirme" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: button })).toBeDisabled());
    expect(screen.getAllByText(message).length).toBeGreaterThan(0);
  });
});
