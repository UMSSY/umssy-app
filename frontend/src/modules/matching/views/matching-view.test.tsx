import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchingView } from "./matching-view";

vi.mock("./recruiter-radar-view", () => ({
  RecruiterRadarView: () => <h1>Buscar candidatos</h1>,
}));
vi.mock("../hooks/use-company-applicants", () => ({
  useCompanyApplicants: () => ({
    companyId: null,
    vacancies: {},
    applicants: {},
    isLoading: false,
  }),
}));

afterEach(() => cleanup());

describe("MatchingView HU4", () => {
  it("abre la búsqueda de candidatos directamente y conserva el acceso a postulaciones", () => {
    render(<MatchingView />);
    expect(
      screen.getByRole("heading", { name: "Buscar candidatos" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Postulaciones" }));
    expect(
      screen.getByRole("heading", { name: "Postulantes" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Radar de afinidad" }));
    expect(
      screen.getByRole("heading", { name: "Buscar candidatos" }),
    ).toBeInTheDocument();
  });
});
