import { type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { radarIntegrationApi, type CandidateRow, type Scores } from "@/modules/radar-chart/sprint2-integration/radar-integration-api";
import { EMPTY_AREA_EVIDENCE, type AreaEvidenceDetails } from "@/modules/radar-chart/sprint2/radar-area-details-dialog";
import MatchingPage from "./page";

vi.mock("@/modules/radar-chart/sprint2-integration/radar-integration-api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/modules/radar-chart/sprint2-integration/radar-integration-api")>();
  return { ...actual, radarIntegrationApi: { recruiterVacancies: vi.fn(), applicants: vi.fn(), applicantAreaEvidence: vi.fn() } };
});
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  RadarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PolarGrid: () => null, PolarAngleAxis: () => null, PolarRadiusAxis: () => null,
  Radar: ({ dot }: { dot?: boolean | ((props: { cx: number; cy: number; index: number }) => ReactNode) }) => typeof dot === "function" ? <svg>{dot({ cx: 20, cy: 20, index: 3 })}</svg> : null,
}));
const scores: Scores = { desarrollo: 0, "cloud-devops": 0, "data-ai": 0, qa: 1, ciberseguridad: 0, "gobernanza-ti": 0 };
const vacancies = [{ id: "job-1", title: "Vacante QA", companyId: "company" }, { id: "job-2", title: "Segunda vacante", companyId: "company" }];
const candidate: CandidateRow = { applicationId: "application-a", userId: "person-a", name: "Persona Alfa", headline: "Perfil Alfa", email: null, phone: null, appliedAt: "2026-10-26T12:00:00Z", state: "applied", canViewCv: false, version: 1, scores, evidence: {}, comparison: { match: 80, gaps: scores }, skills: ["Python"] };
const beta: CandidateRow = { ...candidate, applicationId: "application-b", userId: "person-b", name: "Persona Beta", headline: "Perfil Beta" };
const evidence: AreaEvidenceDetails = { ...EMPTY_AREA_EVIDENCE, tags: ["Evidencia de Alfa"] };
beforeEach(() => {
  vi.mocked(radarIntegrationApi.recruiterVacancies).mockResolvedValue(vacancies);
  vi.mocked(radarIntegrationApi.applicants).mockImplementation(async id => ({ vacancy: { id, title: vacancies.find(v => v.id === id)!.title, target: scores }, applicants: [candidate, beta] }));
  vi.mocked(radarIntegrationApi.applicantAreaEvidence).mockResolvedValue(evidence);
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("MatchingPage with authorized API data", () => {
  it("loads the candidates for the company's selected vacancy", async () => {
    render(<MatchingPage />);
    expect(screen.getByRole("heading", { name: "Postulantes por vacante" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Persona Alfa" })).toBeInTheDocument();
    expect(radarIntegrationApi.applicants).toHaveBeenCalledWith("job-1");
    expect(screen.getByText("Contacto no compartido", { exact: false })).toBeInTheDocument();
  });

  it("clears evidence when filtering changes the effective candidate, including on API failure", async () => {
    render(<MatchingPage />);
    await screen.findByRole("heading", { name: "Persona Alfa" });
    const search = screen.getByRole("searchbox", { name: "Buscar postulante" });
    fireEvent.click(screen.getByRole("button", { name: "Ver evidencias de QA" }));
    expect(await screen.findByText("Evidencia de Alfa")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "Beta" } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Evidencia de Alfa")).not.toBeInTheDocument();
    vi.mocked(radarIntegrationApi.applicantAreaEvidence).mockRejectedValueOnce(new Error("unavailable"));
    fireEvent.click(screen.getByRole("button", { name: "Ver evidencias de QA" }));
    await screen.findByRole("alert");
    expect(radarIntegrationApi.applicantAreaEvidence).toHaveBeenLastCalledWith("application-b", "qa");
    expect(screen.queryByText("Evidencia de Alfa")).not.toBeInTheDocument();
  });

  it("ignores late evidence from the previous candidate", async () => {
    let release!: (value: AreaEvidenceDetails) => void;
    vi.mocked(radarIntegrationApi.applicantAreaEvidence).mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
    render(<MatchingPage />);
    await screen.findByRole("heading", { name: "Persona Alfa" });
    const betaButton = screen.getByRole("button", { name: /Persona Beta/ });
    fireEvent.click(screen.getByRole("button", { name: "Ver evidencias de QA" }));
    await waitFor(() => expect(radarIntegrationApi.applicantAreaEvidence).toHaveBeenCalled());
    fireEvent.click(betaButton);
    await act(async () => { release(evidence); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Evidencia de Alfa")).not.toBeInTheDocument();
  });

  it("requests the newly selected vacancy", async () => {
    render(<MatchingPage />);
    await screen.findByRole("heading", { name: "Persona Alfa" });
    fireEvent.focus(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Segunda vacante" }));
    await waitFor(() => expect(radarIntegrationApi.applicants).toHaveBeenLastCalledWith("job-2"));
    expect(await screen.findByRole("heading", { name: "Postulantes · Segunda vacante" })).toBeInTheDocument();
  });

  it("does not fabricate candidates when a search has no results", async () => {
    render(<MatchingPage />);
    await screen.findByRole("heading", { name: "Persona Alfa" });
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar postulante" }), { target: { value: "missing" } });
    expect(screen.getByText("No se encontraron candidatos.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Persona Alfa" })).not.toBeInTheDocument();
  });
});