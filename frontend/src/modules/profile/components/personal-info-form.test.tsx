import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { profileService } from "../services/profile.service";
import {
  buildAxiosError,
  buildEmptyProfile,
  buildProfile,
  CITIES,
} from "../testing/profile-fixtures";
import { PersonalInfoForm } from "./personal-info-form";

function renderForm(profile = buildEmptyProfile()) {
  const onProfileChange = vi.fn();
  render(<PersonalInfoForm profile={profile} cities={CITIES} onProfileChange={onProfileChange} />);
  return { onProfileChange };
}

function fillValidData() {
  fireEvent.change(screen.getByLabelText(/Nombres/), { target: { value: " Valeria " } });
  fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: "Quispe" } });
  fireEvent.change(screen.getByLabelText(/Ciudad de residencia/), {
    target: { value: "city-lpz" },
  });
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: "+591 71234567" } });
  fireEvent.change(screen.getByLabelText(/Correo personal/), {
    target: { value: "valeria@correo.com" },
  });
}

describe("PersonalInfoForm", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the stored data of the profile", () => {
    renderForm(buildProfile());

    expect((screen.getByLabelText(/Nombres/) as HTMLInputElement).value).toBe("Valeria");
    expect((screen.getByLabelText(/Ciudad de residencia/) as HTMLSelectElement).value).toBe(
      "city-cbba",
    );
    expect((screen.getByLabelText(/Correo personal/) as HTMLInputElement).value).toBe(
      "valeria@correo.com",
    );
  });

  it("blocks saving and shows the fields to fix", async () => {
    const update = vi.spyOn(profileService, "updatePersonalInfo");
    renderForm();

    fireEvent.change(screen.getByLabelText(/Nombres/), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar perfil" }));

    expect(await screen.findByText("El nombre es obligatorio.")).toBeDefined();
    expect(screen.getByText("Selecciona tu ciudad de residencia.")).toBeDefined();
    expect(
      screen.getByText("El teléfono solo puede contener números, espacios, guiones y +."),
    ).toBeDefined();
    expect(screen.getByRole("alert").textContent).toBe(
      "No se pudo guardar. Revisa los campos marcados.",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("clears the error of a field when it changes", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Guardar perfil" }));
    expect(await screen.findByText("El teléfono es obligatorio.")).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: "7" } });

    expect(screen.queryByText("El teléfono es obligatorio.")).toBeNull();
  });

  it("saves trimmed data and confirms it", async () => {
    const updatedProfile = buildProfile({ city: CITIES[1] });
    const update = vi.spyOn(profileService, "updatePersonalInfo").mockResolvedValue(updatedProfile);
    const { onProfileChange } = renderForm();

    fillValidData();
    fireEvent.click(screen.getByRole("button", { name: "Guardar perfil" }));

    expect(
      await screen.findByText("Tus datos personales se guardaron correctamente."),
    ).toBeDefined();
    expect(update).toHaveBeenCalledWith({
      firstName: "Valeria",
      lastName: "Quispe",
      cityId: "city-lpz",
      phone: "+591 71234567",
      personalEmail: "valeria@correo.com",
    });
    expect(onProfileChange).toHaveBeenCalledWith(updatedProfile);
  });

  it("shows the errors returned by the backend", async () => {
    vi.spyOn(profileService, "updatePersonalInfo").mockRejectedValue(
      buildAxiosError(400, {
        message: "Revisa los datos ingresados.",
        errors: [{ field: "personalEmail", message: "Ingresa un correo electrónico válido." }],
      }),
    );
    renderForm();

    fillValidData();
    fireEvent.click(screen.getByRole("button", { name: "Guardar perfil" }));

    expect(await screen.findByText("Revisa los datos ingresados.")).toBeDefined();
    expect(screen.getByText("Ingresa un correo electrónico válido.")).toBeDefined();
  });

  it("restores the saved data when cancelling", async () => {
    renderForm(buildProfile());

    fireEvent.change(screen.getByLabelText(/Nombres/), { target: { value: "Otro" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect((screen.getByLabelText(/Nombres/) as HTMLInputElement).value).toBe("Valeria"),
    );
  });
});
