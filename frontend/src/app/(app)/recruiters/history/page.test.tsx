import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VacancyHistoryPage from "./page";

vi.mock("@/modules/job-offers", () => ({
  VacancyHistoryView: () => <div data-testid="vacancy-history">Historial</div>,
}));

describe("VacancyHistoryPage", () => {
  it("renderiza la vista del historial de vacantes", () => {
    render(<VacancyHistoryPage />);

    expect(screen.getByTestId("vacancy-history")).toBeInTheDocument();
  });
});