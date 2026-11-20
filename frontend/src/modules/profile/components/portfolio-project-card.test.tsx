import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PORTFOLIO_PROJECTS_MESSAGES } from "../constants/portfolio-projects.constants";
import type { PortfolioProjectItem } from "../types/portfolio-project.types";
import { PortfolioProjectCard } from "./portfolio-project-card";

describe("PortfolioProjectCard", () => {
  afterEach(() => {
    cleanup();
  });

  const baseProject: PortfolioProjectItem = {
    id: "proj-1",
    provider: "github",
    repoName: "umssy-app",
    repoUrl: "https://github.com/UMSSY/umssy-app",
    description: "Plataforma web para graduados de San Simón",
    language: "TypeScript",
    starsCount: 42,
    isOwner: true,
    displayOrder: 1,
  };

  it("renders project details with owner badge, language, and stars", () => {
    render(<PortfolioProjectCard project={baseProject} />);

    expect(screen.getByRole("heading", { level: 3, name: "umssy-app" })).toBeInTheDocument();
    expect(screen.getByText("Plataforma web para graduados de San Simón")).toBeInTheDocument();
    expect(screen.getByText(PORTFOLIO_PROJECTS_MESSAGES.publicBadge)).toBeInTheDocument();
    expect(screen.getByText(PORTFOLIO_PROJECTS_MESSAGES.ownerBadge)).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Ver en GitHub/i });
    expect(link).toHaveAttribute("href", "https://github.com/UMSSY/umssy-app");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders contributor badge and GitLab link for gitlab projects", () => {
    const gitlabProject: PortfolioProjectItem = {
      ...baseProject,
      provider: "gitlab",
      repoName: "data-pipeline",
      repoUrl: "https://gitlab.com/group/data-pipeline",
      isOwner: false,
      starsCount: 7,
    };

    render(<PortfolioProjectCard project={gitlabProject} />);

    expect(screen.getByRole("heading", { level: 3, name: "data-pipeline" })).toBeInTheDocument();
    expect(screen.getByText(PORTFOLIO_PROJECTS_MESSAGES.contributorBadge)).toBeInTheDocument();
    expect(screen.queryByText(PORTFOLIO_PROJECTS_MESSAGES.ownerBadge)).not.toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Ver en GitLab/i });
    expect(link).toHaveAttribute("href", "https://gitlab.com/group/data-pipeline");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("displays fallback description text when description is null or empty", () => {
    const projectWithoutDescription: PortfolioProjectItem = {
      ...baseProject,
      description: null,
      language: null,
    };

    render(<PortfolioProjectCard project={projectWithoutDescription} />);

    expect(screen.getByText(PORTFOLIO_PROJECTS_MESSAGES.noDescription)).toBeInTheDocument();
  });
});

