import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { profileService } from "../services/profile.service";
import { buildAxiosError, buildProfile, CITIES } from "../testing/profile-fixtures";
import { ProfileEditView } from "./profile-edit-view";

describe("ProfileEditView", () => {
  beforeEach(() => {
    vi.spyOn(profileService, "getCities").mockResolvedValue(CITIES);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the personal data form by default", async () => {
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(buildProfile());

    render(<ProfileEditView />);

    expect(screen.getByRole("status").textContent).toBe("Cargando tu perfil...");
    expect(await screen.findByText("Tu información personal")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Datos personales y contacto",
    );
  });

  it("switches to the presentation tab", async () => {
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(buildProfile());
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(<ProfileEditView />);
    await screen.findByText("Tu información personal");

    fireEvent.click(screen.getByRole("tab", { name: "Presentación" }));

    expect(await screen.findByText("Escribe tu presentación")).toBeDefined();
    expect(replaceState).toHaveBeenCalledWith(null, "", "?tab=presentation");
  });

  it("opens the requested tab and shows pending sections as coming soon", async () => {
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(buildProfile());

    render(<ProfileEditView initialTab="documents" />);

    expect(
      await screen.findByText("Esta sección estará disponible próximamente."),
    ).toBeDefined();
    expect((screen.getByRole("tab", { name: "Trayectoria" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("shows the load error with a retry option", async () => {
    const getMyProfile = vi
      .spyOn(profileService, "getMyProfile")
      .mockRejectedValueOnce(buildAxiosError(null))
      .mockResolvedValueOnce(buildProfile());

    render(<ProfileEditView initialTab="presentation" />);

    expect(
      await screen.findByText(
        "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
      ),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Escribe tu presentación")).toBeDefined();
    expect(getMyProfile).toHaveBeenCalledTimes(2);
  });
});
