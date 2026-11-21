import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_PORTFOLIO_PROJECTS,
  PORTFOLIO_PROJECTS_MESSAGES,
} from "../constants/portfolio-projects.constants";
import { portfolioProjectsService } from "../services/portfolio-projects.service";
import type { PortfolioProjectItem } from "../types/portfolio-project.types";
import { PortfolioProfileSection } from "./portfolio-profile-section";

vi.mock("../services/portfolio-projects.service", () => ({
  portfolioProjectsService: {
    getPortfolioProjects: vi.fn(),
    updatePortfolioProjects: vi.fn(),
    getAvailableRepositories: vi.fn(),
    syncPortfolioProjects: vi.fn(),
  },
}));

describe("PortfolioProfileSection", () => {
  beforeEach(() => {
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValue([]);
    vi.mocked(
      portfolioProjectsService.getAvailableRepositories,
    ).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const createProject = (
    id: string,
    order: number,
    name = `repo-${id}`,
  ): PortfolioProjectItem => ({
    id,
    provider: "github",
    repoName: name,
    repoUrl: `https://github.com/user/${name}`,
    description: `Description for ${name}`,
    language: "TypeScript",
    starsCount: 10,
    isOwner: true,
    displayOrder: order,
  });

  it("renders empty state with 0/6 counter and add project button (CA-10)", async () => {
    const handleAddClick = vi.fn();
    render(<PortfolioProfileSection onAddProjectClick={handleAddClick} />);

    expect(await screen.findByText(PORTFOLIO_PROJECTS_MESSAGES.title)).toBeInTheDocument();
    expect(await screen.findByText(PORTFOLIO_PROJECTS_MESSAGES.empty)).toBeInTheDocument();
    expect(screen.getByText("0/6")).toBeInTheDocument();

    const addButton = screen.getByRole("button", { name: /Añadir proyecto/i });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(handleAddClick).toHaveBeenCalledTimes(1);
  });

  it("renders loading state while projects are requested", () => {
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockImplementationOnce(
      () => new Promise(() => {}),
    );

    render(<PortfolioProfileSection />);

    expect(screen.getByRole("status")).toHaveTextContent(PORTFOLIO_PROJECTS_MESSAGES.loading);
  });

  it("renders error state with retry option when request fails (CA-10)", async () => {
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockRejectedValueOnce(
      new Error("Network Error"),
    );

    render(<PortfolioProfileSection />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      PORTFOLIO_PROJECTS_MESSAGES.loadError,
    );

    const retryButton = screen.getByRole("button", { name: PORTFOLIO_PROJECTS_MESSAGES.retry });
    expect(retryButton).toBeInTheDocument();

    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValueOnce([
      createProject("1", 1, "retry-success"),
    ]);

    fireEvent.click(retryButton);

    expect(await screen.findByText("retry-success")).toBeInTheDocument();
  });

  it("renders projects sorted by displayOrder ascending and updates badge counter (CA-6, CA-10)", async () => {
    const projects: PortfolioProjectItem[] = [
      createProject("3", 3, "project-three"),
      createProject("1", 1, "project-one"),
      createProject("2", 2, "project-two"),
    ];
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValue(projects);

    render(<PortfolioProfileSection />);

    expect(await screen.findByText("3/6")).toBeInTheDocument();

    const headings = screen.getAllByRole("heading", { level: 3 });
    const renderedNames = headings.map((h) => h.textContent);
    expect(renderedNames).toEqual(["project-one", "project-two", "project-three"]);
  });

  it("limits the rendered cards to maximum 6 even if API returns more (CA-6, Validación 7)", async () => {
    const eightProjects: PortfolioProjectItem[] = Array.from({ length: 8 }, (_, index) =>
      createProject(String(index + 1), index + 1, `project-${index + 1}`),
    );
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValue(eightProjects);

    render(<PortfolioProfileSection />);

    expect(await screen.findByText(`6/${MAX_PORTFOLIO_PROJECTS}`)).toBeInTheDocument();

    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards).toHaveLength(6);
    expect(screen.queryByText("project-7")).not.toBeInTheDocument();
    expect(screen.queryByText("project-8")).not.toBeInTheDocument();
  });

  it("opens the selection modal when clicking add project button", async () => {
    vi.mocked(
      portfolioProjectsService.getAvailableRepositories,
    ).mockResolvedValue([]);

    render(<PortfolioProfileSection />);

    const addButton = await screen.findByRole("button", {
      name: /Añadir proyecto/i,
    });
    fireEvent.click(addButton);

    expect(
      await screen.findByRole("heading", {
        name: /Seleccionar proyectos de portafolio/i,
      }),
    ).toBeInTheDocument();
  });

  it("does not render synchronize button when projects list is empty", async () => {
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValue([]);

    render(<PortfolioProfileSection />);

    await screen.findByText(PORTFOLIO_PROJECTS_MESSAGES.empty);

    expect(
      screen.queryByRole("button", { name: "Sincronizar" }),
    ).not.toBeInTheDocument();
  });

  it("renders synchronize button when projects are present and calls sync service", async () => {
    const projects: PortfolioProjectItem[] = [
      createProject("1", 0, "project-sync-test"),
    ];
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValue(projects);
    vi.mocked(portfolioProjectsService.syncPortfolioProjects).mockResolvedValue(projects);

    render(<PortfolioProfileSection />);

    const syncButton = await screen.findByRole("button", { name: "Sincronizar" });
    expect(syncButton).toBeInTheDocument();

    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(portfolioProjectsService.syncPortfolioProjects).toHaveBeenCalledTimes(1);
    });
  });

  it("displays error banner on sync failure without hiding or discarding existing cards", async () => {
    const projects: PortfolioProjectItem[] = [
      createProject("1", 0, "project-persistent-card"),
    ];
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValue(projects);
    vi.mocked(portfolioProjectsService.syncPortfolioProjects).mockRejectedValueOnce(
      new Error("Sync network error"),
    );

    render(<PortfolioProfileSection />);

    const syncButton = await screen.findByRole("button", { name: "Sincronizar" });
    fireEvent.click(syncButton);

    expect(
      await screen.findByText(PORTFOLIO_PROJECTS_MESSAGES.syncError),
    ).toBeInTheDocument();

    expect(screen.getByText("project-persistent-card")).toBeInTheDocument();

    const discardButton = screen.getByRole("button", { name: "Descartar" });
    fireEvent.click(discardButton);

    expect(
      screen.queryByText(PORTFOLIO_PROJECTS_MESSAGES.syncError),
    ).not.toBeInTheDocument();
    expect(screen.getByText("project-persistent-card")).toBeInTheDocument();
  });
});
