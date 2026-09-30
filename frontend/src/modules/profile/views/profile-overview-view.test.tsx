import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { profileService } from "../services/profile.service";
import {
  buildAxiosError,
  buildEmptyProfile,
  buildProfile,
  CITIES,
} from "../testing/profile-fixtures";
import { ProfileOverviewView } from "./profile-overview-view";

describe("ProfileOverviewView", () => {
  beforeEach(() => {
    vi.spyOn(profileService, "getCities").mockResolvedValue(CITIES);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the registered personal and professional data", async () => {
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(
      buildProfile({ photoPath: "/profile/user-1/photo?v=1" }),
    );

    render(<ProfileOverviewView />);

    expect(await screen.findByRole("heading", { name: "Valeria Quispe" })).toBeDefined();
    expect(screen.getByText("Desarrolladora web junior")).toBeDefined();
    expect(screen.getByText("Cochabamba")).toBeDefined();
    expect(screen.getByText("+591 70000000")).toBeDefined();
    expect(screen.getByText("valeria@correo.com")).toBeDefined();
    expect(screen.getByText("Soy egresada de Ingeniería de Sistemas de la UMSS.")).toBeDefined();
    expect(screen.getByText("Desarrollo frontend")).toBeDefined();
    expect(screen.getByAltText("Fotografía de Valeria Quispe")).toBeDefined();
    expect(screen.queryByText("Completar perfil")).toBeNull();

    const editLinks = screen.getAllByRole("link", { name: "Editar" });
    expect(editLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/profile/edit?tab=personal",
      "/profile/edit?tab=presentation",
    ]);
  });

  it("invites to complete an empty profile", async () => {
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(buildEmptyProfile());

    render(<ProfileOverviewView />);

    expect(await screen.findByText("Completar perfil")).toBeDefined();
    expect(screen.getByText("Aún no agregaste un titular profesional")).toBeDefined();
    expect(screen.getAllByText("Sin registrar")).toHaveLength(3);
    expect(screen.getByText("Indica qué oportunidades laborales te interesan.")).toBeDefined();
  });

  it("shows the load error", async () => {
    vi.spyOn(profileService, "getMyProfile").mockRejectedValue(
      buildAxiosError(401, { message: "Debes iniciar sesión para continuar." }),
    );

    render(<ProfileOverviewView />);

    expect(await screen.findByText("Debes iniciar sesión para continuar.")).toBeDefined();
  });
});
