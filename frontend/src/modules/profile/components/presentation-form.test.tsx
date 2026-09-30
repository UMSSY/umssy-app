import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { profileService } from "../services/profile.service";
import { buildAxiosError, buildEmptyProfile, buildProfile } from "../testing/profile-fixtures";
import { PresentationForm } from "./presentation-form";

const ABOUT_ME = "Soy egresada de Ingeniería de Sistemas y me especializo en frontend.";

function renderForm(profile = buildEmptyProfile()) {
  const onProfileChange = vi.fn();
  render(<PresentationForm profile={profile} onProfileChange={onProfileChange} />);
  return { onProfileChange };
}

describe("PresentationForm", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows a live preview of the presentation", () => {
    renderForm();

    expect(screen.getByText("Tu titular profesional")).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Titular profesional/), {
      target: { value: "Desarrolladora web junior" },
    });
    fireEvent.change(screen.getByLabelText(/Oportunidades que me interesan/), {
      target: { value: "Trabajo remoto" },
    });

    expect(screen.getByText("Desarrolladora web junior")).toBeDefined();
    expect(screen.getByText("Trabajo remoto", { selector: "p" })).toBeDefined();
    expect(screen.getByText("25/120 caracteres")).toBeDefined();
  });

  it("blocks saving when the required fields are empty", async () => {
    const update = vi.spyOn(profileService, "updatePresentation");
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Guardar presentación" }));

    expect(await screen.findByText("El titular profesional es obligatorio.")).toBeDefined();
    expect(screen.getByText('El campo "Acerca de" es obligatorio.')).toBeDefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("saves the presentation and confirms it", async () => {
    const updatedProfile = buildProfile();
    const update = vi.spyOn(profileService, "updatePresentation").mockResolvedValue(updatedProfile);
    const { onProfileChange } = renderForm();

    fireEvent.change(screen.getByLabelText(/Titular profesional/), {
      target: { value: "Desarrolladora web junior" },
    });
    fireEvent.change(screen.getByLabelText(/Acerca de/), { target: { value: ABOUT_ME } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar presentación" }));

    expect(
      await screen.findByText("Tu presentación profesional se guardó correctamente."),
    ).toBeDefined();
    expect(update).toHaveBeenCalledWith({
      headline: "Desarrolladora web junior",
      aboutMe: ABOUT_ME,
      interestedOpportunities: "",
    });
    expect(onProfileChange).toHaveBeenCalledWith(updatedProfile);
  });

  it("shows a message when the backend fails", async () => {
    vi.spyOn(profileService, "updatePresentation").mockRejectedValue(buildAxiosError(500));
    renderForm(buildProfile());

    fireEvent.click(screen.getByRole("button", { name: "Guardar presentación" }));

    expect(
      await screen.findByText("No se pudo guardar tu presentación. Intenta nuevamente."),
    ).toBeDefined();
  });

  it("restores the saved data when cancelling", async () => {
    renderForm(buildProfile());

    fireEvent.change(screen.getByLabelText(/Titular profesional/), { target: { value: "Otro" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect((screen.getByLabelText(/Titular profesional/) as HTMLInputElement).value).toBe(
        "Desarrolladora web junior",
      ),
    );
  });
});
