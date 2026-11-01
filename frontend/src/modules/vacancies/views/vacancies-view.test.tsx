import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jobApplicationService } from "@/modules/matching/services/job-application.service";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { vacanciesService } from "../services/vacancies.service";
import { buildVacancy } from "../testing/vacancy-fixtures";
import { VacanciesView } from "./vacancies-view";

vi.mock("../services/vacancies.service", () => ({
  vacanciesService: { listPublished: vi.fn() },
}));

vi.mock("@/modules/matching/services/job-application.service", () => ({
  jobApplicationService: { apply: vi.fn(), getMine: vi.fn() },
}));

const listPublished = vi.mocked(vacanciesService.listPublished);
const getMine = vi.mocked(jobApplicationService.getMine);

const VACANCIES = [
  buildVacancy(),
  buildVacancy({ id: "7c3e9a10-1d2b-4f5a-9c8e-2b4d6f8a0c11", title: "Analista de Datos", companyName: "Datos SRL", requirements: ["SQL"] }),
];

function setRole(roleTag: string) {
  sessionStorage.setItem("accessToken", `h.${btoa(JSON.stringify({ roleTag }))}.s`);
}

beforeEach(() => {
  vi.clearAllMocks();
  listPublished.mockResolvedValue(VACANCIES);
  getMine.mockResolvedValue({ hasApplied: false, application: null });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("VacanciesView", () => {
  it("lista las vacantes publicadas que devuelve la API", async () => {
    renderWithQuery(<VacanciesView />);

    expect(await screen.findByRole("link", { name: "Ver detalles de Desarrollador Full Stack" })).toHaveAttribute(
      "href",
      `/vacancies/${VACANCIES[0].id}`,
    );
    expect(screen.getByRole("status")).toHaveTextContent("2 vacantes encontradas");
    expect(listPublished).toHaveBeenCalledTimes(1);
  });

  it("permite recuperar los resultados desde una búsqueda sin coincidencias", async () => {
    renderWithQuery(<VacanciesView />);
    const initialLinks = await screen.findAllByRole("link", { name: /^Ver detalles de / });
    const searchInput = screen.getByRole("searchbox", { name: /Buscar vacantes/ });

    fireEvent.change(searchInput, { target: { value: "vacante-sin-coincidencias" } });

    expect(screen.getByRole("heading", { name: "No se encontraron vacantes" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("0 vacantes encontradas");
    expect(screen.queryByRole("link", { name: /^Ver detalles de / })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));

    expect(searchInput).toHaveValue("");
    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })).toHaveLength(initialLinks.length);
  });

  it("busca también por tecnología requerida", async () => {
    renderWithQuery(<VacanciesView />);
    await screen.findAllByRole("link", { name: /^Ver detalles de / });

    fireEvent.change(screen.getByRole("searchbox", { name: /Buscar vacantes/ }), { target: { value: "sql" } });

    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Ver detalles de Analista de Datos" })).toBeInTheDocument();
  });

  it("avisa cuando todavía no hay vacantes publicadas", async () => {
    listPublished.mockResolvedValue([]);
    renderWithQuery(<VacanciesView />);

    expect(await screen.findByText("Todavía no hay vacantes publicadas. Vuelve pronto.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
  });

  it("muestra un error con opción de reintentar si la API falla", async () => {
    listPublished.mockRejectedValue(new Error("network"));
    renderWithQuery(<VacanciesView />);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByRole("heading", { name: "No pudimos cargar las vacantes" })).toBeInTheDocument();

    listPublished.mockResolvedValue(VACANCIES);
    fireEvent.click(within(alert).getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("link", { name: "Ver detalles de Analista de Datos" })).toBeInTheDocument();
  });

  it("muestra el botón de postular a titulados y estudiantes en el detalle", async () => {
    setRole("estudiante");
    renderWithQuery(<VacanciesView initialVacancyId={VACANCIES[0].id} />);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Desarrollador Full Stack" })).toBeInTheDocument();
    expect(await within(dialog).findByRole("button", { name: "Enviar postulación" })).toBeInTheDocument();
    expect(getMine).toHaveBeenCalledWith(VACANCIES[0].id);
  });

  it("no muestra el botón de postular a un mentor", async () => {
    setRole("mentor");
    renderWithQuery(<VacanciesView initialVacancyId={VACANCIES[0].id} />);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Volver al listado" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Enviar postulación" })).toBeNull();
    expect(getMine).not.toHaveBeenCalled();
  });
});
