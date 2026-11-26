import "@/shared/testing/indexed-db.mock";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { vacanciesService } from "../services/vacancies.service";
import { buildVacancy } from "../testing/vacancy-fixtures";
import { VacanciesView } from "./vacancies-view";

vi.mock("../services/vacancies.service", () => ({
  vacanciesService: { listPublished: vi.fn() },
}));
vi.mock("@/modules/matching/hooks/use-applied-job-offer-ids", () => ({
  useAppliedJobOfferIds: () => new Set<string>(),
}));

const VACANCIES = [
  buildVacancy({
    id: "scientist",
    title: "Científico de Datos",
    companyName: "Tecnología Álvarez",
    requirements: ["Análisis estadístico"],
  }),
  buildVacancy({ id: "developer", title: "Desarrollador Backend" }),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(vacanciesService.listPublished).mockResolvedValue(VACANCIES);
});
afterEach(cleanup);

describe("VacanciesView accent-insensitive search", () => {
  it.each([
    ["title", "cientifico", "CIENTÍFICO"],
    ["company", "tecnologia alvarez", "Tecnología Álvarez"],
    ["requirement", "analisis estadistico", "Análisis estadístico"],
    ["Unicode composition", "científico", "cienti\u0301fico"],
    ["surrounding whitespace", "cientifico", "  científico  "],
  ])("keeps the same cards and count for equivalent %s queries", async (_field, plain, accented) => {
    renderWithQuery(<VacanciesView />);
    await screen.findByRole("link", { name: "Ver detalles de Científico de Datos" });
    const input = screen.getByRole("searchbox", { name: /Buscar vacantes/ });

    for (const query of [plain, accented]) {
      fireEvent.change(input, { target: { value: query } });
      expect(screen.getByRole("link", { name: "Ver detalles de Científico de Datos" })).toBeVisible();
      expect(screen.queryByRole("link", { name: "Ver detalles de Desarrollador Backend" })).toBeNull();
      expect(screen.getByRole("status")).toHaveTextContent("1 vacante encontrada");
    }

    fireEvent.change(input, { target: { value: "sin coincidencias" } });
    expect(screen.getByRole("heading", { name: "No se encontraron vacantes" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("0 vacantes encontradas");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(input).toHaveValue("");
    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("2 vacantes encontradas");
  });
});
