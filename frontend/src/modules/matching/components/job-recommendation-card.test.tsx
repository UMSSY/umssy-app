import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JobRecommendationCard } from "./job-recommendation-card";
import type { RecommendedJob } from "../types/job-matching.types";

const job: RecommendedJob = {
  jobOfferId: "123",
  title: "Desarrollador Full Stack",
  companyName: "Empresa de prueba",
  modality: "Remoto",
  locationUrl: "https://maps.google.com/?q=cochabamba",
  score: 85,
  matchedSkills: ["React", "TypeScript"],
  skills: ["React", "TypeScript", "PostgreSQL"],
};

describe("HU-02A T2.4 - JobRecommendationCard", () => {
  afterEach(cleanup);

  it("shows the job title, company and modality", () => {
    render(<JobRecommendationCard job={job} />);

    expect(
       screen.getByRole("heading", {
          level: 2,
          name: "Desarrollador Full Stack",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Empresa de prueba.*Remoto/),
    ).toBeInTheDocument();
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
    expect(link).toHaveAttribute("href", "https://maps.google.com/?q=cochabamba");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("hides the location link when the vacancy has no location", () => {
    render(<JobRecommendationCard job={{ ...job, locationUrl: undefined }} />);

    expect(screen.queryByRole("link", { name: /Ver ubicación/i })).not.toBeInTheDocument();
  });

  it("uses responsive layout classes", () => {
    const { container } = render(<JobRecommendationCard job={job} />);

    expect(
      container.querySelector(".sm\\:flex-row"),
    ).toHaveClass("flex-col", "sm:flex-row");
  });
});
