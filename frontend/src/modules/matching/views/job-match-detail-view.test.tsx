import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jobMatchingService } from "../services/job-matching.service";
import { buildMatch } from "../testing/job-fixtures";
import { renderWithQuery } from "../testing/render-with-query";
import { JobMatchDetailView } from "./job-match-detail-view";

let getJobMatch: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  getJobMatch = vi.spyOn(jobMatchingService, "getJobMatch");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function notFoundError() {
  return Object.assign(new Error("no encontrado"), { isAxiosError: true, response: { status: 404 } });
}

describe("JobMatchDetailView", () => {
  it("muestra el breadcrumb, el título, la empresa y la modalidad", async () => {
    getJobMatch.mockResolvedValue(buildMatch());
    renderWithQuery(<JobMatchDetailView jobOfferId="o1" />);

    expect(await screen.findByRole("heading", { level: 1, name: "Desarrollador Backend" })).toBeInTheDocument();
    expect(screen.getByText("Empresa SA · Remoto")).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Ruta de navegación" });
    expect(within(breadcrumb).getByRole("link", { name: "Vacantes" })).toHaveAttribute("href", "/jobs");
    expect(within(breadcrumb).getByText("Ver vacante")).toBeInTheDocument();
    expect(getJobMatch).toHaveBeenCalledWith("o1");
  });

  it("muestra el porcentaje y las habilidades que coinciden", async () => {
    getJobMatch.mockResolvedValue(buildMatch({ score: 67 }));
    renderWithQuery(<JobMatchDetailView jobOfferId="o1" />);

    expect(await screen.findByText("67%")).toBeInTheDocument();
    expect(screen.getByText(/de afinidad con tu perfil/)).toBeInTheDocument();
    expect(screen.getByText("según Python, Docker")).toBeInTheDocument();
  });

  it("omite el según cuando ninguna habilidad coincide", async () => {
    getJobMatch.mockResolvedValue(
      buildMatch({ score: 0, matchedSkills: [], missingSkills: ["Python"], skills: ["Python"] }),
    );
    renderWithQuery(<JobMatchDetailView jobOfferId="o1" />);

    expect(await screen.findByText("0%")).toBeInTheDocument();
    expect(screen.queryByText(/^según/)).not.toBeInTheDocument();
  });

  it("muestra una fila por requisito con Coincide o No está en tu perfil", async () => {
    getJobMatch.mockResolvedValue(buildMatch());
    renderWithQuery(<JobMatchDetailView jobOfferId="o1" />);

    const heading = await screen.findByRole("heading", { name: "Requisitos vs. tu perfil" });
    const rows = within(heading.closest("section") as HTMLElement).getAllByRole("listitem");

    expect(rows.map((row) => row.textContent)).toEqual([
      "PythonCoincide",
      "DockerCoincide",
      "ReactNo está en tu perfil",
    ]);
  });

  it("muestra la descripción y el enlace para volver a las vacantes", async () => {
    getJobMatch.mockResolvedValue(buildMatch());
    renderWithQuery(<JobMatchDetailView jobOfferId="o1" />);

    expect(await screen.findByText(/Desarrollo de servicios\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/jobs");
  });

  it("no incluye el botón de postulación ni las pantallas del Sprint 3", async () => {
    getJobMatch.mockResolvedValue(buildMatch());
    renderWithQuery(<JobMatchDetailView jobOfferId="o1" />);

    await screen.findByRole("heading", { level: 1 });

    expect(screen.queryByText(/postulaci/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /postular|enviar/i })).not.toBeInTheDocument();
  });

  it("muestra el estado de carga mientras espera la respuesta", () => {
    getJobMatch.mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<JobMatchDetailView jobOfferId="o1" />);

    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("muestra un mensaje claro y un enlace a las vacantes cuando la vacante no existe", async () => {
    getJobMatch.mockRejectedValue(notFoundError());
    renderWithQuery(<JobMatchDetailView jobOfferId="x" />);

    expect(await screen.findByText("Esta vacante no existe o ya no está publicada.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a vacantes" })).toHaveAttribute("href", "/jobs");
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("muestra el error y permite reintentar", async () => {
    getJobMatch.mockRejectedValueOnce(new Error("fallo")).mockResolvedValueOnce(buildMatch());
    renderWithQuery(<JobMatchDetailView jobOfferId="o1" />);

    expect(await screen.findByText("No pudimos cargar la información. Intenta nuevamente.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Desarrollador Backend" })).toBeInTheDocument();
    expect(getJobMatch).toHaveBeenCalledTimes(2);
  });
});
