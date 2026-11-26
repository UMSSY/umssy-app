import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { companiesService } from "../services/companies.service";
import { FeaturedCompaniesSection } from "./featured-companies-section";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const TECNOSOFT = { id: "1", name: "Tecnosoft S.R.L.", sector: "Desarrollo de software", description: "Software a medida", logoUrl: null, activeVacanciesCount: 1 };
const ANDES = { id: "2", name: "Andes Data", sector: null, description: null, logoUrl: null, activeVacanciesCount: 5 };

describe("FeaturedCompaniesSection", () => {
  it("shows a skeleton while loading", () => {
    vi.spyOn(companiesService, "getFeaturedCompanies").mockReturnValue(new Promise(() => {}));
    render(<FeaturedCompaniesSection />);
    expect(screen.getByRole("status", { name: "Cargando empresas" })).toBeInTheDocument();
  });

  it("renders company cards with their vacancy count", async () => {
    vi.spyOn(companiesService, "getFeaturedCompanies").mockResolvedValue([TECNOSOFT, ANDES]);
    render(<FeaturedCompaniesSection />);
    expect(await screen.findByRole("heading", { name: "Tecnosoft S.R.L." })).toBeInTheDocument();
    expect(screen.getByText("Desarrollo de software")).toBeInTheDocument();
    expect(screen.getByText("Software a medida")).toBeInTheDocument();
    expect(screen.getByText("1 vacante disponible")).toBeInTheDocument();
    expect(screen.getByText("5 vacantes disponibles")).toBeInTheDocument();
    expect(screen.getByText("AD")).toBeInTheDocument();
  });

  it("links each card to the general vacancies page with a matching name", async () => {
    vi.spyOn(companiesService, "getFeaturedCompanies").mockResolvedValue([TECNOSOFT]);
    render(<FeaturedCompaniesSection />);
    expect(await screen.findByRole("link", { name: "Ver vacantes" })).toHaveAttribute("href", "/vacancies");
  });

  it("shows an empty message", async () => {
    vi.spyOn(companiesService, "getFeaturedCompanies").mockResolvedValue([]);
    render(<FeaturedCompaniesSection />);
    expect(await screen.findByText("Pronto publicaremos nuevas empresas destacadas.")).toBeInTheDocument();
  });

  it("offers a retry on error", async () => {
    const getFeaturedCompanies = vi
      .spyOn(companiesService, "getFeaturedCompanies")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue([]);
    render(<FeaturedCompaniesSection />);
    expect(await screen.findByText("Las empresas destacadas no están disponibles por el momento.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(await screen.findByText("Pronto publicaremos nuevas empresas destacadas.")).toBeInTheDocument();
    expect(getFeaturedCompanies).toHaveBeenCalledTimes(2);
  });
});
