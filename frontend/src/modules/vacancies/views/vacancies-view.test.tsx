import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JOB_OFFER_FIXTURE } from "../testing/job-offer-fixture";
import { VacanciesView } from "./vacancies-view";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock("../services/vacancies.service", () => ({ vacanciesService: { list: vi.fn(async () => [JOB_OFFER_FIXTURE]) } }));
vi.mock("@/modules/radar-chart/services/radar-integration.service", () => ({ radarIntegrationApi: { applications: vi.fn().mockResolvedValue([]) } }));
afterEach(cleanup);

describe("VacanciesView from the API", () => {
  it("recovers the list when a search is cleared", async () => {
    render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><VacanciesView /></QueryClientProvider>);
    await screen.findByRole("heading", { name: JOB_OFFER_FIXTURE.title });
    const search = screen.getByRole("searchbox", { name: "Buscar cargo, empresa o tecnología" });
    fireEvent.change(search, { target: { value: "no-match" } });
    expect(screen.getByText("No hay vacantes publicadas que coincidan con tu búsqueda.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Detalles y postulación" })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Detalles y postulación" })).toBeInTheDocument();
  });
});