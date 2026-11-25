import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VacancyClosedBadge } from "./vacancy-closed-badge";

afterEach(cleanup);

describe("VacancyClosedBadge", () => {
  it("says that the vacancy is closed", () => {
    render(<VacancyClosedBadge />);

    expect(screen.getByText("Vacante cerrada")).toBeInTheDocument();
  });

  it("uses the neutral gray tokens and not the destructive color", () => {
    render(<VacancyClosedBadge />);

    const badge = screen.getByText("Vacante cerrada");
    expect(badge).toHaveClass("bg-surface-soft", "text-text-secondary");
    expect(badge.className).not.toContain("destructive");
  });
});
