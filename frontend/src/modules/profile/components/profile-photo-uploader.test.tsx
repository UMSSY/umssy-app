import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { profileService } from "../services/profile.service";
import { buildAxiosError, buildProfile } from "../testing/profile-fixtures";
import { ProfilePhotoUploader } from "./profile-photo-uploader";

const PHOTO_PATH = "/profile/user-1/photo?v=1";

function renderUploader(photoPath: string | null = null) {
  const onProfileChange = vi.fn();
  render(
    <ProfilePhotoUploader profile={buildProfile({ photoPath })} onProfileChange={onProfileChange} />,
  );
  return { onProfileChange };
}

function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText("Seleccionar fotografía de perfil"), {
    target: { files: [file] },
  });
}

describe("ProfilePhotoUploader", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("opens the file picker from the button", () => {
    renderUploader();
    const input = screen.getByLabelText("Seleccionar fotografía de perfil") as HTMLInputElement;
    const click = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: "Subir fotografía" }));

    expect(click).toHaveBeenCalled();
  });

  it("uploads a valid photo and shows it", async () => {
    const updatedProfile = buildProfile({ photoPath: PHOTO_PATH });
    const upload = vi.spyOn(profileService, "uploadPhoto").mockResolvedValue(updatedProfile);
    const { onProfileChange } = renderUploader();
    const file = new File(["img"], "foto.png", { type: "image/png" });

    selectFile(file);

    expect(await screen.findByText("Tu fotografía se actualizó correctamente.")).toBeDefined();
    expect(upload).toHaveBeenCalledWith(file);
    expect(onProfileChange).toHaveBeenCalledWith(updatedProfile);
  });

  it("rejects an invalid file without calling the backend", async () => {
    const upload = vi.spyOn(profileService, "uploadPhoto");
    renderUploader();

    selectFile(new File(["pdf"], "cv.pdf", { type: "application/pdf" }));

    expect(
      await screen.findByText("La fotografía debe ser una imagen JPG, PNG o WEBP."),
    ).toBeDefined();
    expect(upload).not.toHaveBeenCalled();
  });

  it("ignores an empty selection", () => {
    const upload = vi.spyOn(profileService, "uploadPhoto");
    renderUploader();

    fireEvent.change(screen.getByLabelText("Seleccionar fotografía de perfil"), {
      target: { files: [] },
    });

    expect(upload).not.toHaveBeenCalled();
  });

  it("shows the backend error when the upload fails", async () => {
    vi.spyOn(profileService, "uploadPhoto").mockRejectedValue(buildAxiosError(413));
    renderUploader();

    selectFile(new File(["img"], "foto.png", { type: "image/png" }));

    expect(await screen.findByText("La fotografía no puede superar los 2 MB.")).toBeDefined();
  });

  it("shows the current photo and removes it", async () => {
    const updatedProfile = buildProfile({ photoPath: null });
    vi.spyOn(profileService, "removePhoto").mockResolvedValue(updatedProfile);
    const { onProfileChange } = renderUploader(PHOTO_PATH);

    expect(screen.getByAltText("Fotografía de Valeria Quispe")).toBeDefined();
    expect(screen.getByRole("button", { name: "Cambiar fotografía" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));

    expect(await screen.findByText("Se quitó tu fotografía de perfil.")).toBeDefined();
    expect(onProfileChange).toHaveBeenCalledWith(updatedProfile);
  });

  it("shows an error when the photo cannot be removed", async () => {
    vi.spyOn(profileService, "removePhoto").mockRejectedValue(new Error("boom"));
    renderUploader(PHOTO_PATH);

    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));

    expect(
      await screen.findByText("No se pudo quitar la fotografía. Intenta nuevamente."),
    ).toBeDefined();
  });
});
