import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/shared/contexts/auth-context";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import type { AuthContextValue } from "@/shared/types/auth-context-value.types";
import { companyProfileService } from "../services/company-profile.service";
import type { CompanyProfile } from "../types/company-profile.types";
import { CompanyProfileView } from "./company-profile-view";

vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("../services/company-profile.service", () => ({
  companyProfileService: { getProfile: vi.fn() },
}));

const SESSION: AuthContextValue = {
  currentUserId: "user-1",
  isLoading: false,
  refreshRoles: vi.fn(),
  roles: ["empresa"],
  company: { id: "company-1", name: "Tech Andina" },
};

const PROFILE: CompanyProfile = {
  id: "company-1",
  name: "Tech Andina S.R.L.",
  description: "Desarrollo de software a medida.",
  sector: "Software",
  city: "Cochabamba",
  phone: "44251234",
  email: "contacto@techandina.bo",
  website: "https://techandina.bo",
  logoUrl: null,
};

describe("CompanyProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(SESSION);
  });

  afterEach(() => {
    cleanup();
  });

  it("muestra los datos reales de la empresa de la sesión", async () => {
    vi.mocked(companyProfileService.getProfile).mockResolvedValue(PROFILE);

    renderWithQuery(<CompanyProfileView />);

    expect(await screen.findByRole("heading", { name: PROFILE.name })).toBeInTheDocument();
    expect(companyProfileService.getProfile).toHaveBeenCalledWith("company-1");
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("Desarrollo de software a medida.")).toBeInTheDocument();
    expect(screen.getByText("Cochabamba")).toBeInTheDocument();
    expect(screen.getByText("44251234")).toBeInTheDocument();
    expect(screen.getByText("contacto@techandina.bo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /techandina\.bo/ })).toHaveAttribute("href", "https://techandina.bo/");
    expect(screen.queryByText(/mock/i)).not.toBeInTheDocument();
  });

  it("indica lo que la empresa todavía no registró", async () => {
    vi.mocked(companyProfileService.getProfile).mockResolvedValue({
      ...PROFILE,
      description: null,
      sector: null,
      city: null,
      phone: null,
      email: null,
      website: null,
    });

    renderWithQuery(<CompanyProfileView />);

    expect(await screen.findByText("Sin descripción registrada.")).toBeInTheDocument();
    expect(screen.getAllByText("No registrado")).toHaveLength(5);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("muestra el error y permite reintentar", async () => {
    vi.mocked(companyProfileService.getProfile)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(PROFILE);

    renderWithQuery(<CompanyProfileView />);

    expect(await screen.findByText(/No se pudo cargar la información del perfil/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { name: PROFILE.name })).toBeInTheDocument();
    await waitFor(() => expect(companyProfileService.getProfile).toHaveBeenCalledTimes(2));
  });

  it("avisa cuando la cuenta no tiene empresa y no llama a la API", () => {
    vi.mocked(useAuth).mockReturnValue({ ...SESSION, company: null });

    renderWithQuery(<CompanyProfileView />);

    expect(screen.getByText("Tu cuenta no tiene una empresa asignada.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    expect(companyProfileService.getProfile).not.toHaveBeenCalled();
  });

  it("muestra la carga mientras se resuelve la sesión", () => {
    vi.mocked(useAuth).mockReturnValue({ ...SESSION, isLoading: true, company: null });

    renderWithQuery(<CompanyProfileView />);

    expect(screen.getByLabelText("Cargando información del perfil de la empresa")).toBeInTheDocument();
  });
});
