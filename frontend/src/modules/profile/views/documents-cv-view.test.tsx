import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_FILE_SIZE_BYTES } from "../config/file-upload.config";
import type { SavedCv } from "../types/saved-cv.types";
import { DocumentsCvView } from "./documents-cv-view";

const PDF_TYPE = "application/pdf";
const CV_SIZE_IN_BYTES = 1258291;

const UPLOADED_CV: SavedCv = {
  fileName: "CV_Valeria_Quispe.pdf",
  fileType: "PDF",
  sizeInBytes: CV_SIZE_IN_BYTES,
  updatedAt: new Date(2026, 8, 20),
};

function createFile(name: string, type = PDF_TYPE, size = CV_SIZE_IN_BYTES): File {
  return new File([new Uint8Array(size)], name, { type });
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function getFileInput(): HTMLInputElement {
  return screen.getByLabelText("Archivo PDF del CV");
}

async function chooseAndConfirm(user: ReturnType<typeof userEvent.setup>, file: File) {
  await user.upload(getFileInput(), file);
  await user.click(screen.getByRole("button", { name: "Confirmar carga" }));
}

describe("DocumentsCvView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the cv title in the header and the main heading", () => {
    render(<DocumentsCvView />);

    expect(screen.getByRole("heading", { level: 1, name: "Currículum Vitae" })).toBeInTheDocument();
    expect(screen.getAllByText("Currículum Vitae")).toHaveLength(2);
    expect(screen.queryByText("Currículum PDF")).not.toBeInTheDocument();
    expect(
      screen.getByText("Sube tu CV para tenerlo disponible en el perfil y mantenerlo actualizado"),
    ).toBeInTheDocument();
  });

  it("shows the profile tabs with Documentos active", () => {
    render(<DocumentsCvView />);

    const documentsTab = screen.getByRole("link", { name: "Documentos" });

    expect(screen.getByRole("link", { name: "Datos personales" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Presentación" })).toBeInTheDocument();
    expect(screen.getByText("Trayectoria")).toBeInTheDocument();
    expect(documentsTab).toHaveAttribute("href", "/profile/documents");
    expect(documentsTab).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByText("Documentos")).toHaveLength(1);
  });

  it("does not show the steps indicator nor the certifications link", () => {
    render(<DocumentsCvView />);

    expect(screen.queryByRole("list", { name: "Pasos de documentos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ver certificaciones" })).not.toBeInTheDocument();
  });

  it("starts with the empty state and the confirm button disabled", () => {
    render(<DocumentsCvView />);

    expect(screen.getByText("Subir currículum")).toBeInTheDocument();
    expect(screen.getByText("Selecciona tu CV en formato PDF")).toBeInTheDocument();
    expect(
      screen.getByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar PDF" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("opens the file picker from Seleccionar PDF", async () => {
    const user = userEvent.setup();
    render(<DocumentsCvView />);
    const clickSpy = vi.spyOn(getFileInput(), "click");

    await user.click(screen.getByRole("button", { name: "Seleccionar PDF" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(getFileInput()).toHaveAttribute("accept", "application/pdf,.pdf");
  });

  it("uploads a valid pdf, shows the saved file and a success message", async () => {
    const user = userEvent.setup();
    render(<DocumentsCvView />);

    await user.upload(getFileInput(), createFile("CV_Valeria_Quispe.pdf"));

    expect(screen.getByText("CV_Valeria_Quispe.pdf · 1.2 MB")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar carga" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Tu CV se cargó correctamente.");
    expect(screen.getByText("CV_Valeria_Quispe.pdf")).toBeInTheDocument();
    expect(screen.getByText("Cargado correctamente")).toBeInTheDocument();
    expect(screen.queryByText("CV_Valeria_Quispe.pdf · 1.2 MB")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
  });

  it("shows an error and keeps the previous selection for a file that is not a pdf", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<DocumentsCvView />);

    await user.upload(getFileInput(), createFile("CV_Valeria_Quispe.pdf"));
    await user.upload(getFileInput(), createFile("foto.png", "image/png"));

    expect(screen.getByRole("alert")).toHaveTextContent("El CV debe estar en formato PDF.");
    expect(screen.getByText("CV_Valeria_Quispe.pdf · 1.2 MB")).toBeInTheDocument();
    expect(
      screen.getByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).toBeInTheDocument();
  });

  it("shows the size limit error for a pdf larger than 5 MB", async () => {
    const user = userEvent.setup();
    render(<DocumentsCvView />);

    await user.upload(getFileInput(), createFile("cv.pdf", PDF_TYPE, MAX_FILE_SIZE_BYTES + 1));

    expect(screen.getByRole("alert")).toHaveTextContent("El archivo supera el límite de 5 MB.");
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
  });

  it("shows an error for an empty pdf", async () => {
    const user = userEvent.setup();
    render(<DocumentsCvView />);

    await user.upload(getFileInput(), createFile("cv.pdf", PDF_TYPE, 0));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El archivo está vacío. Selecciona otro archivo.",
    );
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
  });

  it("clears the error when a valid pdf is chosen after an invalid one", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<DocumentsCvView />);

    await user.upload(getFileInput(), createFile("foto.png", "image/png"));

    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.upload(getFileInput(), createFile("CV_Valeria_Quispe.pdf"));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("CV_Valeria_Quispe.pdf · 1.2 MB")).toBeInTheDocument();
  });

  it("ignores a selection without files", () => {
    render(<DocumentsCvView />);

    fireEvent.change(getFileInput(), { target: { files: [] } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
  });

  it("shows the spinner and blocks repeated clicks while uploading", async () => {
    const user = userEvent.setup();
    const pendingUpload = createDeferred<SavedCv>();
    const uploadCv = vi
      .fn<(file: File) => Promise<SavedCv>>()
      .mockResolvedValueOnce(UPLOADED_CV)
      .mockReturnValueOnce(pendingUpload.promise);
    render(<DocumentsCvView uploadCv={uploadCv} />);

    await chooseAndConfirm(user, createFile("CV_Valeria_Quispe.pdf"));
    await screen.findByRole("status");
    await chooseAndConfirm(user, createFile("CV_Nuevo.pdf"));

    const uploadingButton = screen.getByRole("button", { name: "Cargando..." });

    expect(uploadingButton).toBeDisabled();
    expect(uploadingButton.querySelector("svg.lucide-loader-circle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar PDF" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reemplazar CV" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Eliminar CV" })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.click(uploadingButton);

    expect(uploadCv).toHaveBeenCalledTimes(2);

    await act(async () => {
      pendingUpload.resolve({ ...UPLOADED_CV, fileName: "CV_Nuevo.pdf" });
    });

    expect(screen.getByRole("status")).toHaveTextContent("Tu CV se reemplazó correctamente.");
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
  });

  it("replaces the saved cv from Reemplazar CV", async () => {
    const user = userEvent.setup();
    render(<DocumentsCvView />);

    await chooseAndConfirm(user, createFile("CV_Valeria_Quispe.pdf"));
    await screen.findByRole("status");
    const clickSpy = vi.spyOn(getFileInput(), "click");

    await user.click(screen.getByRole("button", { name: "Reemplazar CV" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);

    await chooseAndConfirm(user, createFile("CV_Nuevo.pdf"));

    expect(await screen.findByText("Tu CV se reemplazó correctamente.")).toBeInTheDocument();
    expect(screen.getByText("CV_Nuevo.pdf")).toBeInTheDocument();
    expect(screen.queryByText("CV_Valeria_Quispe.pdf")).not.toBeInTheDocument();
  });

  it("keeps the cv when cancelling the delete dialog", async () => {
    const user = userEvent.setup();
    render(<DocumentsCvView />);

    await chooseAndConfirm(user, createFile("CV_Valeria_Quispe.pdf"));
    await screen.findByRole("status");
    await user.click(screen.getByRole("button", { name: "Eliminar CV" }));

    const dialog = await screen.findByRole("alertdialog", { name: "¿Eliminar tu CV?" });

    expect(dialog).toHaveAccessibleDescription("El archivo dejará de estar disponible en tu perfil.");
    expect(screen.queryByRole("status", { hidden: true })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByText("CV_Valeria_Quispe.pdf")).toBeInTheDocument();
  });

  it("disables the upload actions while deleting", async () => {
    const user = userEvent.setup();
    const pendingDelete = createDeferred<void>();
    const deleteCv = vi.fn<() => Promise<void>>().mockReturnValueOnce(pendingDelete.promise);
    render(<DocumentsCvView deleteCv={deleteCv} />);

    await chooseAndConfirm(user, createFile("CV_Valeria_Quispe.pdf"));
    await screen.findByRole("status");
    await user.upload(getFileInput(), createFile("CV_Nuevo.pdf"));
    await user.click(screen.getByRole("button", { name: "Eliminar CV" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    expect(screen.getByRole("button", { name: "Eliminando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Seleccionar PDF", hidden: true })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Confirmar carga", hidden: true })).toBeDisabled();

    await act(async () => {
      pendingDelete.resolve();
    });

    expect(deleteCv).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeEnabled();
  });

  it("deletes the cv after confirming", async () => {
    const user = userEvent.setup();
    render(<DocumentsCvView />);

    await chooseAndConfirm(user, createFile("CV_Valeria_Quispe.pdf"));
    await screen.findByRole("status");
    await user.click(screen.getByRole("button", { name: "Eliminar CV" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Tu CV se eliminó.");
    expect(
      screen.getByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).toBeInTheDocument();
    expect(screen.queryByText("CV_Valeria_Quispe.pdf")).not.toBeInTheDocument();
  });
});
