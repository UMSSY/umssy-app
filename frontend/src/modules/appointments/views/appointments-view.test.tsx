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
import { appointmentsApi } from "../services/appointments.service";
import type { Appointment } from "../types/appointment.types";
import type { MyAppointmentsPage } from "../types/my-appointments-page.types";
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
    counterpart: { id: "mentor-1", fullName: "Ana Pérez", role: "mentor" },
    orientationType: { id: "topic-1", name: "Desarrollo profesional" },
    status: "CONFIRMED",
    message: "Quiero revisar mi CV",
    requestedAt: "2026-10-20T22:42:00.000Z",
    document: null,
    ...overrides,
  };
}

function makePage(
  items: Appointment[],
  overrides: Partial<Omit<MyAppointmentsPage, "items">> = {},
): MyAppointmentsPage {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 10,
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();

  vi.mocked(useAuth).mockReturnValue({
    currentUserId: "user-a",
    roles: ["titulado"],
    isLoading: false,
    refreshRoles: vi.fn().mockResolvedValue(undefined),
  });

  vi.spyOn(appointmentsApi, "getMyAppointments").mockResolvedValue(makePage([]));
});

afterEach(() => {
  cleanup();
});

describe("AppointmentsView", () => {
  it.each(["upcoming", "past"] as const)(
    "en %s muestra a la otra persona con su rol para usuarios con ambos roles",
    async (scope) => {
      vi.mocked(useAuth).mockReturnValue({
        currentUserId: "user-a",
        roles: ["mentor", "titulado"],
        isLoading: false,
        refreshRoles: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue(
        makePage([
          makeAppointment(),
          makeAppointment({
            id: "as-mentor",
            counterpart: { id: "student-1", fullName: "Luis Flores", role: "student" },
          }),
        ]),
      );
      const user = userEvent.setup();
      renderWithQuery(<AppointmentsView />);
      if (scope === "past") {
        await user.click(screen.getByRole("tab", { name: "Pasadas" }));
      }
      expect(
        await screen.findByRole("button", { name: /Ana Pérez/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Luis Flores/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Mentor · Desarrollo profesional"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Titulado · Desarrollo profesional"),
      ).toBeInTheDocument();
      expect(appointmentsApi.getMyAppointments).toHaveBeenCalledWith({ scope, page: 1 });
    },
  );

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

    expect(appointmentsApi.getMyAppointments).toHaveBeenCalledWith({
      scope: "upcoming",
      page: 1,
    });
  });

  it.each(["mentor", "estudiante"] as const)(
    "no ofrece buscar mentores al rol %s",
    async (role) => {
      vi.mocked(useAuth).mockReturnValue({
        currentUserId: "user-a",
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

  it.each(["mentor", "titulado"] as const)(
    "muestra las completadas en Pasadas y el mismo estado en el detalle para %s",
    async (role) => {
      vi.mocked(useAuth).mockReturnValue({
        currentUserId: "user-a", roles: [role], isLoading: false,
        refreshRoles: vi.fn().mockResolvedValue(undefined),
      });
      const completed = makeAppointment({
        status: "COMPLETED",
        counterpart: { id: "other-1", fullName: "Persona de la cita", role: role === "mentor" ? "student" : "mentor" },
      });
      vi.mocked(appointmentsApi.getMyAppointments).mockImplementation(async (scope) =>
        scope === "past" ? [completed, makeAppointment({ id: "cancelled-1", status: "CANCELLED" })] : [],
      );
      vi.spyOn(appointmentsApi, "getById").mockResolvedValue({ ...completed, meetingUrl: null });
      vi.spyOn(appointmentsApi, "getCounterpartPhoto").mockResolvedValue(null);
      const user = userEvent.setup();
      renderWithQuery(<AppointmentsView />);
      await screen.findByText("No tienes citas próximas");
      expect(screen.queryByText("Completada")).not.toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: "Pasadas" }));
      const cardBadge = await screen.findByText("Completada");
      expect(screen.getByText("Cancelada")).toBeInTheDocument();
      expect(appointmentsApi.getMyAppointments).toHaveBeenCalledWith("past");
      await user.click(screen.getByRole("button", { name: /Persona de la cita/ }));
      const dialog = await screen.findByRole("dialog");
      const detailBadge = await within(dialog).findByText("Completada");
      for (const badge of [cardBadge, detailBadge]) {
        expect(badge).toHaveClass("h-6", "px-2.5", "text-sm", "bg-muted", "text-text-secondary", "border-transparent");
      }
      expect(within(dialog).queryByText("Confirmada")).not.toBeInTheDocument();
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

    expect(appointmentsApi.getMyAppointments).toHaveBeenCalledWith({
      scope: "past",
      page: 1,
    });

    expect(
      screen.queryByRole("link", { name: "Buscar mentores" }),
    ).not.toBeInTheDocument();
  });

  it("muestra carga sin presentar un estado vacío", () => {
    vi.mocked(appointmentsApi.getMyAppointments).mockImplementation(
      () => new Promise<MyAppointmentsPage>(() => {}),
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

  it("muestra día, nombre, tema, estado y horario de Bolivia", async () => {
    vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue(
      makePage([makeAppointment()]),
    );

    renderWithQuery(<AppointmentsView />);

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("LUN")).toBeInTheDocument();
    expect(screen.getByText("26")).toBeInTheDocument();
    expect(screen.getByText("oct")).toBeInTheDocument();
    expect(
      screen.getByText("Mentor · Desarrollo profesional"),
    ).toBeInTheDocument();
    expect(screen.getByText("20:00 - 21:00 · Hora de Bolivia (GMT-4)")).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
  });

  it("muestra una alternativa cuando la cita no tiene tema", async () => {
    vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue(
      makePage([makeAppointment({ orientationType: null })]),
    );

    renderWithQuery(<AppointmentsView />);

    expect(
      await screen.findByText("Mentor · Tema no especificado"),
    ).toBeInTheDocument();
  });

  it("conserva el orden de la API y separa la caché de próximas y pasadas", async () => {
    const user = userEvent.setup();

    vi.mocked(appointmentsApi.getMyAppointments).mockImplementation(
      async ({ scope }) =>
        scope === "upcoming"
          ? makePage([
              makeAppointment({
                id: "next-1",
                counterpart: { id: "m1", fullName: "Primera próxima", role: "mentor" },
              }),
              makeAppointment({
                id: "next-2",
                startAt: "2026-10-28T00:00:00.000Z",
                endAt: "2026-10-28T01:00:00.000Z",
                counterpart: { id: "m2", fullName: "Segunda próxima", role: "mentor" },
              }),
            ])
          : makePage([
              makeAppointment({
                id: "past-1",
                startAt: "2026-10-25T00:00:00.000Z",
                endAt: "2026-10-25T01:00:00.000Z",
                counterpart: { id: "m3", fullName: "Pasada reciente", role: "mentor" },
              }),
              makeAppointment({
                id: "past-2",
                startAt: "2026-10-24T00:00:00.000Z",
                endAt: "2026-10-24T01:00:00.000Z",
                counterpart: { id: "m4", fullName: "Pasada anterior", role: "mentor" },
              }),
            ]),
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
      (client.getQueryData(["appointments", "mine", "upcoming", 1]) as MyAppointmentsPage).items,
    ).toHaveLength(2);
    expect(
      (client.getQueryData(["appointments", "mine", "past", 1]) as MyAppointmentsPage).items,
    ).toHaveLength(2);

    await user.click(screen.getByRole("tab", { name: "Próximas" }));

    await waitFor(() => {
      expect(screen.getByText("Primera próxima")).toBeInTheDocument();
      expect(
        screen.queryByText("Pasada reciente"),
      ).not.toBeInTheDocument();
    });
  });

  it("abre el detalle al tocar una cita y lo cierra", async () => {
    const user = userEvent.setup();
    vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue(
      makePage([makeAppointment()]),
    );
    const getById = vi.spyOn(appointmentsApi, "getById").mockResolvedValue({ ...makeAppointment(), meetingUrl: null });
    vi.spyOn(appointmentsApi, "getCounterpartPhoto").mockResolvedValue(null);

    renderWithQuery(<AppointmentsView />);
    await user.click(await screen.findByRole("button", { name: /Ana Pérez/ }));

    expect(
      await screen.findByRole("heading", { name: "Cita con Ana Pérez" }),
    ).toBeInTheDocument();
    expect(getById).toHaveBeenCalledWith("appointment-1");

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Cita con Ana Pérez" })).not.toBeInTheDocument(),
    );
  });

  it("abre el detalle con el teclado", async () => {
    const user = userEvent.setup();
    vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue(
      makePage([makeAppointment()]),
    );
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue({ ...makeAppointment(), meetingUrl: null });
    vi.spyOn(appointmentsApi, "getCounterpartPhoto").mockResolvedValue(null);

    renderWithQuery(<AppointmentsView />);
    (await screen.findByRole("button", { name: /Ana Pérez/ })).focus();
    await user.keyboard("{Enter}");

    expect(
      await screen.findByRole("heading", { name: "Cita con Ana Pérez" }),
    ).toBeInTheDocument();
  });

  describe("paginación", () => {
    function makeManyAppointments(count: number): Appointment[] {
      return Array.from({ length: count }, (_, index) =>
        makeAppointment({
          id: `appointment-${index}`,
          counterpart: { id: `mentor-${index}`, fullName: `Mentor ${index}`, role: "mentor" },
        }),
      );
    }

    it("no muestra controles de paginación con 10 citas o menos", async () => {
      vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue(
        makePage(makeManyAppointments(10), { total: 10 }),
      );

      renderWithQuery(<AppointmentsView />);

      await screen.findByText("Mentor 0");

      expect(
        screen.queryByRole("navigation", { name: "Paginación de citas" }),
      ).not.toBeInTheDocument();
    });

    it("no muestra controles de paginación con la pestaña vacía", async () => {
      renderWithQuery(<AppointmentsView />);

      await screen.findByText("No tienes citas próximas");

      expect(
        screen.queryByRole("navigation", { name: "Paginación de citas" }),
      ).not.toBeInTheDocument();
    });

    it("muestra el rango, el total y navega a la página siguiente y anterior", async () => {
      const user = userEvent.setup();
      vi.mocked(appointmentsApi.getMyAppointments).mockImplementation(
        async ({ page }) =>
          makePage(makeManyAppointments(10), { total: 48, page }),
      );

      renderWithQuery(<AppointmentsView />);

      await screen.findByText("Mostrando 1–10 de 48 citas");
      expect(screen.getByText("Página 1 de 5")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();

      await user.click(screen.getByRole("button", { name: "Siguiente" }));

      expect(appointmentsApi.getMyAppointments).toHaveBeenCalledWith({
        scope: "upcoming",
        page: 2,
      });
      await screen.findByText("Página 2 de 5");
      expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();

      await user.click(screen.getByRole("button", { name: "Anterior" }));

      expect(appointmentsApi.getMyAppointments).toHaveBeenCalledWith({
        scope: "upcoming",
        page: 1,
      });
      await screen.findByText("Página 1 de 5");
    });

    it("deshabilita ambos botones en la última página", async () => {
      vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue(
        makePage(makeManyAppointments(8), { total: 48, page: 5 }),
      );

      renderWithQuery(<AppointmentsView />);

      await screen.findByText("Página 5 de 5");
      expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    });

    it("vuelve a la página 1 al cambiar de pestaña", async () => {
      const user = userEvent.setup();
      vi.mocked(appointmentsApi.getMyAppointments).mockImplementation(
        async ({ scope, page }) =>
          scope === "upcoming"
            ? makePage(makeManyAppointments(10), { total: 48, page })
            : makePage(makeManyAppointments(20), { total: 20, page }),
      );

      renderWithQuery(<AppointmentsView />);
      await screen.findByText("Página 1 de 5");

      await user.click(screen.getByRole("button", { name: "Siguiente" }));
      await screen.findByText("Página 2 de 5");

      await user.click(screen.getByRole("tab", { name: "Pasadas" }));
      await screen.findByText("Página 1 de 2");
      expect(appointmentsApi.getMyAppointments).toHaveBeenLastCalledWith({
        scope: "past",
        page: 1,
      });
      await user.click(screen.getByRole("tab", { name: "Próximas" }));

      expect(appointmentsApi.getMyAppointments).toHaveBeenLastCalledWith({
        scope: "upcoming",
        page: 1,
      });
    });
  });
});
