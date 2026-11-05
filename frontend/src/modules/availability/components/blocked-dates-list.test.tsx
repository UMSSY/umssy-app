import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { availabilityApi } from "../services/availability.service";
import type { BlockedDate } from "../types/blocked-date.types";
import { BlockedDatesList } from "./blocked-dates-list";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const dates: BlockedDate[] = [
  { id: "today", mentorId: "m1", blockedOn: "2026-10-31", reason: null, createdAt: "" },
  { id: "later", mentorId: "m1", blockedOn: "2027-02-10", reason: "Viaje de trabajo", createdAt: "" },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-01T02:00:00Z") });
  vi.spyOn(availabilityApi, "getFutureBlockedDates").mockResolvedValue(dates);
  vi.spyOn(availabilityApi, "unblockDate").mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("BlockedDatesList", () => {
  it("consulta desde la medianoche de Bolivia y muestra hoy y fechas de otros meses con su motivo", async () => {
    renderWithQuery(<BlockedDatesList />);
    const items = await screen.findAllByRole("listitem");
    expect(availabilityApi.getFutureBlockedDates).toHaveBeenCalledWith("2026-10-31T00:00:00-04:00");
    expect(items.map((item) => item.querySelector("time")?.dateTime)).toEqual(["2026-10-31", "2027-02-10"]);
    expect(within(items[0]).queryByText("Viaje de trabajo")).not.toBeInTheDocument();
    expect(within(items[1]).getByText("Viaje de trabajo")).toBeInTheDocument();
  });

  it("muestra carga sin anunciar una lista vacía", () => {
    vi.mocked(availabilityApi.getFutureBlockedDates).mockImplementation(() => new Promise(() => {}));
    renderWithQuery(<BlockedDatesList />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando fechas bloqueadas...");
    expect(screen.queryByText("No tienes fechas bloqueadas")).not.toBeInTheDocument();
  });

  it("muestra el estado vacío después de una consulta exitosa", async () => {
    vi.mocked(availabilityApi.getFutureBlockedDates).mockResolvedValue([]);
    renderWithQuery(<BlockedDatesList />);
    expect(await screen.findByText("No tienes fechas bloqueadas")).toBeInTheDocument();
  });

  it("permite reintentar una consulta fallida sin confundir error con vacío", async () => {
    vi.mocked(availabilityApi.getFutureBlockedDates).mockRejectedValueOnce(new Error("Network"));
    const user = userEvent.setup();
    renderWithQuery(<BlockedDatesList />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Error al obtener las fechas bloqueadas");
    expect(screen.queryByText("No tienes fechas bloqueadas")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Viaje de trabajo")).toBeInTheDocument();
  });

  it("desbloquea por id, actualiza la lista y evita envíos duplicados mientras está pendiente", async () => {
    let finish: () => void = () => {};
    vi.mocked(availabilityApi.unblockDate).mockImplementation(() => new Promise<void>((resolve) => {
      finish = () => {
        vi.mocked(availabilityApi.getFutureBlockedDates).mockResolvedValue([dates[0]]);
        resolve();
      };
    }));
    const user = userEvent.setup();
    renderWithQuery(<BlockedDatesList />);
    const button = await screen.findByRole("button", { name: /Desbloquear fecha:.*10 de febrero/i });
    await user.dblClick(button);
    expect(availabilityApi.unblockDate).toHaveBeenCalledExactlyOnceWith("later");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Desbloqueando...");
    finish();
    await waitFor(() => expect(screen.queryByText("Viaje de trabajo")).not.toBeInTheDocument());
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("conserva la fecha si el desbloqueo falla y permite volver a intentarlo", async () => {
    vi.mocked(availabilityApi.unblockDate).mockRejectedValueOnce(new Error("Network"));
    const user = userEvent.setup();
    renderWithQuery(<BlockedDatesList />);
    const button = await screen.findByRole("button", { name: /Desbloquear fecha:.*10 de febrero/i });
    await user.click(button);
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByText("Viaje de trabajo")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
