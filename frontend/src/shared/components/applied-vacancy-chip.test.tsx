import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppliedVacancyChip } from "./applied-vacancy-chip";

afterEach(cleanup);

describe("AppliedVacancyChip", () => {
  it("muestra el texto «Ya te postulaste»", () => {
    render(<AppliedVacancyChip />);

    expect(screen.getByText("Ya te postulaste")).toBeInTheDocument();
  });

  it("usa los tokens de azul claro y el texto en negrita", () => {
    render(<AppliedVacancyChip />);

    const chip = screen.getByText("Ya te postulaste");
    expect(chip).toHaveClass("bg-availability", "text-availability-foreground", "font-bold");
  });

  it("incluye un icono decorativo que no se anuncia", () => {
    render(<AppliedVacancyChip />);

    expect(screen.getByText("Ya te postulaste").querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("acepta una clase extra", () => {
    render(<AppliedVacancyChip className="ml-2" />);

    expect(screen.getByText("Ya te postulaste")).toHaveClass("ml-2");
  });
});
