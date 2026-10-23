import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecommendedJobsView } from "./recommended-jobs-view";
import { useRecommendedJobs } from "../hooks/use-recommended-jobs";

vi.mock("../hooks/use-recommended-jobs", () => ({
  useRecommendedJobs: vi.fn(),
}));

const mockedUseRecommendedJobs = vi.mocked(useRecommendedJobs);

const refetch = vi.fn();

function setQueryState(state: {
  data?: {
    isProfileComplete: boolean;
    items: Array<{
      jobOfferId: string;
      title: string;
      companyName: string;
      modality: string;
      score: number;
      matchedSkills: string[];
      skills: string[];
    }>;
  };
  isPending?: boolean;
  isError?: boolean;
}) {
    mockedUseRecommendedJobs.mockReturnValue({
    data: state.data,
    isPending: state.isPending ?? false,
    isError: state.isError ?? false,
    refetch,
  } as unknown as ReturnType<typeof useRecommendedJobs>);
}

describe("HU-02A T2.4 - RecommendedJobsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("shows loading placeholders while fetching recommendations", () => {
    setQueryState({ isPending: true });

    const { container } = render(<RecommendedJobsView />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText("Vacante de prueba")).not.toBeInTheDocument();
  });

  it("shows an error and allows retrying", () => {
    setQueryState({ isError: true });

    render(<RecommendedJobsView />);

    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows the incomplete profile state", () => {
    setQueryState({
      data: {
        isProfileComplete: false,
        items: [],
      },
    });

    render(<RecommendedJobsView />);

    expect(
      screen.getByText("Aún no podemos calcular tu compatibilidad"),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no matching jobs", () => {
    setQueryState({
      data: {
        isProfileComplete: true,
        items: [],
      },
    });

    render(<RecommendedJobsView />);

    expect(
      screen.getByText("Por ahora no hay vacantes que coincidan con tu perfil"),
    ).toBeInTheDocument();
  });

  it("renders recommendations returned by the hook", () => {
    setQueryState({
      data: {
        isProfileComplete: true,
        items: [
          {
            jobOfferId: "123",
            title: "Vacante de prueba",
            companyName: "Empresa de prueba",
            modality: "Remoto",
            score: 90,
            matchedSkills: ["React"],
            skills: ["React", "SQL"],
          },
        ],
      },
    });

    render(<RecommendedJobsView />);

    expect(
      screen.getByRole("heading", { name: "Vacante de prueba" }),
    ).toBeInTheDocument();

    expect(screen.getByText(/90%/)).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /Ver vacante/i }),
    ).toHaveAttribute("href", "/vacancies/recommended/123");
  });
});
