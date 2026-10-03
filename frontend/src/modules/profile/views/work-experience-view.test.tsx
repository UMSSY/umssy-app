import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WorkExperienceView } from "./work-experience-view";

describe("WorkExperienceView", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the registered experiences with their period", () => {
    render(<WorkExperienceView />);

    expect(screen.getByRole("heading", { level: 1, name: "Trayectoria" })).toBeInTheDocument();
    expect(screen.getByText("Desarrolladora web junior")).toBeInTheDocument();
    expect(screen.getByText(/Mar 2025 – Actualidad/)).toBeInTheDocument();
    expect(screen.getByText(/Jul – Dic 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 2023 – Dic 2024/)).toBeInTheDocument();
  });

  it("shows the edit and delete options for each record", () => {
    render(<WorkExperienceView />);

    expect(screen.getByRole("button", { name: "Editar Desarrolladora web junior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar Desarrolladora web junior" })).toBeInTheDocument();
  });

  it("marks Experiencia laboral as the active step", () => {
    render(<WorkExperienceView />);

    expect(screen.getByText("Experiencia laboral").closest("li")).toHaveAttribute("aria-current", "step");
  });
});

