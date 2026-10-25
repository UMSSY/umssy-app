import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/services/query-client";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMentorTechnicalAreas } from "../services/technical-areas.service";
import { getMentorOrientationTypes } from "@/modules/mentorship/services/orientation-type.service";
import { getParticipation, getCapacity } from "@/modules/mentorship/services/mentor-participation.service";
import { ParticipationView } from "./participation-view";

vi.mock("../services/technical-areas.service", () => ({
  getMentorTechnicalAreas: vi.fn(),
}));
vi.mock("@/modules/mentorship/services/orientation-type.service", () => ({
  getMentorOrientationTypes: vi.fn(),
}));
vi.mock("@/modules/mentorship/services/mentor-participation.service", () => ({
  getParticipation: vi.fn(),
  getCapacity: vi.fn(),
}));

describe("ParticipationView", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getParticipation).mockResolvedValue({ email: "mentor@test.com", status: "ACTIVE", request: null });
    vi.mocked(getCapacity).mockResolvedValue({ approvedGraduates: 25, percentage: 40, capacity: 10, activeMentors: 9, reservedOffers: 1, occupied: 10, available: 0 });
    vi.mocked(getMentorTechnicalAreas).mockResolvedValue([
      { id: "area-1", name: "Backend", description: null },
      { id: "area-2", name: "QA", description: null },
    ]);
    vi.mocked(getMentorOrientationTypes).mockResolvedValue([
      { id: "orientation-1", name: "Orientación profesional", description: null },
      { id: "orientation-2", name: "Búsqueda de empleo", description: null },
    ]);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("mantiene un estado inicial estable mientras resuelve la participación", () => {
    const html = renderToString(<QueryClientProvider client={createQueryClient()}><ParticipationView /></QueryClientProvider>);

    expect(html).toContain("Cargando participación...");
    expect(html).not.toContain("Mi participación como mentor");
    expect(html).not.toContain("Participa como mentor");
  });

  it("muestra la participación activa con sus datos y enlaces de edición", async () => {
    render(<ParticipationView />);

    expect(
      await screen.findByRole("heading", { name: "Mi participación como mentor" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("QA")).toBeInTheDocument();
    expect(screen.getByText("Orientación profesional")).toBeInTheDocument();
    expect(screen.getByText("Búsqueda de empleo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Editar áreas técnicas" }),
    ).toHaveAttribute("href", "/mentors/participation/technical-areas");
    expect(
      screen.getByRole("link", { name: "Editar tipos de orientación" }),
    ).toHaveAttribute("href", "/mentorship/orientation");
  });

  it("muestra la activación cuando no existe participación", async () => {
    vi.mocked(getParticipation).mockResolvedValue({ email: "titulado@test.com", status: "NONE", request: null });
    vi.mocked(getMentorTechnicalAreas).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });
    render(<ParticipationView />);

    expect(
      await screen.findByRole("heading", { name: "Mi participación como mentor" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Participa como mentor" }),
    ).toHaveAttribute("href", "/mentorship");
  });

  it("reabre la oferta con el mismo vencimiento recibido del backend", async () => {
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    vi.mocked(getParticipation).mockResolvedValue({
      email: "hu7.07@umssy.test", status: "OFFERED",
      request: {
        id: "request-1", requestedAt: new Date(Date.now() - 86_400_000).toISOString(), queuedAt: new Date(Date.now() - 86_400_000).toISOString(),
        technicalAreas: [{ id: "area-1", name: "Backend" }],
        orientationTypes: [{ id: "orientation-1", name: "Orientación profesional" }],
        offer: { id: "offer-1", status: "OFFERED", offeredAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), expiresAt },
      },
    });
    render(<ParticipationView />);
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("¡Tienes un cupo disponible!");
    expect(dialog).toHaveTextContent("restantes");
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver oferta" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("restantes");
  });

  it("muestra el detalle de la solicitud pendiente sin publicar su posición FIFO", async () => {
    vi.mocked(getParticipation).mockResolvedValue({
      email: "hu7.08@umssy.test", status: "PENDING",
      request: {
        id: "request-2", requestedAt: new Date(Date.now() - 86_400_000).toISOString(), queuedAt: new Date(Date.now() - 86_400_000).toISOString(),
        technicalAreas: [{ id: "area-1", name: "Backend" }],
        orientationTypes: [{ id: "orientation-1", name: "Orientación profesional" }], offer: null,
      },
    });
    render(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver más detalles" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Estado: Pendiente");
    expect(dialog).toHaveTextContent("Backend");
    expect(dialog).toHaveTextContent("hu7.08@umssy.test");
    expect(dialog).not.toHaveTextContent("lugar 1");
  });

  it("muestra loading hasta que ambas peticiones terminan y comparte la cancelación", () => {
    vi.mocked(getMentorTechnicalAreas).mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<ParticipationView />);
    expect(screen.getByText("Cargando participación...")).toBeInTheDocument();
    const signal = vi.mocked(getMentorTechnicalAreas).mock.calls[0][0];
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(getMentorOrientationTypes).toHaveBeenCalledWith(signal);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it("muestra errores reales y permite reintentar", async () => {
    vi.mocked(getMentorOrientationTypes).mockRejectedValueOnce(new Error("Network"));
    render(<ParticipationView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar");
    expect(screen.queryByText("Participa como mentor")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Backend")).toBeInTheDocument();
    expect(getMentorTechnicalAreas).toHaveBeenCalledTimes(2);
    expect(getMentorOrientationTypes).toHaveBeenCalledTimes(2);
  });

  it("no oculta un error real aunque el otro endpoint devuelva 404", async () => {
    vi.mocked(getMentorTechnicalAreas).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });
    vi.mocked(getMentorOrientationTypes).mockRejectedValue({
      isAxiosError: true,
      response: { status: 500 },
    });
    render(<ParticipationView />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("ignora los datos antiguos de localStorage y muestra nombres del backend", async () => {
    localStorage.setItem(
      "umssy-mentor-participation",
      JSON.stringify({ status: "active", areas: ["Datos antiguos"], orientations: [] }),
    );
    const readStorage = vi.spyOn(Storage.prototype, "getItem");
    render(<ParticipationView />);
    expect(await screen.findByText("Backend")).toBeInTheDocument();
    expect(screen.queryByText("Datos antiguos")).not.toBeInTheDocument();
    expect(readStorage).not.toHaveBeenCalledWith("umssy-mentor-participation");
  });
});
