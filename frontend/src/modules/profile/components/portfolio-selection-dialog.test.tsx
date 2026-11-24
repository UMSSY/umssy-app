import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PORTFOLIO_SELECTION_MESSAGES,
} from "../constants/portfolio-projects.constants";
import { portfolioProjectsService } from "../services/portfolio-projects.service";
import type {
  ExternalRepositoryItem,
  PortfolioProjectItem,
} from "../types/portfolio-project.types";
import { PortfolioSelectionDialog } from "./portfolio-selection-dialog";

vi.mock("../services/portfolio-projects.service", () => ({
  portfolioProjectsService: {
    getPortfolioProjects: vi.fn(),
    updatePortfolioProjects: vi.fn(),
    getAvailableRepositories: vi.fn(),
  },
}));

describe("PortfolioSelectionDialog", () => {
  const mockRepos: ExternalRepositoryItem[] = [
    {
      provider: "github",
      repoName: "react-core",
      repoUrl: "https://github.com/facebook/react-core",
      description: "React library for UI",
      language: "JavaScript",
      starsCount: 200000,
      isOwner: false,
    },
    {
      provider: "github",
      repoName: "umssy-mobile",
      repoUrl: "https://github.com/user/umssy-mobile",
      description: "Aplicación móvil UMSSY",
      language: "TypeScript",
      starsCount: 15,
      isOwner: true,
    },
    {
      provider: "gitlab",
      repoName: "ci-pipeline",
      repoUrl: "https://gitlab.com/group/ci-pipeline",
      description: "Pipeline automation scripts",
      language: "Python",
      starsCount: 8,
      isOwner: true,
    },
    {
      provider: "gitlab",
      repoName: "data-analysis",
      repoUrl: "https://gitlab.com/group/data-analysis",
      description: null,
      language: null,
      starsCount: 5,
      isOwner: false,
    },
  ];

  beforeEach(() => {
    vi.mocked(
      portfolioProjectsService.getAvailableRepositories,
    ).mockResolvedValue(mockRepos);
    vi.mocked(
      portfolioProjectsService.updatePortfolioProjects,
    ).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders dialog header, controls, and fetches repositories when open", async () => {
    render(<PortfolioSelectionDialog open={true} onOpenChange={vi.fn()} />);

    expect(
      screen.getByText(PORTFOLIO_SELECTION_MESSAGES.dialogTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(PORTFOLIO_SELECTION_MESSAGES.dialogSubtitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: PORTFOLIO_SELECTION_MESSAGES.filterAll,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: new RegExp(PORTFOLIO_SELECTION_MESSAGES.filterGithub, "i"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: new RegExp(PORTFOLIO_SELECTION_MESSAGES.filterGitlab, "i"),
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText("react-core")).toBeInTheDocument();
    expect(screen.getByText("umssy-mobile")).toBeInTheDocument();
    expect(screen.getByText("ci-pipeline")).toBeInTheDocument();
    expect(screen.getByText("data-analysis")).toBeInTheDocument();
  });

  it("pre-selects currently saved projects from GitHub and GitLab (CA-10)", async () => {
    const currentProjects: PortfolioProjectItem[] = [
      {
        id: "p1",
        provider: "github",
        repoName: "react-core",
        repoUrl: "https://github.com/facebook/react-core",
        description: "React library for UI",
        language: "JavaScript",
        starsCount: 200000,
        isOwner: false,
        displayOrder: 1,
      },
      {
        id: "p2",
        provider: "gitlab",
        repoName: "ci-pipeline",
        repoUrl: "https://gitlab.com/group/ci-pipeline",
        description: "Pipeline automation scripts",
        language: "Python",
        starsCount: 8,
        isOwner: true,
        displayOrder: 2,
      },
    ];

    render(
      <PortfolioSelectionDialog
        open={true}
        onOpenChange={vi.fn()}
        currentProjects={currentProjects}
      />,
    );

    expect(await screen.findByText("react-core")).toBeInTheDocument();
    expect(screen.getByText("2 / 6 seleccionados")).toBeInTheDocument();

    const reactCheckbox = screen.getByRole("checkbox", {
      name: "Seleccionar react-core",
    });
    const ciCheckbox = screen.getByRole("checkbox", {
      name: "Seleccionar ci-pipeline",
    });
    const mobileCheckbox = screen.getByRole("checkbox", {
      name: "Seleccionar umssy-mobile",
    });

    expect(reactCheckbox).toBeChecked();
    expect(ciCheckbox).toBeChecked();
    expect(mobileCheckbox).not.toBeChecked();
  });

  it("filters repositories by provider (Todos, GitHub, GitLab)", async () => {
    render(<PortfolioSelectionDialog open={true} onOpenChange={vi.fn()} />);

    expect(await screen.findByText("react-core")).toBeInTheDocument();
    expect(screen.getByText("ci-pipeline")).toBeInTheDocument();

    const githubFilterButton = screen.getByRole("button", {
      name: new RegExp(PORTFOLIO_SELECTION_MESSAGES.filterGithub, "i"),
    });
    fireEvent.click(githubFilterButton);

    expect(screen.getByText("react-core")).toBeInTheDocument();
    expect(screen.getByText("umssy-mobile")).toBeInTheDocument();
    expect(screen.queryByText("ci-pipeline")).not.toBeInTheDocument();
    expect(screen.queryByText("data-analysis")).not.toBeInTheDocument();

    const gitlabFilterButton = screen.getByRole("button", {
      name: new RegExp(PORTFOLIO_SELECTION_MESSAGES.filterGitlab, "i"),
    });
    fireEvent.click(gitlabFilterButton);

    expect(screen.queryByText("react-core")).not.toBeInTheDocument();
    expect(screen.queryByText("umssy-mobile")).not.toBeInTheDocument();
    expect(screen.getByText("ci-pipeline")).toBeInTheDocument();
    expect(screen.getByText("data-analysis")).toBeInTheDocument();

    const allFilterButton = screen.getByRole("button", {
      name: PORTFOLIO_SELECTION_MESSAGES.filterAll,
    });
    fireEvent.click(allFilterButton);

    expect(screen.getByText("react-core")).toBeInTheDocument();
    expect(screen.getByText("ci-pipeline")).toBeInTheDocument();
  });

  it("filters repositories by real-time text search across name, description, and language", async () => {
    render(<PortfolioSelectionDialog open={true} onOpenChange={vi.fn()} />);

    expect(await screen.findByText("react-core")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      PORTFOLIO_SELECTION_MESSAGES.searchPlaceholder,
    );

    fireEvent.change(searchInput, { target: { value: "móvil" } });
    expect(screen.getByText("umssy-mobile")).toBeInTheDocument();
    expect(screen.queryByText("react-core")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "typescript" } });
    expect(screen.getByText("umssy-mobile")).toBeInTheDocument();
    expect(screen.queryByText("ci-pipeline")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "inexistente" } });
    expect(
      screen.getByText(PORTFOLIO_SELECTION_MESSAGES.noSearchResults),
    ).toBeInTheDocument();
  });

  it("enforces strict limit of 6 selected projects and disables unselected checkboxes (CA-4, CA-5)", async () => {
    const sixMockRepos: ExternalRepositoryItem[] = Array.from(
      { length: 7 },
      (_, i) => ({
        provider: i % 2 === 0 ? "github" : "gitlab",
        repoName: `repo-${i + 1}`,
        repoUrl: `https://example.com/repo-${i + 1}`,
        description: `Description ${i + 1}`,
        language: "TypeScript",
        starsCount: i,
        isOwner: true,
      }),
    );
    vi.mocked(
      portfolioProjectsService.getAvailableRepositories,
    ).mockResolvedValueOnce(sixMockRepos);

    render(<PortfolioSelectionDialog open={true} onOpenChange={vi.fn()} />);

    expect(await screen.findByText("repo-1")).toBeInTheDocument();

    for (let i = 1; i <= 6; i++) {
      const checkbox = screen.getByRole("checkbox", {
        name: `Seleccionar repo-${i}`,
      });
      fireEvent.click(checkbox);
    }

    expect(screen.getByText("6 / 6 seleccionados")).toBeInTheDocument();
    expect(
      screen.getByText(PORTFOLIO_SELECTION_MESSAGES.maxLimitReached),
    ).toBeInTheDocument();

    const repo7Checkbox = screen.getByRole("checkbox", {
      name: "Seleccionar repo-7",
    });
    expect(repo7Checkbox).toHaveAttribute("aria-disabled", "true");

    const repo1Checkbox = screen.getByRole("checkbox", {
      name: "Seleccionar repo-1",
    });
    expect(repo1Checkbox).not.toHaveAttribute("aria-disabled", "true");
    fireEvent.click(repo1Checkbox);

    expect(screen.getByText("5 / 6 seleccionados")).toBeInTheDocument();
    expect(
      screen.queryByText(PORTFOLIO_SELECTION_MESSAGES.maxLimitReached),
    ).not.toBeInTheDocument();
    expect(repo7Checkbox).not.toHaveAttribute("aria-disabled", "true");
  });

  it("saves selected projects with PUT request and closes dialog on success (CA-6)", async () => {
    const handleOpenChange = vi.fn();
    render(
      <PortfolioSelectionDialog open={true} onOpenChange={handleOpenChange} />,
    );

    expect(await screen.findByText("react-core")).toBeInTheDocument();

    const reactCheckbox = screen.getByRole("checkbox", {
      name: "Seleccionar react-core",
    });
    fireEvent.click(reactCheckbox);

    const saveButton = screen.getByRole("button", {
      name: "Guardar proyectos (1)",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        portfolioProjectsService.updatePortfolioProjects,
      ).toHaveBeenCalledWith({
        projects: [
          {
            provider: "github",
            repoName: "react-core",
            repoUrl: "https://github.com/facebook/react-core",
            description: "React library for UI",
            language: "JavaScript",
            starsCount: 200000,
            isOwner: false,
          },
        ],
      });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("handles save error by keeping dialog open and displaying error message (Validación 6)", async () => {
    vi.mocked(
      portfolioProjectsService.updatePortfolioProjects,
    ).mockRejectedValueOnce(new Error("Server Error"));

    const handleOpenChange = vi.fn();
    render(
      <PortfolioSelectionDialog open={true} onOpenChange={handleOpenChange} />,
    );

    expect(await screen.findByText("react-core")).toBeInTheDocument();

    const reactCheckbox = screen.getByRole("checkbox", {
      name: "Seleccionar react-core",
    });
    fireEvent.click(reactCheckbox);

    const saveButton = screen.getByRole("button", {
      name: "Guardar proyectos (1)",
    });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText(PORTFOLIO_SELECTION_MESSAGES.saveError),
    ).toBeInTheDocument();
    expect(handleOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("closes without saving when cancel button is clicked", async () => {
    const handleOpenChange = vi.fn();
    render(
      <PortfolioSelectionDialog open={true} onOpenChange={handleOpenChange} />,
    );

    const cancelButton = screen.getByRole("button", {
      name: PORTFOLIO_SELECTION_MESSAGES.cancel,
    });
    fireEvent.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(
      portfolioProjectsService.updatePortfolioProjects,
    ).not.toHaveBeenCalled();
  });

  it("shows loading state while repositories are being requested", () => {
    vi.mocked(
      portfolioProjectsService.getAvailableRepositories,
    ).mockImplementationOnce(() => new Promise(() => {}));

    render(<PortfolioSelectionDialog open={true} onOpenChange={vi.fn()} />);

    expect(
      screen.getByText(PORTFOLIO_SELECTION_MESSAGES.loadingRepos),
    ).toBeInTheDocument();
  });

  it("shows error state with retry button when repository fetch fails", async () => {
    vi.mocked(
      portfolioProjectsService.getAvailableRepositories,
    ).mockRejectedValueOnce(new Error("Network failed"));

    render(<PortfolioSelectionDialog open={true} onOpenChange={vi.fn()} />);

    expect(
      await screen.findByText(PORTFOLIO_SELECTION_MESSAGES.loadReposError),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole("button", {
      name: PORTFOLIO_SELECTION_MESSAGES.retry,
    });
    vi.mocked(
      portfolioProjectsService.getAvailableRepositories,
    ).mockResolvedValueOnce(mockRepos);

    fireEvent.click(retryButton);

    expect(await screen.findByText("react-core")).toBeInTheDocument();
  });

  it("shows empty state when no repositories are returned from accounts", async () => {
    vi.mocked(
      portfolioProjectsService.getAvailableRepositories,
    ).mockResolvedValueOnce([]);

    render(<PortfolioSelectionDialog open={true} onOpenChange={vi.fn()} />);

    expect(
      await screen.findByText(PORTFOLIO_SELECTION_MESSAGES.emptyRepos),
    ).toBeInTheDocument();
  });
});

