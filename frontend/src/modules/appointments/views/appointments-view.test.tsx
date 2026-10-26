import {
  cleanup,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { useAuth } from "@/shared/contexts/auth-context";
import { appointmentsApi } from "../services/appointments.api";
import type { Appointment } from "../types/appointment.types";
import { AppointmentsView } from "./appointments-view";

vi.mock("@/shared/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

function makeAppointment(
  overrides: Partial<Appointment> = {},
): Appointment {
  return {
    id: "appointment-1",
    blockId: "block-1",
    startAt: "2026-10-27T00:00:00.000Z",
    endAt: "2026-10-27T01:00:00.000Z",
    counterpart: { id: "mentor-1", fullName: "Ana Pérez" },
    orientationType: { id: "topic-1", name: "Desarrollo profesional" },
    status: "CONFIRMED",
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();

  vi.mocked(useAuth).mockReturnValue({
    roles: ["titulado"],
    isLoading: false,
    refreshRoles: vi.fn().mockResolvedValue(undefined),
  });

  vi.spyOn(appointmentsApi, "getMyAppointments").mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
});

describe("AppointmentsView", () => {
  it("muestra próximas inicialmente y ofrece buscar mentores al titulado sin citas", async () => {
    renderWithQuery(<AppointmentsView />);

    expect(
      screen.getByRole("tab", { name: "Próximas" }),
    ).toHaveAttribute("aria-selected", "true");

    expect(
      await screen.findByText("No tienes citas próximas"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Buscar mentores" }),
    ).toHaveAttribute("href", "/mentorship/mentors");

    expect(appointmentsApi.getMyAppointments).toHaveBeenCalledWith(
      "upcoming",
    );
  });

  it.each(["mentor", "estudiante"] as const)(
    "no ofrece buscar mentores al rol %s",
    async (role) => {
      vi.mocked(useAuth).mockReturnValue({
        roles: [role],
        isLoading: false,
        refreshRoles: vi.fn().mockResolvedValue(undefined),
      });

      renderWithQuery(<AppointmentsView />);

      expect(
        await screen.findByText("No tienes citas próximas"),
      ).toBeInTheDocument();

      expect(
        screen.queryByRole("link", { name: "Buscar mentores" }),
      ).not.toBeInTheDocument();
    },
  );

  it("muestra el vacío de pasadas sin ofrecer buscar mentores", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AppointmentsView />);

    await screen.findByText("No tienes citas próximas");
    await user.click(screen.getByRole("tab", { name: "Pasadas" }));

    expect(
      await screen.findByText("No tienes citas pasadas"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("tab", { name: "Pasadas" }),
    ).toHaveAttribute("aria-selected", "true");

    expect(appointmentsApi.getMyAppointments).toHaveBeenCalledWith(
      "past",
    );

    expect(
      screen.queryByRole("link", { name: "Buscar mentores" }),
    ).not.toBeInTheDocument();
  });

  it("muestra carga sin presentar un estado vacío", () => {
    vi.mocked(appointmentsApi.getMyAppointments).mockImplementation(
      () => new Promise<Appointment[]>(() => {}),
    );

    renderWithQuery(<AppointmentsView />);

    expect(
      screen.getByRole("status", { name: "Cargando citas" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("No tienes citas próximas"),
    ).not.toBeInTheDocument();
  });

  it("muestra el error de consulta sin presentar el estado vacío", async () => {
    vi.mocked(appointmentsApi.getMyAppointments).mockRejectedValue(
      new Error("Network"),
    );

    renderWithQuery(<AppointmentsView />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudieron cargar tus citas.",
    );

    expect(
      screen.queryByText("No tienes citas próximas"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Buscar mentores" }),
    ).not.toBeInTheDocument();
  });

  it("muestra nombre, tema, estado y fecha y horario de Bolivia", async () => {
    vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue([
      makeAppointment(),
    ]);

    renderWithQuery(<AppointmentsView />);

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(
      screen.getByText("Tema: Desarrollo profesional"),
    ).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    expect(screen.getByText("26 de octubre de 2026")).toBeInTheDocument();
    expect(screen.getByText("20:00 - 21:00")).toBeInTheDocument();
    expect(
      screen.getByText("Hora de Bolivia (GMT-4)"),
    ).toBeInTheDocument();
  });

  it("muestra una alternativa cuando la cita no tiene tema", async () => {
    vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue([
      makeAppointment({ orientationType: null }),
    ]);

    renderWithQuery(<AppointmentsView />);

    expect(
      await screen.findByText("Tema: Tema no especificado"),
    ).toBeInTheDocument();
  });

  it("conserva el orden de la API y separa la caché de próximas y pasadas", async () => {
    const user = userEvent.setup();

    vi.mocked(appointmentsApi.getMyAppointments).mockImplementation(
      async (scope) =>
        scope === "upcoming"
          ? [
              makeAppointment({
                id: "next-1",
                counterpart: { id: "m1", fullName: "Primera próxima" },
              }),
              makeAppointment({
                id: "next-2",
                startAt: "2026-10-28T00:00:00.000Z",
                endAt: "2026-10-28T01:00:00.000Z",
                counterpart: { id: "m2", fullName: "Segunda próxima" },
              }),
            ]
          : [
              makeAppointment({
                id: "past-1",
                startAt: "2026-10-25T00:00:00.000Z",
                endAt: "2026-10-25T01:00:00.000Z",
                counterpart: { id: "m3", fullName: "Pasada reciente" },
              }),
              makeAppointment({
                id: "past-2",
                startAt: "2026-10-24T00:00:00.000Z",
                endAt: "2026-10-24T01:00:00.000Z",
                counterpart: { id: "m4", fullName: "Pasada anterior" },
              }),
            ],
    );

    const { client } = renderWithQuery(<AppointmentsView />);

    await screen.findByText("Primera próxima");

    const nextCards = within(screen.getByRole("list")).getAllByRole(
      "listitem",
    );
    expect(nextCards[0]).toHaveTextContent("Primera próxima");
    expect(nextCards[1]).toHaveTextContent("Segunda próxima");

    await user.click(screen.getByRole("tab", { name: "Pasadas" }));
    await screen.findByText("Pasada reciente");

    const pastCards = within(screen.getByRole("list")).getAllByRole(
      "listitem",
    );
    expect(pastCards[0]).toHaveTextContent("Pasada reciente");
    expect(pastCards[1]).toHaveTextContent("Pasada anterior");

    expect(
      screen.queryByText("Primera próxima"),
    ).not.toBeInTheDocument();

    expect(
      client.getQueryData(["appointments", "mine", "upcoming"]),
    ).toHaveLength(2);
    expect(
      client.getQueryData(["appointments", "mine", "past"]),
    ).toHaveLength(2);

    await user.click(screen.getByRole("tab", { name: "Próximas" }));

    await waitFor(() => {
      expect(screen.getByText("Primera próxima")).toBeInTheDocument();
      expect(
        screen.queryByText("Pasada reciente"),
      ).not.toBeInTheDocument();
    });
  });
});
