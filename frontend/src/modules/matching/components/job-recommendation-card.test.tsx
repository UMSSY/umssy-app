import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppliedJobOfferIds } from "../hooks/use-applied-job-offer-ids";
import { JobRecommendationCard } from "./job-recommendation-card";
import type { RecommendedJob } from "../types/recommended-job.types";

vi.mock("../hooks/use-applied-job-offer-ids", () => ({
  useAppliedJobOfferIds: vi.fn(() => new Set<string>()),
}));

const mockedUseAppliedJobOfferIds = vi.mocked(useAppliedJobOfferIds);

const job: RecommendedJob = {
  jobOfferId: "123",
  title: "Desarrollador Full Stack",
  companyName: "Empresa de prueba",
  modality: "Remoto",
  locationUrl: "https://maps.app.goo.gl/abc123",
  publishedAt: "2026-11-10T15:00:00.000Z",
  expiresAt: "2026-11-29T15:00:00.000Z",
  score: 85,
  matchedSkills: ["React", "TypeScript"],
  skills: ["React", "TypeScript", "PostgreSQL"],
};

describe("HU-02A T2.4 - JobRecommendationCard", () => {
  afterEach(() => {
    cleanup();
    mockedUseAppliedJobOfferIds.mockReturnValue(new Set<string>());
  });

  it("shows the job title, company and modality", () => {
    render(<JobRecommendationCard job={job} />);

    expect(
       screen.getByRole("heading", {
          level: 2,
          name: "Desarrollador Full Stack",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Empresa de prueba")).toBeInTheDocument();
    expect(screen.getByText("Remoto")).toBeInTheDocument();
  });

  it("shows the compatibility percentage", () => {
    render(<JobRecommendationCard job={job} />);

    expect(
      screen.getByText(/85%/),
    ).toBeInTheDocument();
  });

  it("shows matching and pending skills", () => {
    render(<JobRecommendationCard job={job} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("links to the existing vacancy detail route", () => {
    render(<JobRecommendationCard job={job} />);

    expect(
      screen.getByRole("link", { name: /Ver vacante/i }),
    ).toHaveAttribute("href", "/vacancies/recommended/123");
  });

  it("links to the location of the vacancy in a new tab", () => {
    render(<JobRecommendationCard job={job} />);

    const link = screen.getByRole("link", { name: /Ver ubicación/i });
    expect(link).toHaveAttribute("href", "https://maps.app.goo.gl/abc123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("hides the location link when the vacancy has no location", () => {
    render(<JobRecommendationCard job={{ ...job, locationUrl: undefined }} />);

    expect(screen.queryByRole("link", { name: /Ver ubicación/i })).not.toBeInTheDocument();
  });

  it("hides the location link when the link is not a Google Maps link", () => {
    render(
      <JobRecommendationCard
        job={{ ...job, locationUrl: "https://jobs.example.invalid/seed/1" }}
      />,
    );

    expect(screen.queryByRole("link", { name: /Ver ubicación/i })).not.toBeInTheDocument();
  });

  it("shows the label Coincide contigo when at least one skill matches", () => {
    render(<JobRecommendationCard job={job} />);

    expect(screen.getByText("Coincide contigo")).toBeInTheDocument();
  });

  it("hides the label Coincide contigo when no skill matches", () => {
    render(<JobRecommendationCard job={{ ...job, matchedSkills: [], score: 40 }} />);

    expect(screen.queryByText("Coincide contigo")).not.toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("shows the badge Alta afinidad from 70 percent", () => {
    render(<JobRecommendationCard job={{ ...job, score: 70 }} />);

    expect(screen.getByText("Alta afinidad")).toBeInTheDocument();
  });

  it("hides the badge Alta afinidad below 70 percent", () => {
    render(<JobRecommendationCard job={{ ...job, score: 69 }} />);

    expect(screen.queryByText("Alta afinidad")).not.toBeInTheDocument();
  });

  it("uses responsive layout classes", () => {
    const { container } = render(<JobRecommendationCard job={job} />);

    expect(
      container.querySelector(".sm\\:flex-row"),
    ).toHaveClass("flex-col", "sm:flex-row");
  });
  it("shows required skills instead of a match label when affinity is zero", () => {
    render(
      <JobRecommendationCard
        job={{
          ...job,
          score: 0,
          matchedSkills: [],
        }}
      />,
    );

    expect(screen.getByText("Habilidades requeridas")).toBeInTheDocument();
    expect(screen.queryByText("Coincide contigo")).not.toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("0% de afinidad")).toBeInTheDocument();
});

  it("shows the «Ya te postulaste» chip next to the title when the user applied", () => {
    mockedUseAppliedJobOfferIds.mockReturnValue(new Set(["123"]));
    render(<JobRecommendationCard job={job} />);

    expect(screen.getByText("Ya te postulaste")).toBeInTheDocument();
  });

  it("hides the «Ya te postulaste» chip when the user has not applied", () => {
    render(<JobRecommendationCard job={job} />);

    expect(screen.queryByText("Ya te postulaste")).not.toBeInTheDocument();
  });
});
