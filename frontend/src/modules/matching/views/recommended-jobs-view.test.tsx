import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jobMatchingService } from "../services/job-matching.service";
import { buildJob } from "../testing/job-fixtures";
import { renderWithQuery } from "../testing/render-with-query";
import type { RecommendationsResult } from "../types/job-matching.types";
import { RecommendedJobsView } from "./recommended-jobs-view";

const JOBS = [
  buildJob({ jobOfferId: "a", title: "Desarrollador Backend", score: 90, modality: "Remoto" }),
  buildJob({ jobOfferId: "b", title: "Analista de Datos", companyName: "Andes Data Labs", score: 70, modality: "Presencial", skills: ["SQL"], matchedSkills: ["SQL"], missingSkills: [] }),
  buildJob({ jobOfferId: "c", title: "Diseñador Web", score: 40, modality: "Híbrido", skills: ["React"], matchedSkills: [], missingSkills: ["React"] }),
];

let getRecommendations: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  getRecommendations = vi.spyOn(jobMatchingService, "getRecommendations");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderWith(result: RecommendationsResult) {
  getRecommendations.mockResolvedValue(result);
  return renderWithQuery(<RecommendedJobsView />);
}

const cardTitles = () => screen.queryAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);

describe("RecommendedJobsView", () => {
  it("muestra el breadcrumb, el título y el subtítulo del diseño", async () => {
    renderWith({ isProfileComplete: true, items: JOBS });

    expect(await screen.findByRole("heading", { name: "Vacantes para ti" })).toBeInTheDocument();
    expect(
      screen.getByText("Encuentra ofertas según tu afinidad, área técnica y modalidad."),
    ).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Ruta de navegación" });
    expect(within(breadcrumb).getByText("UMSSY")).toBeInTheDocument();
    expect(within(breadcrumb).getByText("Empleos")).toBeInTheDocument();
    expect(within(breadcrumb).getByText("Vacantes")).toBeInTheDocument();
  });

  it("muestra el recuadro informativo de la afinidad", async () => {
    renderWith({ isProfileComplete: true, items: JOBS });

    expect(await screen.findByText("¿Qué es la afinidad?")).toBeInTheDocument();
    expect(
      screen.getByText(/Comparamos las habilidades de tu perfil con lo que pide cada vacante; es una guía para priorizar, no una garantía de contratación\./),
    ).toBeInTheDocument();
  });

  it("muestra las tarjetas en el orden recibido", async () => {
    renderWith({ isProfileComplete: true, items: JOBS });

    await screen.findByText("90% afinidad");

    expect(cardTitles()).toEqual(["Desarrollador Backend", "Analista de Datos", "Diseñador Web"]);
  });

  it("muestra el estado de carga mientras espera la respuesta", () => {
    getRecommendations.mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<RecommendedJobsView />);

    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("muestra el error y permite reintentar", async () => {
    getRecommendations.mockRejectedValueOnce(new Error("fallo")).mockResolvedValueOnce({
      isProfileComplete: true,
      items: JOBS,
    });
    renderWithQuery(<RecommendedJobsView />);

    expect(await screen.findByText("No pudimos cargar la información. Intenta nuevamente.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("90% afinidad")).toBeInTheDocument();
    expect(getRecommendations).toHaveBeenCalledTimes(2);
  });

  it("muestra el estado de perfil incompleto sin filtros ni tarjetas", async () => {
    renderWith({ isProfileComplete: false, items: [] });

    expect(await screen.findByRole("heading", { name: "Aún no podemos calcular tu afinidad" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Completar mi perfil" })).toBeInTheDocument();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(cardTitles()).toEqual(["Aún no podemos calcular tu afinidad"]);
  });

  it("muestra el estado sin coincidencias cuando el perfil está completo y no hay vacantes", async () => {
    renderWith({ isProfileComplete: true, items: [] });

    expect(
      await screen.findByRole("heading", { name: "Por ahora no hay vacantes que coincidan con tu perfil" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
  });

  it("filtra con el buscador", async () => {
    renderWith({ isProfileComplete: true, items: JOBS });
    await screen.findByText("90% afinidad");

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), { target: { value: "andes" } });

    expect(cardTitles()).toEqual(["Analista de Datos"]);
  });

  it("filtra por modalidad con las opciones de las vacantes recibidas", async () => {
    renderWith({ isProfileComplete: true, items: JOBS });
    await screen.findByText("90% afinidad");

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Todas",
      "Híbrido",
      "Presencial",
      "Remoto",
    ]);
    fireEvent.change(screen.getByLabelText("Modalidad:"), { target: { value: "Presencial" } });

    expect(cardTitles()).toEqual(["Analista de Datos"]);
  });

  it("filtra con Solo alta afinidad usando el umbral de 70 %", async () => {
    renderWith({ isProfileComplete: true, items: JOBS });
    await screen.findByText("90% afinidad");

    await userEvent.click(screen.getByRole("checkbox", { name: "Solo alta afinidad" }));

    expect(cardTitles()).toEqual(["Desarrollador Backend", "Analista de Datos"]);
  });

  it("muestra un mensaje cuando los filtros no dejan ninguna vacante y Limpiar los quita", async () => {
    renderWith({ isProfileComplete: true, items: JOBS });
    await screen.findByText("90% afinidad");

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), { target: { value: "zzz" } });

    expect(screen.getByRole("heading", { name: "Ninguna vacante coincide con los filtros" })).toBeInTheDocument();
    expect(cardTitles()).toEqual(["Ninguna vacante coincide con los filtros"]);

    await userEvent.click(screen.getByRole("button", { name: "Limpiar" }));

    await waitFor(() => expect(cardTitles()).toEqual(["Desarrollador Backend", "Analista de Datos", "Diseñador Web"]));
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveValue("");
    expect(screen.getByLabelText("Modalidad:")).toHaveValue("");
    expect(screen.getByRole("checkbox", { name: "Solo alta afinidad" })).not.toBeChecked();
  });

  it("combina los filtros y Limpiar los restablece todos", async () => {
    renderWith({ isProfileComplete: true, items: JOBS });
    await screen.findByText("90% afinidad");

    fireEvent.change(screen.getByLabelText("Modalidad:"), { target: { value: "Remoto" } });
    await userEvent.click(screen.getByRole("checkbox", { name: "Solo alta afinidad" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), { target: { value: "backend" } });

    expect(cardTitles()).toEqual(["Desarrollador Backend"]);

    await userEvent.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(cardTitles()).toHaveLength(3);
  });
});
