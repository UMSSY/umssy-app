import { AxiosError, type AxiosResponse } from "axios";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { jobOffersService } from "../services/job-offers.service";
import { buildSessionToken, COMPANY_ID } from "../testing/vacancy-fixtures";
import type { JobOfferApplicants } from "../types/job-offer-applicants.types";
import { JobOfferApplicantsView } from "./job-offer-applicants-view";

const APPLICANTS: JobOfferApplicants = {
  jobOfferId: "offer-1",
  jobTitle: "DevOps Senior",
  total: 2,
  applicants: [
    {
      id: "application-1",
      userId: "user-1",
      fullName: "Ana Rojas",
      email: "ana@umss.edu",
      headline: "Ingeniera de Sistemas",
      appliedAt: "2026-10-28T01:30:00.000Z",
      status: "En revisión",
    },
    {
      id: "application-2",
      userId: "user-2",
      fullName: "Luis Pérez",
      email: "luis@umss.edu",
      headline: null,
      appliedAt: "2026-10-20T15:00:00.000Z",
      status: "En revisión",
    },
  ],
};

describe("JobOfferApplicantsView", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_COMPANY_ID", COMPANY_ID);
    saveAccessToken(buildSessionToken("empresa"));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    clearAccessToken();
  });

  it("muestra los postulantes reales de la vacante con su total", async () => {
    const getApplicants = vi.spyOn(jobOffersService, "getApplicants").mockResolvedValue(APPLICANTS);
    renderWithQuery(<JobOfferApplicantsView jobOfferId="offer-1" />);

    expect(await screen.findByText("DevOps Senior · 2 postulantes")).toBeInTheDocument();
    expect(getApplicants).toHaveBeenCalledWith(COMPANY_ID, "offer-1");

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("Ana Rojas")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Ingeniera de Sistemas")).toBeInTheDocument();
    expect(within(rows[1]).getByRole("link", { name: "ana@umss.edu" })).toHaveAttribute(
      "href",
      "mailto:ana@umss.edu",
    );
    expect(within(rows[1]).getByText("27/10/2026")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Sin titular")).toBeInTheDocument();
  });

  it("indica cuando la vacante todavía no tiene postulantes", async () => {
    vi.spyOn(jobOffersService, "getApplicants").mockResolvedValue({
      ...APPLICANTS,
      total: 0,
      applicants: [],
    });
    renderWithQuery(<JobOfferApplicantsView jobOfferId="offer-1" />);

    expect(await screen.findByText("Aún no hay postulantes para esta vacante.")).toBeInTheDocument();
    expect(screen.getByText("DevOps Senior · 0 postulantes")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra un error con reintento y vuelve a consultar", async () => {
    const user = userEvent.setup();
    vi.spyOn(jobOffersService, "getApplicants")
      .mockRejectedValueOnce(new Error("HTTP 500"))
      .mockResolvedValueOnce(APPLICANTS);
    renderWithQuery(<JobOfferApplicantsView jobOfferId="offer-1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudieron cargar los postulantes. Inténtelo más tarde.",
    );
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Ana Rojas")).toBeInTheDocument();
  });

  it("si la vacante no es de la empresa lo indica sin ofrecer reintento", async () => {
    vi.spyOn(jobOffersService, "getApplicants").mockRejectedValue(
      new AxiosError("fail", "ERR_BAD_REQUEST", undefined, undefined, { status: 404, data: {} } as AxiosResponse),
    );
    renderWithQuery(<JobOfferApplicantsView jobOfferId="offer-1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La vacante no existe o no pertenece a tu empresa.",
    );
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("permite volver al listado de vacantes", async () => {
    vi.spyOn(jobOffersService, "getApplicants").mockResolvedValue(APPLICANTS);
    renderWithQuery(<JobOfferApplicantsView jobOfferId="offer-1" />);

    expect(screen.getByRole("link", { name: "Volver a mis vacantes" })).toHaveAttribute("href", "/recruiters");
  });
});
