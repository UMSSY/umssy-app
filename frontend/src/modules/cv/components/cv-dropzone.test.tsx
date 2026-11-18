import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, createEvent, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CvDropzone } from "./cv-dropzone";

function createPdf(): File {
  return new File(["%PDF"], "CV_Valeria_Quispe.pdf", { type: "application/pdf" });
}

function renderDropzone({ isDisabled = false, isUploading = false, progress = 0 } = {}) {
  const onSelectFile = vi.fn();
  const onFileDropped = vi.fn();
  render(
    <CvDropzone
      title="Selecciona tu CV en formato PDF"
      selectLabel="Seleccionar PDF"
      isDisabled={isDisabled}
      isUploading={isUploading}
      progress={progress}
      onSelectFile={onSelectFile}
      onFileDropped={onFileDropped}
    />,
  );
  const zone = screen.getByText("Selecciona tu CV en formato PDF").closest("[data-slot='cv-dropzone']");
  if (!(zone instanceof HTMLElement)) throw new Error("dropzone not rendered");
  return { zone, onSelectFile, onFileDropped, user: userEvent.setup() };
}

describe("CvDropzone", () => {
  afterEach(() => {
    cleanup();
  });

  it("sends the first dropped file", () => {
    const { zone, onFileDropped } = renderDropzone();
    const file = createPdf();

    fireEvent.drop(zone, { dataTransfer: { files: [file, createPdf()] } });

    expect(onFileDropped).toHaveBeenCalledTimes(1);
    expect(onFileDropped).toHaveBeenCalledWith(file);
  });

  it("highlights the zone while a file is dragged over it", () => {
    const { zone } = renderDropzone();

    fireEvent.dragEnter(zone);
    expect(zone).toHaveAttribute("data-dragging", "true");

    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveAttribute("data-dragging");
  });

  it("keeps the highlight when the pointer moves over an inner element", () => {
    const { zone } = renderDropzone();

    fireEvent.dragEnter(zone);
    // jsdom no implementa DragEvent, así que relatedTarget se asigna a mano.
    const leave = createEvent.dragLeave(zone);
    Object.defineProperty(leave, "relatedTarget", { value: screen.getByRole("button", { name: "Seleccionar PDF" }) });
    fireEvent(zone, leave);

    expect(zone).toHaveAttribute("data-dragging", "true");
  });

  it("ignores drops and drags while disabled", () => {
    const { zone, onFileDropped } = renderDropzone({ isDisabled: true });

    fireEvent.dragEnter(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [createPdf()] } });

    expect(zone).not.toHaveAttribute("data-dragging");
    expect(onFileDropped).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Seleccionar PDF" })).toBeDisabled();
  });

  it("ignores a drop without files", () => {
    const { zone, onFileDropped } = renderDropzone();

    fireEvent.drop(zone, { dataTransfer: { files: [] } });

    expect(onFileDropped).not.toHaveBeenCalled();
  });

  it("opens the file picker from the select button", async () => {
    const { onSelectFile, user } = renderDropzone();

    await user.click(screen.getByRole("button", { name: "Seleccionar PDF" }));

    expect(onSelectFile).toHaveBeenCalledTimes(1);
  });

  it("shows the upload progress only while uploading", () => {
    renderDropzone({ isUploading: true, progress: 45 });

    expect(screen.getByRole("progressbar", { name: "Progreso de la subida" })).toHaveAttribute(
      "aria-valuenow",
      "45",
    );
    expect(screen.getByText("Subiendo... 45%")).toBeInTheDocument();
  });

  it("hides the progress bar when idle", () => {
    renderDropzone();

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
