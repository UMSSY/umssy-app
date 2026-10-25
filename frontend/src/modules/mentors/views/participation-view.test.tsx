import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/services/query-client";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMentorParticipation,
  updateMentorParticipation,
} from "../services/mentor-participation.service";
import { ParticipationView } from "./participation-view";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
vi.mock("../services/mentor-participation.service", () => ({
  getMentorParticipation: vi.fn(),
  updateMentorParticipation: vi.fn(),
}));

describe("ParticipationView", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockReset();
    vi.mocked(getMentorParticipation).mockResolvedValue({
      isActive: true,
      technicalAreaIds: ["area-1", "area-2"],
      orientationTypeIds: ["orientation-1", "orientation-2"],
      areas: ["Backend", "QA"],
      orientations: ["Orientación profesional", "Búsqueda de empleo"],
    });
    vi.mocked(updateMentorParticipation).mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
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

  it("muestra el estado inactivo y permite entrar al flujo de reingreso", async () => {
    vi.mocked(getMentorParticipation).mockResolvedValueOnce({
      isActive: false,
      technicalAreaIds: ["area-1", "area-2"],
      orientationTypeIds: ["orientation-1", "orientation-2"],
      areas: ["Backend", "QA"],
      orientations: ["Orientación profesional", "Búsqueda de empleo"],
    }).mockResolvedValue({
      isActive: false,
      technicalAreaIds: ["area-1", "area-2"],
      orientationTypeIds: ["orientation-1", "orientation-2"],
      areas: ["Backend", "QA"],
      orientations: ["Orientación profesional", "Búsqueda de empleo"],
    });
    render(<ParticipationView />);

    expect(await screen.findByText("Desactivado")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Editar áreas técnicas" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Activar participación" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Activar participación" }),
    );

    expect(push).toHaveBeenCalledWith("/mentorship");
    expect(updateMentorParticipation).not.toHaveBeenCalledWith(true);
  });

  it("redirige al flujo de reingreso al confirmar la reactivacion", async () => {
    vi.mocked(getMentorParticipation).mockResolvedValueOnce({
      isActive: false,
      technicalAreaIds: ["area-1", "area-2"],
      orientationTypeIds: ["orientation-1", "orientation-2"],
      areas: ["Backend", "QA"],
      orientations: ["Orientación profesional", "Búsqueda de empleo"],
    });
    render(<ParticipationView />);
    await screen.findByText("Desactivado");

    fireEvent.click(screen.getByRole("button", { name: "Activar participación" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Activar participación" }),
    );

    expect(push).toHaveBeenCalledWith("/mentorship");
    expect(updateMentorParticipation).not.toHaveBeenCalledWith(true);
  });

  it("desactiva la participacion sin borrar las preferencias guardadas", async () => {
    render(<ParticipationView />);
    await screen.findByRole("heading", { name: "Mi participación como mentor" });

    fireEvent.click(
      screen.getByRole("button", { name: "Desactivar participación" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Backend")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Orientación profesional"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Desactivar participación",
      }),
    );
    await waitFor(() =>
      expect(updateMentorParticipation).toHaveBeenCalledWith(false),
    );

    expect(
      await screen.findByText("Has desactivado tu participación temporalmente."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Desactivado")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
  });

  it("habilita la simulación únicamente en desarrollo", async () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<ParticipationView />);
    expect(screen.getByRole("region", { name: "Disponibilidad de cupos (simulación)" })).toBeInTheDocument();
    expect(await screen.findByText("Backend")).toBeInTheDocument();
  });

  it.each([
    ["production", "local"],
    ["production", "prod"],
    ["development", "prod"],
  ])("oculta disponibilidad simulada con NODE_ENV=%s y APP_ENV=%s", async (nodeEnv, appEnv) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", appEnv);
    render(<ParticipationView />);
    expect(screen.queryByRole("region", { name: "Disponibilidad de cupos (simulación)" })).not.toBeInTheDocument();
    expect(await screen.findByText("Backend")).toBeInTheDocument();
  });

  it("muestra la activación cuando no existe participación", async () => {
    vi.mocked(getMentorParticipation).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });
    render(<ParticipationView />);

    expect(
      await screen.findByRole("heading", { name: "Mi participación" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Participa como mentor" }),
    ).toHaveAttribute("href", "/mentorship");
  });

  it("muestra loading hasta que ambas peticiones terminan y comparte la cancelación", () => {
    vi.mocked(getMentorParticipation).mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<ParticipationView />);
    expect(screen.getByText("Cargando participación...")).toBeInTheDocument();
    const signal = vi.mocked(getMentorParticipation).mock.calls[0][0];
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it("muestra errores reales y permite reintentar", async () => {
    vi.mocked(getMentorParticipation).mockRejectedValueOnce(new Error("Network"));
    render(<ParticipationView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar");
    expect(screen.queryByText("Participa como mentor")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Backend")).toBeInTheDocument();
    expect(getMentorParticipation).toHaveBeenCalledTimes(2);
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
