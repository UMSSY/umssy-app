import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VacancyClosedBadge } from "./vacancy-closed-badge";

afterEach(cleanup);

describe("VacancyClosedBadge", () => {
  it("says that the vacancy is closed", () => {
    render(<VacancyClosedBadge />);

    expect(screen.getByText("Vacante cerrada")).toBeInTheDocument();
  });

  it("uses the light red tint that job-offers applies to deleted vacancies", () => {
    render(<VacancyClosedBadge />);

    const badge = screen.getByText("Vacante cerrada");
    expect(badge).toHaveClass("border-destructive/30", "bg-destructive/10", "text-destructive");
  });
});
