import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { companiesService } from "../services/companies.service";
import { FeaturedCompaniesSection } from "./featured-companies-section";

afterEach(() => vi.restoreAllMocks());

describe("FeaturedCompaniesSection", () => {
  it("shows a skeleton while loading", () => {
    vi.spyOn(companiesService, "getFeaturedCompanies").mockReturnValue(new Promise(() => {}));
    render(<FeaturedCompaniesSection />);
    expect(screen.getByRole("status", { name: "Cargando empresas" })).toBeInTheDocument();
  });

  it("renders company cards with vacancy badges", async () => {
    vi.spyOn(companiesService, "getFeaturedCompanies").mockResolvedValue([
      { id: "1", name: "Tecnosoft", description: "Software", activeVacanciesCount: 1 },
      { id: "2", name: "Andes Data", description: "Datos", activeVacanciesCount: 5 },
    ]);
    render(<FeaturedCompaniesSection />);
    expect(await screen.findByText("Tecnosoft")).toBeInTheDocument();
    expect(screen.getByText("1 vacante disponible")).toBeInTheDocument();
    expect(screen.getByText("5 vacantes disponibles")).toBeInTheDocument();
  });

  it("links each card to the vacancies page", async () => {
    vi.spyOn(companiesService, "getFeaturedCompanies").mockResolvedValue([
      { id: "1", name: "Tecnosoft", description: "Software", activeVacanciesCount: 2 },
    ]);
    render(<FeaturedCompaniesSection />);
    expect(await screen.findByRole("link", { name: "Ver vacantes de Tecnosoft" })).toHaveAttribute("href", "/jobs");
  });

  it("shows an empty message", async () => {
    vi.spyOn(companiesService, "getFeaturedCompanies").mockResolvedValue([]);
    render(<FeaturedCompaniesSection />);
    expect(await screen.findByText("Aún no hay empresas con vacantes publicadas. Vuelve pronto.")).toBeInTheDocument();
  });

  it("offers a retry on error", async () => {
    const getFeaturedCompanies = vi.spyOn(companiesService, "getFeaturedCompanies").mockRejectedValueOnce(new Error("offline")).mockResolvedValue([]);
    render(<FeaturedCompaniesSection />);
    expect(await screen.findByText("No pudimos cargar las empresas.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(await screen.findByText("Aún no hay empresas con vacantes publicadas. Vuelve pronto.")).toBeInTheDocument();
    expect(getFeaturedCompanies).toHaveBeenCalledTimes(2);
  });
});