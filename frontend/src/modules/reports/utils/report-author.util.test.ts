import { afterEach, describe, expect, it, vi } from "vitest";
import { profileService } from "@/modules/profile";
import { resolveReportAuthor } from "./report-author.util";

vi.mock("@/modules/auth", () => ({
  getRolesLabel: () => "Administrativo",
  getSessionRoles: () => ["administrativo"],
}));
vi.mock("@/shared/services/storage/access-token-storage", () => ({ getAccessToken: () => "token" }));
vi.mock("@/modules/profile", () => ({ profileService: { getProfile: vi.fn() } }));

describe("resolveReportAuthor", () => {
  afterEach(() => vi.clearAllMocks());

  it("devuelve el nombre completo y el rol del administrador", async () => {
    vi.mocked(profileService.getProfile).mockResolvedValue({ firstName: "Admin", lastName: "Uno" } as never);

    await expect(resolveReportAuthor()).resolves.toBe("Admin Uno (Administrativo)");
  });

  it("falla si el perfil no tiene nombre para no emitir un PDF sin autor", async () => {
    vi.mocked(profileService.getProfile).mockResolvedValue({ firstName: "", lastName: "" } as never);

    await expect(resolveReportAuthor()).rejects.toThrow("No se pudo identificar");
  });

  it("propaga el error si no se puede cargar el perfil", async () => {
    vi.mocked(profileService.getProfile).mockRejectedValue(new Error("network"));

    await expect(resolveReportAuthor()).rejects.toThrow("network");
  });
});
