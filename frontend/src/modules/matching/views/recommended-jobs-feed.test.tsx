import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecommendedJobs } from "../hooks/use-recommended-jobs";
import type { RecommendedJob } from "../types/job-matching.types";
import { RecommendedJobsView } from "./recommended-jobs-view";

vi.mock("../hooks/use-recommended-jobs", () => ({
  useRecommendedJobs: vi.fn(),
}));

const mockedUseRecommendedJobs = vi.mocked(useRecommendedJobs);

const JOBS: RecommendedJob[] = [
  { jobOfferId: "devops", title: "DevOps Senior", companyName: "TechBolivia", modality: "Remoto", score: 92, matchedSkills: ["Docker"], skills: ["Docker", "Terraform"] },
  { jobOfferId: "backend", title: "Backend Developer", companyName: "Sofía Corp", modality: "Híbrido", score: 77, matchedSkills: ["Node.js"], skills: ["Node.js", "Redis"] },
  { jobOfferId: "qa", title: "QA Automation Engineer", companyName: "Quantex", modality: "Híbrido", score: 68, matchedSkills: ["Cypress"], skills: ["Cypress", "Selenium"] },
  { jobOfferId: "data", title: "Data Analyst Jr.", companyName: "Sofía Corp", modality: "Presencial", score: 41, matchedSkills: ["SQL"], skills: ["SQL", "Power BI"] },
];

function renderFeed(items: RecommendedJob[] = JOBS) {
  mockedUseRecommendedJobs.mockReturnValue({
    data: { isProfileComplete: true, items },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useRecommendedJobs>);

  return render(<RecommendedJobsView />);
}

function visibleTitles(): string[] {
  return screen.getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent ?? "")
    .filter((title) => title !== "Vacantes recomendadas para ti");
}

describe("HU-06 T6.2 - Feed de vacantes ordenado por afinidad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("AC-06.1: keeps the affinity order received from the backend", () => {
    renderFeed();

    expect(visibleTitles()).toEqual([
      "DevOps Senior",
      "Backend Developer",
      "QA Automation Engineer",
      "Data Analyst Jr.",
    ]);
    expect(screen.getByText(/4 vacantes · ordenadas de mayor a menor afinidad/)).toBeInTheDocument();
  });

  it("AC-06.3: shows each score as an integer with \"% de afinidad\"", () => {
    renderFeed();

    const cards = screen.getAllByRole("listitem").filter((item) => within(item).queryByRole("heading"));
    expect(within(cards[0]).getByText("92% de afinidad")).toBeInTheDocument();
    expect(within(cards[3]).getByText("41% de afinidad")).toBeInTheDocument();
  });

  it("AC-06.4: explains that affinity is a guide and not a hiring guarantee", () => {
    renderFeed();

    expect(screen.getByText("¿Qué es la afinidad?")).toBeInTheDocument();
    expect(screen.getByText(/es una guía para priorizar, no una garantía de contratación/)).toBeInTheDocument();
  });

  it("AC-06.5: filters by search text and keeps the order", () => {
    renderFeed();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar vacante o empresa" }), {
      target: { value: "sofia" },
    });

    expect(visibleTitles()).toEqual(["Backend Developer", "Data Analyst Jr."]);
    expect(screen.getByText(/2 vacantes ·/)).toBeInTheDocument();
  });

  it("AC-06.5: filters by modality", () => {
    renderFeed();

    fireEvent.change(screen.getByRole("combobox", { name: "Modalidad" }), {
      target: { value: "Híbrido" },
    });

    expect(visibleTitles()).toEqual(["Backend Developer", "QA Automation Engineer"]);
  });

  it("AC-06.5: shows only high affinity jobs when the option is checked", () => {
    renderFeed();

    fireEvent.click(screen.getByRole("checkbox", { name: "Solo alta afinidad" }));

    expect(visibleTitles()).toEqual(["DevOps Senior", "Backend Developer"]);
  });

  it("AC-06.5: shows a message when no job matches and Limpiar restores the list", () => {
    renderFeed();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar vacante o empresa" }), {
      target: { value: "cobol" },
    });

    expect(screen.getByText("Ninguna vacante coincide con tus filtros")).toBeInTheDocument();
    expect(visibleTitles()).toEqual([]);

    fireEvent.click(screen.getAllByRole("button", { name: "Limpiar" })[0]);

    expect(visibleTitles()).toHaveLength(4);
    expect(screen.getByRole("searchbox", { name: "Buscar vacante o empresa" })).toHaveValue("");
  });

  it("disables Limpiar while there is no active filter", () => {
    renderFeed();

    expect(screen.getByRole("button", { name: "Limpiar" })).toBeDisabled();
  });
});
