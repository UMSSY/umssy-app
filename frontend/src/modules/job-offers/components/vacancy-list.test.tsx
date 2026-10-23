import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { jobOffersService } from "../services/job-offers.service";
import type { JobOffer } from "../types/job-offer.types";
import { useCompanyJobOffers } from "../hooks/use-company-job-offers";
import { VacancyList } from "./vacancy-list";

vi.mock("../hooks/use-company-job-offers", () => ({
  useCompanyJobOffers: vi.fn(),
}));

const COMPANY_ID = "a0000000-0000-4000-8000-000000000001";
const OFFERS: JobOffer[] = [
  {
    id: "offer-1",
    title: "Desarrolladora Frontend",
    description: "Primera vacante",
    category: "Tecnología",
    modality: "Remoto",
    contractType: "Tiempo completo",
    status: "Publicada",
    positionsAvailable: 1,
    salaryRange: "Bs 5.000 - 7.000",
    languages: "Español",
    locationUrl: "https://maps.app.goo.gl/TechBolivia",
    expiresAt: null,
    createdAt: "2026-10-12T00:00:00.000Z",
    company: { id: COMPANY_ID, name: "TechBolivia" },
    skills: [],
    applicantsCount: 0,
  },
  {
    id: "offer-2",
    title: "Ingeniero Backend",
    description: "Backend",
    category: "Sistemas",
    modality: "Híbrido",
    contractType: "Pasantía",
    status: "Publicada",
    positionsAvailable: 2,
    salaryRange: "A convenir",
    languages: "Español, Inglés",
    locationUrl: "https://maps.app.goo.gl/TechBolivia",
    expiresAt: null,
    createdAt: "2026-10-12T00:00:00.000Z",
    company: { id: COMPANY_ID, name: "TechBolivia" },
    skills: [
      { id: "skill-1", name: "TypeScript" },
      { id: "skill-2", name: "PostgreSQL" },
    ],
    applicantsCount: 0,
  },
];

describe("VacancyList details", () => {
  beforeEach(() => {
    vi.mocked(useCompanyJobOffers).mockReturnValue({
      companyId: COMPANY_ID,
      offers: OFFERS,
      status: "ready",
      reload: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("opens details for the selected vacancy and renders all HU5 fields", async () => {
    const user = userEvent.setup();
    const getDetails = vi
      .spyOn(jobOffersService, "getByCompanyAndId")
      .mockResolvedValue(OFFERS[1]);

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));

    expect(await screen.findByRole("heading", { name: "Ingeniero Backend" })).toBeInTheDocument();
    expect(getDetails).toHaveBeenCalledWith(COMPANY_ID, "offer-2");
    expect(screen.getByText("Híbrido")).toBeInTheDocument();
    expect(screen.getByText("Pasantía")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Español, Inglés")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir ubicación" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(screen.getByText("Sistemas")).toBeInTheDocument();
    expect(screen.getByText("A convenir")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("shows loading, then loads the selected vacancy", async () => {
    const user = userEvent.setup();
    let resolveDetails!: (offer: JobOffer) => void;
    vi.spyOn(jobOffersService, "getByCompanyAndId").mockImplementation(
      () =>
        new Promise<JobOffer>((resolve) => {
          resolveDetails = resolve;
        }),
    );

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));
    expect(screen.getByRole("status")).toHaveTextContent("Cargando detalles de la vacante...");

    await act(async () => resolveDetails(OFFERS[1]));
    expect(await screen.findByText("TypeScript")).toBeInTheDocument();
  });

  it("shows a Spanish error and allows retrying the details request", async () => {
    const user = userEvent.setup();
    const getDetails = vi
      .spyOn(jobOffersService, "getByCompanyAndId")
      .mockRejectedValueOnce({
        response: { data: { detail: "La vacante no existe o no pertenece a la empresa." } },
      })
      .mockRejectedValueOnce(new Error("Technical error"))
      .mockResolvedValueOnce(OFFERS[1]);

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));

    expect(
      await screen.findByText("La vacante no existe o no pertenece a la empresa."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(
      await screen.findByText("No se pudieron cargar los detalles de la vacante."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("TypeScript")).toBeInTheDocument();
    expect(getDetails).toHaveBeenCalledTimes(3);
  });

  it("renders empty optional fields and handles an extensive description", async () => {
    const user = userEvent.setup();
    const sparseOffer: JobOffer = {
      ...OFFERS[0],
      description: `Descripción extensa\n${"Texto ".repeat(500)}`,
      category: "",
      languages: "",
      locationUrl: "",
      salaryRange: "",
      skills: [],
    };
    vi.spyOn(jobOffersService, "getByCompanyAndId").mockResolvedValue(sparseOffer);

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Desarrolladora Frontend" }));

    expect(await screen.findAllByText("No especificado")).toHaveLength(4);
    expect(screen.queryByRole("link", { name: "Abrir ubicación" })).not.toBeInTheDocument();
    expect(screen.getByText("No se especificaron habilidades.")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" && element.textContent?.startsWith("Descripción extensa") === true,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar detalles de vacante" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("no convierte un destino de mapas con esquema inseguro en enlace", async () => {
    const user = userEvent.setup();
    vi.spyOn(jobOffersService, "getByCompanyAndId").mockResolvedValue({
      ...OFFERS[0],
      locationUrl: "javascript:alert(1)",
    });

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Desarrolladora Frontend" }));

    expect(await screen.findByText("Enlace no disponible")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Abrir ubicación" })).not.toBeInTheDocument();
  });
});
