import { act, cleanup, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { JOB_MATCHING_QUERY_KEYS } from "../constants/job-matching.constants";
import { jobMatchingService } from "../services/job-matching.service";
import type { JobMatch } from "../types/job-matching.types";
import type { CategorizedJobRequirement } from "../types/requirement-category.types";
import { JobMatchDetailView } from "./job-match-detail-view";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../services/job-matching.service", () => ({
  jobMatchingService: { getRecommendations: vi.fn(), getJobMatch: vi.fn() },
}));

const JOB_ID = "11111111-1111-4111-8111-111111111111";
const NO_PENDING = "Para esta oportunidad no tienes habilidades ni requisitos pendientes";

function getGroup(title: string) {
  const heading = screen.getByRole("heading", { name: title, level: 4 });
  return within(heading.parentElement as HTMLElement);
}

function buildMatch(score: number, requirements: CategorizedJobRequirement[]): JobMatch {
  return {
    jobOfferId: JOB_ID,
    title: "Ingeniero DevOps",
    companyName: "Acme",
    modality: "Remoto",
    description: "Administra la infraestructura.",
    score,
    requirements,
    hasPendingRequirements: requirements.some(({ status }) => status === "Pendiente"),
  };
}

const WITH_GAPS = buildMatch(40, [
  { name: "Docker", status: "Cumple", category: "skill" },
  { name: "Kubernetes", status: "Pendiente", category: "skill" },
  { name: "Ingeniería de Sistemas", status: "Pendiente", category: "academic" },
  { name: "Carta de motivación", status: "Pendiente", category: "other" },
]);

const ZERO_GAP = buildMatch(100, [
  { name: "Docker", status: "Cumple", category: "skill" },
  { name: "Kubernetes", status: "Cumple", category: "skill" },
  { name: "Ingeniería de Sistemas", status: "Cumple", category: "academic" },
]);

describe("JobMatchDetailView: faltantes (T4.3)", () => {
  const getJobMatch = vi.mocked(jobMatchingService.getJobMatch);

  beforeEach(() => {
    getJobMatch.mockReset();
  });

  afterEach(cleanup);

  it("shows the zero-gap message when the profile meets every requirement (AC-04.4)", async () => {
    getJobMatch.mockResolvedValue(ZERO_GAP);

    render(<JobMatchDetailView jobOfferId={JOB_ID} />);

    expect(await screen.findByRole("status")).toHaveTextContent(NO_PENDING);
    expect(screen.queryByText("Falta")).not.toBeInTheDocument();
    expect(screen.getAllByText("Coincide")).toHaveLength(3);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("lists what is missing by group when there are gaps (AC-04.3, AC-04.5, AC-04.6)", async () => {
    getJobMatch.mockResolvedValue(WITH_GAPS);

    render(<JobMatchDetailView jobOfferId={JOB_ID} />);

    expect(await screen.findByText("Kubernetes")).toBeInTheDocument();
    expect(screen.queryByText(NO_PENDING)).not.toBeInTheDocument();

    const academic = getGroup("Académicos y experiencia");
    expect(academic.getByText("Ingeniería de Sistemas")).toBeInTheDocument();
    expect(academic.getByText("Falta")).toBeInTheDocument();

    const others = getGroup("Otros requisitos");
    expect(others.getByText("Carta de motivación")).toBeInTheDocument();
    expect(others.getByText("Falta")).toBeInTheDocument();
  });

  it("updates the missing list after the missing skill is added to the profile (AC-04.7)", async () => {
    getJobMatch.mockResolvedValueOnce(WITH_GAPS).mockResolvedValueOnce(ZERO_GAP);

    const { client } = render(<JobMatchDetailView jobOfferId={JOB_ID} />);

    expect(await screen.findByText("Kubernetes")).toBeInTheDocument();
    expect(screen.getAllByText("Falta")).toHaveLength(3);
    expect(screen.getByText("40%")).toBeInTheDocument();

    await act(async () => {
      await client.invalidateQueries({ queryKey: JOB_MATCHING_QUERY_KEYS.match(JOB_ID) });
    });

    expect(await screen.findByRole("status")).toHaveTextContent(NO_PENDING);
    expect(screen.queryByText("Falta")).not.toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(getJobMatch).toHaveBeenCalledTimes(2);
    expect(getJobMatch).toHaveBeenCalledWith(JOB_ID);
  });
});
