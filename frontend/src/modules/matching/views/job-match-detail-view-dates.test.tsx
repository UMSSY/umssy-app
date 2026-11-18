import { cleanup, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { jobMatchingService } from "../services/job-matching.service";
import type { JobMatch } from "../types/job-match.types";
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

const MATCH: JobMatch = {
  jobOfferId: JOB_ID,
  title: "Ingeniero DevOps",
  companyName: "Acme",
  modality: "Remoto",
  description: "Administra la infraestructura.",
  publishedAt: "2026-11-10T15:00:00.000Z",
  expiresAt: "2026-11-29T15:00:00.000Z",
  score: 40,
  requirements: [{ name: "Docker", status: "Cumple", category: "skill" }],
  hasPendingRequirements: false,
};

describe("JobMatchDetailView - fechas de la vacante", () => {
  const getJobMatch = vi.mocked(jobMatchingService.getJobMatch);

  beforeEach(() => {
    getJobMatch.mockReset();
  });

  afterEach(cleanup);

  it("muestra la fecha de publicación y la de expiración de la vacante", async () => {
    getJobMatch.mockResolvedValue(MATCH);

    render(<JobMatchDetailView jobOfferId={JOB_ID} />);

    expect(await screen.findByText("Publicado: 10/11/2026")).toBeInTheDocument();
    expect(screen.getByText("Expira: 29/11/2026")).toBeInTheDocument();
  });

  it("no muestra la expiración cuando la vacante no vence", async () => {
    getJobMatch.mockResolvedValue({ ...MATCH, expiresAt: null });

    render(<JobMatchDetailView jobOfferId={JOB_ID} />);

    expect(await screen.findByText("Publicado: 10/11/2026")).toBeInTheDocument();
    expect(screen.queryByText(/Expira:/)).toBeNull();
  });
});
