import "@/shared/testing/indexed-db.mock";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jobApplicationService } from "@/modules/matching/services/job-application.service";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { vacanciesService } from "../services/vacancies.service";
import { buildVacancy } from "../testing/vacancy-fixtures";
import { VacanciesView } from "./vacancies-view";

vi.mock("@/modules/matching/hooks/use-applied-job-offer-ids", () => ({
  useAppliedJobOfferIds: vi.fn(() => new Set<string>()),
}));

vi.mock("../services/vacancies.service", () => ({
  vacanciesService: { listPublished: vi.fn() },
}));

vi.mock("@/modules/matching/services/job-application.service", () => ({
  jobApplicationService: { apply: vi.fn(), getMine: vi.fn() },
}));

const listPublished = vi.mocked(vacanciesService.listPublished);
const getMine = vi.mocked(jobApplicationService.getMine);

beforeEach(() => {
  vi.clearAllMocks();
  getMine.mockResolvedValue({ hasApplied: false, application: null });
});

afterEach(cleanup);

describe("VacanciesView - fechas de las vacantes", () => {
  it("muestra en cada tarjeta la fecha de publicación y la de expiración", async () => {
    listPublished.mockResolvedValue([
      buildVacancy({ publishedAt: "2026-11-10T15:00:00.000Z", expiresAt: "2026-11-29T15:00:00.000Z" }),
    ]);
    renderWithQuery(<VacanciesView />);

    const dates = within(await screen.findByRole("list", { name: "Fechas de la vacante" }));

    expect(dates.getByText("Publicado: 10/11/2026")).toBeInTheDocument();
    expect(dates.getByText("Expira: 29/11/2026")).toBeInTheDocument();
  });

  it("no muestra la expiración de una vacante que no vence", async () => {
    listPublished.mockResolvedValue([buildVacancy({ expiresAt: null })]);
    renderWithQuery(<VacanciesView />);

    await screen.findByRole("list", { name: "Fechas de la vacante" });

    expect(screen.queryByText(/Expira:/)).toBeNull();
  });

  it("usa la misma tarjeta con borde azul al pasar el puntero o enfocar", async () => {
    listPublished.mockResolvedValue([buildVacancy()]);
    renderWithQuery(<VacanciesView />);

    const card = (await screen.findByRole("link", { name: /^Ver detalles de / })).closest("article");

    expect(card).toHaveClass("hover:border-availability-border", "focus-within:border-availability-border");
  });
});
