import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { jobOffersService } from "../services/job-offers.service";
import type { JobOffer } from "../types/job-offer.types";
import { useCompanyJobOffers } from "../hooks/use-company-job-offers";
import { VacancyList } from "./vacancy-list";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
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

  it("abre el detalle con su encabezado y todos los campos de HU5", async () => {
    const user = userEvent.setup();
    const getDetails = vi
      .spyOn(jobOffersService, "getByCompanyAndId")
      .mockResolvedValue(OFFERS[1]);

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Detalle de Vacante" })).toBeInTheDocument();
    expect(await within(dialog).findByRole("heading", { name: "Ingeniero Backend" })).toBeInTheDocument();
    expect(getDetails).toHaveBeenCalledWith(COMPANY_ID, "offer-2");
    expect(within(dialog).getByText("Sistemas")).toBeInTheDocument();
    expect(within(dialog).getByText("Híbrido")).toBeInTheDocument();
    expect(within(dialog).getByText("Pasantía")).toBeInTheDocument();
    expect(within(dialog).getByText("2 vacantes")).toBeInTheDocument();
    expect(within(dialog).getByText("A convenir")).toBeInTheDocument();
    expect(within(dialog).getByText("Español, Inglés")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Abrir ubicación" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(within(dialog).getByText("Backend")).toBeInTheDocument();
    expect(within(dialog).getByText("TypeScript")).toBeInTheDocument();
    expect(within(dialog).getByText("PostgreSQL")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("cierra el detalle con el botón Cerrar del pie", async () => {
    const user = userEvent.setup();
    vi.spyOn(jobOffersService, "getByCompanyAndId").mockResolvedValue(OFFERS[1]);

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));
    await screen.findByText("TypeScript");

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
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

  it("si el detalle no se puede cargar avisa con una notificación y no deja el pop-up abierto", async () => {
    const user = userEvent.setup();
    vi.spyOn(jobOffersService, "getByCompanyAndId").mockRejectedValueOnce({
      response: { data: { detail: "La vacante no existe o no pertenece a la empresa." } },
    });

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("La vacante no existe o no pertenece a la empresa.", {
        position: "top-center",
        duration: 5000,
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Ingeniero Backend" })).toBeInTheDocument();
  });

  it("usa un mensaje genérico si el servidor no explica el error", async () => {
    const user = userEvent.setup();
    vi.spyOn(jobOffersService, "getByCompanyAndId").mockRejectedValueOnce(new Error("Technical error"));

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No se pudo cargar la información de la vacante.", {
        position: "top-center",
        duration: 5000,
      }),
    );
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
  it("mantener Tab presionado no saca el foco del detalle ni abre otro diálogo", async () => {
    const user = userEvent.setup();
    vi.spyOn(jobOffersService, "getByCompanyAndId").mockResolvedValue(OFFERS[1]);

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText("TypeScript");

    for (let press = 0; press < 25; press += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Enter}");

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("no abre la confirmación de eliminar mientras el detalle está abierto", async () => {
    const user = userEvent.setup();
    vi.spyOn(jobOffersService, "getByCompanyAndId").mockResolvedValue(OFFERS[1]);

    renderWithQuery(<VacancyList />);
    await user.click(screen.getByRole("button", { name: "Ingeniero Backend" }));
    await screen.findByText("TypeScript");

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar vacante Ingeniero Backend", hidden: true }),
    );

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.queryByText("¿Estás seguro de eliminar esta vacante?")).not.toBeInTheDocument();
  });
});
