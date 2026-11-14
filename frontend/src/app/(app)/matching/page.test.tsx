import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { useAuth } from "@/shared/contexts/auth-context";
import { jobOffersService } from "@/modules/job-offers";
import { getCompanyApplicants } from "@/modules/matching/services/matching.service";
import MatchingPage from "./page";

vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/modules/job-offers", () => ({ jobOffersService: { getByCompany: vi.fn() } }));
vi.mock("@/modules/matching/services/matching.service", () => ({ getCompanyApplicants: vi.fn() }));
vi.mock("@/modules/matching/services/radar-recruiter.service", () => ({
  radarRecruiterApi: { vacancies: vi.fn().mockResolvedValue([]), applicants: vi.fn() },
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("MatchingPage", () => {
  it("loads the real company vacancy and its applicants", async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUserId: "user-1", roles: ["empresa"], company: { id: "company-1", name: "Empresa real" }, isLoading: false, refreshRoles: vi.fn() });
    vi.mocked(jobOffersService.getByCompany).mockResolvedValue([{ id: "offer-1", title: "Vacante real" }] as Awaited<ReturnType<typeof jobOffersService.getByCompany>>);
    vi.mocked(getCompanyApplicants).mockResolvedValue({ jobOfferId: "offer-1", jobTitle: "Vacante real", total: 1, applicants: [{ id: "application-1", userId: "applicant-1", fullName: "Ana Pérez", email: "ana@example.com", headline: "Ingeniera", appliedAt: "2026-11-08T12:00:00Z", status: "En revisión" }] });
    renderWithQuery(<MatchingPage />);
    expect(screen.getByRole("heading", { name: "Buscar candidatos" })).toBeInTheDocument();
    expect(getCompanyApplicants).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Postulaciones" }));
    expect(await screen.findByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
    expect(jobOffersService.getByCompany).toHaveBeenCalledWith("company-1");
    expect(getCompanyApplicants).toHaveBeenCalledWith("company-1", "offer-1", expect.any(AbortSignal));
    expect(screen.queryByText("Tech Lead")).not.toBeInTheDocument();
  });
  it("does not request another company when the session has no relationship", () => {
    vi.mocked(useAuth).mockReturnValue({ currentUserId: "user-1", roles: ["empresa"], company: null, isLoading: false, refreshRoles: vi.fn() });
    renderWithQuery(<MatchingPage />);
    fireEvent.click(screen.getByRole("button", { name: "Postulaciones" }));
    expect(screen.getByText("No tienes una empresa asignada para consultar postulaciones.")).toBeInTheDocument();
    expect(jobOffersService.getByCompany).not.toHaveBeenCalled();
    expect(getCompanyApplicants).not.toHaveBeenCalled();
  });
});
