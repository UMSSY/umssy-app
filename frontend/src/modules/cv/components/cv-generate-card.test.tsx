import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CvGenerateCard } from "./cv-generate-card";

vi.mock("@/modules/profile/services/profile.service", () => ({
  profileService: {
    getProfile: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/modules/profile/services/portfolio-projects.service", () => ({
  portfolioProjectsService: { getPortfolioProjects: vi.fn().mockResolvedValue([]) },
}));

vi.mock("../services/documents.service", () => ({
  documentsService: {
    generateCv: vi.fn(),
  },
}));

describe("CvGenerateCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the action without opening the dialog", () => {
    render(<CvGenerateCard />);

    expect(screen.getByRole("button", { name: "Generar CV" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "¿Sin CV? Crea uno con los datos de tu perfil" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Genera automáticamente un documento PDF profesional con la información registrada en tu perfil de titulado.",
      ),
    ).toBeInTheDocument();
  });

  it("opens the cv generation dialog and closes it again", async () => {
    const user = userEvent.setup();
    render(<CvGenerateCard />);

    await user.click(screen.getByRole("button", { name: "Generar CV" }));

    expect(await screen.findByRole("dialog", { name: "Generar CV profesional" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("applies responsive layout classes to prevent button overlap on small screens", () => {
    render(<CvGenerateCard />);

    const section = screen.getByRole("region", { name: "Generar CV con los datos del perfil" });
    expect(section).toHaveClass("flex", "flex-col", "sm:flex-row");

    const button = screen.getByRole("button", { name: "Generar CV" });
    expect(button).toHaveClass("self-start", "sm:self-auto");
  });
});

