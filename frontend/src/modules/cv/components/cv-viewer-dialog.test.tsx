import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CvPreview } from "../types/cv-preview.types";
import { CvViewerDialog } from "./cv-viewer-dialog";

const downloadFileMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/utils/download-file", () => ({
  downloadFile: downloadFileMock,
}));

const PREVIEW: CvPreview = {
  cv: {
    id: "cv-1",
    fileName: "CV_Valeria_Quispe.pdf",
    fileType: "PDF",
    sizeInBytes: 1024,
    updatedAt: new Date(2026, 8, 20),
    isCurrent: true,
  },
  file: new Blob(["%PDF"], { type: "application/pdf" }),
  previewUrl: "blob:cv-1",
};

function renderDialog(preview: CvPreview | null = PREVIEW) {
  const onClose = vi.fn();
  render(<CvViewerDialog preview={preview} onClose={onClose} />);
  return { onClose, user: userEvent.setup() };
}

describe("CvViewerDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders nothing without a preview", () => {
    renderDialog(null);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the pdf of the cv with its name and upload date", async () => {
    renderDialog();

    expect(await screen.findByRole("dialog", { name: "Vista previa del CV" })).toHaveAccessibleDescription(
      "CV_Valeria_Quispe.pdf · Subido el 20 sep 2026, 00:00",
    );
    expect(screen.getByTitle("Vista previa de CV_Valeria_Quispe.pdf")).toHaveAttribute(
      "src",
      "blob:cv-1",
    );
  });

  it("downloads the cv with its own file name", async () => {
    const { user } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Descargar" }));

    expect(downloadFileMock).toHaveBeenCalledWith(PREVIEW.file, "CV_Valeria_Quispe.pdf");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a spanish error when the download fails", async () => {
    downloadFileMock.mockImplementationOnce(() => {
      throw new Error("Blocked");
    });
    const { user } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Descargar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo descargar el CV. Intenta de nuevo.",
    );
  });

  it("closes from Cerrar", async () => {
    const { onClose, user } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with the escape key", async () => {
    const { onClose, user } = renderDialog();
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});
