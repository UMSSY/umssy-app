import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { MentorAvailabilityView } from "./mentor-availability-view";
import { availabilityApi } from "../services/availability.service";
import type { BlockedDate } from "../types/blocked-date.types";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const date: BlockedDate = {
  id: "d1",
  mentorId: "m1",
  blockedOn: "2026-10-08",
  reason: "Viaje",
  createdAt: "",
};

const block = {
  id: "b1",
  mentorId: "m1",
  startAt: "2026-10-08T22:00:00Z",
  endAt: "2026-10-08T23:00:00Z",
  state: "free" as const,
  createdAt: "",
  updatedAt: "",
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers({
    toFake: ["Date"],
    now: new Date("2026-10-07T15:00:00Z"),
  });

  vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
    block,
  ]);
  vi.spyOn(availabilityApi, "getBlockedDates").mockResolvedValue([]);
  vi.spyOn(availabilityApi, "getFutureBlockedDates").mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("blocked dates flow", () => {
  it("desbloquea desde la lista y refresca la grilla y las fechas de otras semanas", async () => {
    const later = { ...date, id: "later", blockedOn: "2027-02-10", reason: "Congreso" };
    vi.mocked(availabilityApi.getBlockedDates).mockResolvedValue([date]);
    vi.mocked(availabilityApi.getFutureBlockedDates).mockResolvedValue([date, later]);
    vi.spyOn(availabilityApi, "unblockDate").mockImplementation(async () => {
      vi.mocked(availabilityApi.getBlockedDates).mockResolvedValue([]);
      vi.mocked(availabilityApi.getFutureBlockedDates).mockResolvedValue([later]);
    });
    const user = userEvent.setup();
    renderWithQuery(<MentorAvailabilityView />);
    const list = screen.getByRole("region", { name: "Fechas bloqueadas" });
    expect(await within(list).findByText("Congreso")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "libre, 18:00 a 19:00" })).not.toBeInTheDocument();
    await user.click(within(list).getByRole("button", { name: /Desbloquear fecha:.*8 de octubre/i }));
    expect(await screen.findByRole("button", { name: "libre, 18:00 a 19:00" })).toBeInTheDocument();
    await waitFor(() => expect(within(list).queryByText("Viaje")).not.toBeInTheDocument());
    expect(within(list).getByText("Congreso")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Semana siguiente" }));
    expect(within(list).getByText("Congreso")).toBeInTheDocument();
    expect(availabilityApi.getFutureBlockedDates).toHaveBeenCalledTimes(2);
  });

  it("bloquea desde la grilla, muestra el motivo en ambas vistas y conserva los bloques al desbloquear", async () => {
    vi.spyOn(availabilityApi, "blockDate").mockImplementation(async () => {
      vi.mocked(availabilityApi.getBlockedDates).mockResolvedValue([date]);
      vi.mocked(availabilityApi.getFutureBlockedDates).mockResolvedValue([date]);
      return date;
    });

    vi.spyOn(availabilityApi, "unblockDate").mockImplementation(async () => {
      vi.mocked(availabilityApi.getBlockedDates).mockResolvedValue([]);
      vi.mocked(availabilityApi.getFutureBlockedDates).mockResolvedValue([]);
    });

    const user = userEvent.setup();
    renderWithQuery(<MentorAvailabilityView />);

    const days = await screen.findAllByRole("button", {
      name: "Seleccionar fecha: Jueves 8 de octubre",
    });
    await user.click(days[0]);

    const panel = screen.getByRole("complementary", {
      name: "Bloquear fecha",
    });

    await user.type(
      within(panel).getByLabelText("Motivo (opcional)"),
      "Viaje"
    );
    await user.click(
      within(panel).getByRole("button", { name: "Bloquear fecha" })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("complementary", { name: "Bloquear fecha" })
      ).not.toBeInTheDocument();

      expect(screen.getAllByText("Viaje")).toHaveLength(3);
    });

    expect(availabilityApi.blockDate).toHaveBeenCalledWith({
      blockedOn: date.blockedOn,
      reason: "Viaje",
    });
    expect(
      screen.queryByRole("button", { name: "libre, 18:00 a 19:00" })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Desbloquear fecha" })[0]
    );

    const unblockPanel = screen.getByRole("complementary", {
      name: "Desbloquear fecha",
    });

    await user.click(
      within(unblockPanel).getByRole("button", {
        name: "Desbloquear fecha",
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("complementary", {
          name: "Desbloquear fecha",
        })
      ).not.toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: "libre, 18:00 a 19:00" })
      ).toBeInTheDocument();

      expect(screen.queryByText("Viaje")).not.toBeInTheDocument();
    });

    expect(availabilityApi.unblockDate).toHaveBeenCalledWith(date.id);
  });

  it("abre el panel desde la lista móvil aunque el día no tenga bloques", async () => {
    vi.mocked(availabilityApi.getAvailabilityBlocks).mockResolvedValue([]);

    renderWithQuery(<MentorAvailabilityView />);

    const days = await screen.findAllByRole("button", {
      name: "Seleccionar fecha: Jueves 8 de octubre",
    });
    fireEvent.click(days[1]);

    expect(
      screen.getByRole("complementary", { name: "Bloquear fecha" })
    ).toBeInTheDocument();
  });

  it("muestra el error de consulta de bloqueos e impide seleccionar fechas", async () => {
    vi.mocked(availabilityApi.getBlockedDates).mockRejectedValue(
      new Error("Network")
    );

    renderWithQuery(<MentorAvailabilityView />);

    expect(
      await screen.findByText("Error al obtener las fechas bloqueadas")
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /^Seleccionar fecha:/ })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("complementary", { name: "Bloquear fecha" })
    ).not.toBeInTheDocument();
  });

  it("una fecha pasada muestra la restricción al seleccionarla", async () => {
    renderWithQuery(<MentorAvailabilityView />);

    const days = await screen.findAllByRole("button", {
      name: "Seleccionar fecha: Lunes 5 de octubre",
    });
    fireEvent.click(days[0]);

    const panel = screen.getByRole("complementary", {
      name: "Bloquear fecha",
    });

    expect(within(panel).getByRole("alert")).toHaveTextContent(
      "No se pueden bloquear fechas pasadas"
    );
    expect(
      within(panel).getByRole("button", { name: "Bloquear fecha" })
    ).toBeDisabled();
  });
});
