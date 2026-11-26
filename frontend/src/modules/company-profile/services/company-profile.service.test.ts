import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { companyProfileService } from "./company-profile.service";

vi.mock("@/shared/services/api-client", () => ({
  apiClient: { get: vi.fn() },
}));
vi.mock("@/shared/config/env.config", () => ({
  ENV_CONFIG: { apiUrl: "http://localhost:8080/api/" },
}));

const PROFILE = {
  id: "company-1",
  name: "Tech Andina",
  description: null,
  sector: "Software",
  city: "Cochabamba",
  phone: "44251234",
  email: "contacto@techandina.bo",
  website: null,
  logoUrl: "/companies/company-1/logo",
};

describe("companyProfileService", () => {
  it("pide el perfil de la empresa y arma la URL completa del logo", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: PROFILE } });

    await expect(companyProfileService.getProfile("company-1")).resolves.toEqual({
      ...PROFILE,
      logoUrl: "http://localhost:8080/api/companies/company-1/logo",
    });
    expect(apiClient.get).toHaveBeenCalledWith("/companies/company-1/profile");
  });

  it("deja el logo en null si la empresa no subió uno", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { ...PROFILE, logoUrl: null } } });

    await expect(companyProfileService.getProfile("company-1")).resolves.toMatchObject({ logoUrl: null });
  });
});
