import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/services/query-client";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_FILE_SIZE_BYTES } from "@/modules/profile/config/file-upload.config";
import { documentsService } from "../services/documents.service";
import type { CvPage } from "../types/cv-page.types";
import type { SavedCv } from "../types/saved-cv.types";
import { DocumentsCvView } from "./documents-cv-view";

vi.mock("../services/documents.service", () => ({
  documentsService: {
    getCvs: vi.fn(),
    getCvFile: vi.fn(),
    uploadCv: vi.fn(),
    deleteCv: vi.fn(),
  },
}));

const PDF_TYPE = "application/pdf";
const CV_SIZE_IN_BYTES = 1258291;
const UPLOAD_DATE = new Date(2026, 8, 20);

let serverCvs: SavedCv[] = [];
let nextId = 1;

function buildCv(fileName: string, size = CV_SIZE_IN_BYTES): SavedCv {
  return {
    id: `cv-${nextId++}`,
    fileName,
    fileType: "PDF",
    sizeInBytes: size,
    updatedAt: UPLOAD_DATE,
    isCurrent: true,
  };
}

function storeCv(cv: SavedCv) {
  serverCvs = [cv, ...serverCvs.map((item) => ({ ...item, isCurrent: false }))];
}

function seedCvs(...fileNames: string[]) {
  for (const fileName of [...fileNames].reverse()) {
    storeCv(buildCv(fileName));
  }
}

function getPage(page: number, limit: number): Promise<CvPage> {
  const start = (page - 1) * limit;
  return Promise.resolve({
    items: serverCvs.slice(start, start + limit),
    totalItems: serverCvs.length,
    totalPages: Math.ceil(serverCvs.length / limit),
    page,
  });
}

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

function getRecentItems() {
  return within(screen.getByRole("list", { name: "CVs recientes" })).getAllByRole("listitem");
}

async function renderView() {
  await act(async () => {
    render(<DocumentsCvView />);
  });
  await waitFor(() => expect(screen.queryByText("Cargando tu CV...")).not.toBeInTheDocument());
}

async function chooseAndConfirm(user: ReturnType<typeof userEvent.setup>, file: File) {
  await user.upload(getFileInput(), file);
  await user.click(screen.getByRole("button", { name: "Confirmar carga" }));
}

describe("DocumentsCvView", () => {
  beforeEach(() => {
    serverCvs = [];
    nextId = 1;
    vi.mocked(documentsService.getCvs).mockImplementation(getPage);
    vi.mocked(documentsService.uploadCv).mockImplementation((file: File) => {
      const cv = buildCv(file.name, file.size);
      storeCv(cv);
      return Promise.resolve(cv);
    });
    vi.mocked(documentsService.getCvFile).mockResolvedValue(
      new Blob(["%PDF"], { type: PDF_TYPE }),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cv");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.mocked(documentsService.deleteCv).mockImplementation((cvId: string) => {
      serverCvs = serverCvs.filter((cv) => cv.id !== cvId);
      if (serverCvs.length > 0) {
        serverCvs[0] = { ...serverCvs[0], isCurrent: true };
      }
      return Promise.resolve();
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("renders the cv title once in the main heading", async () => {
    await renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Documentos y CV" })).toBeInTheDocument();
    expect(screen.getAllByText("Documentos y CV")).toHaveLength(1);
    expect(
      screen.getByText("Sube tu CV para tenerlo disponible en el perfil y mantenerlo actualizado"),
    ).toBeInTheDocument();
  });

  it("does not show the steps indicator nor the certifications link", async () => {
    await renderView();

    expect(screen.queryByRole("list", { name: "Pasos de documentos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ver certificaciones" })).not.toBeInTheDocument();
  });

  it("renders the same loading state in the server html to avoid a hydration mismatch", () => {
    const html = renderToString(
      <QueryClientProvider client={createQueryClient()}>
        <DocumentsCvView />
      </QueryClientProvider>,
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Seleccionar PDF");
  });

  it("shows loading placeholders until the saved cvs load", async () => {
    const pendingLoad = createDeferred<CvPage>();
    vi.mocked(documentsService.getCvs).mockReturnValueOnce(pendingLoad.promise);
    seedCvs("CV_Valeria_Quispe.pdf");
    render(<DocumentsCvView />);

    expect(screen.getByText("Cargando tu CV...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Seleccionar PDF" })).not.toBeInTheDocument();

    await act(async () => {
      pendingLoad.resolve(await getPage(1, 5));
    });

    await waitFor(() => expect(screen.queryByText("Cargando tu CV...")).not.toBeInTheDocument());
    expect(screen.getByText("CV_Valeria_Quispe.pdf")).toBeInTheDocument();
    expect(screen.getByText("Ya tienes un CV vigente")).toBeInTheDocument();
  });

  it("asks the server for the five most recent cvs", async () => {
    await renderView();

    expect(documentsService.getCvs).toHaveBeenCalledWith(1, 5);
  });

  it("starts with the empty state and the confirm button disabled", async () => {
    await renderView();

    expect(screen.getByText("Selecciona tu CV en formato PDF")).toBeInTheDocument();
    expect(
      screen.getByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar PDF" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the saved cvs with the current one flagged", async () => {
    seedCvs("CV_2026.pdf", "CV_2025.pdf");

    await renderView();

    const items = getRecentItems();
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("CV_2026.pdf")).toBeInTheDocument();
    expect(within(items[0]).getByText("Vigente")).toBeInTheDocument();
    expect(within(items[1]).queryByText("Vigente")).not.toBeInTheDocument();
    expect(screen.queryByText("Cargado correctamente")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir nueva versión" })).toBeEnabled();
  });

  it("shows a spanish error when the saved cvs cannot be loaded", async () => {
    vi.mocked(documentsService.getCvs).mockRejectedValue(new Error("Network Error"));

    await renderView();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo cargar tu CV. Intenta de nuevo más tarde.",
    );
    expect(
      screen.queryByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
  });

  it("loads the saved cvs again from Reintentar", async () => {
    const user = userEvent.setup();
    seedCvs("CV_2026.pdf");
    vi.mocked(documentsService.getCvs).mockRejectedValueOnce(new Error("Network Error"));
    await renderView();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(getRecentItems()).toHaveLength(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir nueva versión" })).toBeEnabled();
  });

  it("hides the success message after a while and keeps the errors", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, applyAccept: false });
    await renderView();

    await chooseAndConfirm(user, createFile("CV_Valeria_Quispe.pdf"));
    expect(await screen.findByRole("status")).toHaveTextContent("Tu CV se cargó correctamente.");

    act(() => vi.advanceTimersByTime(5000));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.upload(getFileInput(), createFile("foto.png", "image/png"));
    act(() => vi.advanceTimersByTime(5000));

    expect(screen.getByRole("alert")).toHaveTextContent("El CV debe estar en formato PDF.");
    vi.useRealTimers();
  });

  it("opens the file picker from Seleccionar PDF", async () => {
    const user = userEvent.setup();
    await renderView();
    const clickSpy = vi.spyOn(getFileInput(), "click");

    await user.click(screen.getByRole("button", { name: "Seleccionar PDF" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(getFileInput()).toHaveAttribute("accept", "application/pdf,.pdf");
  });

  it("uploads the first cv, lists it as current and shows a success message", async () => {
    const user = userEvent.setup();
    await renderView();
    const file = createFile("CV_Valeria_Quispe.pdf");

    await user.upload(getFileInput(), file);

    expect(screen.getByText("CV_Valeria_Quispe.pdf · 1.2 MB")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar carga" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Tu CV se cargó correctamente.");
    expect(documentsService.uploadCv).toHaveBeenCalledWith(file);
    expect(within(getRecentItems()[0]).getByText("Vigente")).toBeInTheDocument();
    expect(screen.getByText("CV_Valeria_Quispe.pdf")).toBeInTheDocument();
    expect(screen.getByText("Ya tienes un CV vigente")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar carga" })).not.toBeInTheDocument();
  });

  it.each([
    ["415", { response: { status: 415 } }, "El CV debe estar en formato PDF."],
    ["413", { response: { status: 413 } }, "El archivo supera el límite de 5 MB."],
    ["400", { response: { status: 400 } }, "El archivo está vacío. Selecciona otro archivo."],
    [
      "400 with the corrupted file code",
      { response: { status: 400, data: { data: { code: "CORRUPTED_FILE" } } } },
      "El archivo está dañado o incompleto. Selecciona otro PDF.",
    ],
  ])(
    "shows a spanish message and clears the selection when the server rejects the file with %s",
    async (_status, error, message) => {
      const user = userEvent.setup();
      vi.mocked(documentsService.uploadCv).mockRejectedValueOnce(error);
      await renderView();

      await chooseAndConfirm(user, createFile("CV_Nuevo.pdf"));

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.queryByText("CV_Nuevo.pdf · 1.2 MB")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
    },
  );

  it.each([
    ["a server error", { response: { status: 500 } }],
    ["a network error", new Error("Network Error")],
  ])("keeps the selected file to retry after %s", async (_reason, error) => {
    const user = userEvent.setup();
    vi.mocked(documentsService.uploadCv).mockRejectedValueOnce(error);
    await renderView();
    const file = createFile("CV_Nuevo.pdf");

    await chooseAndConfirm(user, file);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo subir tu CV. Intenta de nuevo.",
    );
    expect(screen.getByText("CV_Nuevo.pdf · 1.2 MB")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar carga" }));

    expect(documentsService.uploadCv).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("status")).toHaveTextContent("Tu CV se cargó correctamente.");
  });

  it("shows an error and returns to the initial state for a file that is not a pdf", async () => {
    const user = userEvent.setup({ applyAccept: false });
    await renderView();

    await user.upload(getFileInput(), createFile("CV_Valeria_Quispe.pdf"));
    await user.upload(getFileInput(), createFile("foto.png", "image/png"));

    expect(screen.getByRole("alert")).toHaveTextContent("El CV debe estar en formato PDF.");
    expect(screen.queryByText("CV_Valeria_Quispe.pdf · 1.2 MB")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
    expect(documentsService.uploadCv).not.toHaveBeenCalled();
  });

  it("shows the size limit error for a pdf larger than 5 MB", async () => {
    const user = userEvent.setup();
    await renderView();

    await user.upload(getFileInput(), createFile("cv.pdf", PDF_TYPE, MAX_FILE_SIZE_BYTES + 1));

    expect(screen.getByRole("alert")).toHaveTextContent("El archivo supera el límite de 5 MB.");
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
  });

  it("shows an error for an empty pdf", async () => {
    const user = userEvent.setup();
    await renderView();

    await user.upload(getFileInput(), createFile("cv.pdf", PDF_TYPE, 0));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El archivo está vacío. Selecciona otro archivo.",
    );
  });

  it("clears the error when a valid pdf is chosen after an invalid one", async () => {
    const user = userEvent.setup({ applyAccept: false });
    await renderView();

    await user.upload(getFileInput(), createFile("foto.png", "image/png"));
    await user.upload(getFileInput(), createFile("CV_Valeria_Quispe.pdf"));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("CV_Valeria_Quispe.pdf · 1.2 MB")).toBeInTheDocument();
  });

  it("ignores a selection without files", async () => {
    await renderView();

    fireEvent.change(getFileInput(), { target: { files: [] } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar carga" })).toBeDisabled();
  });

  it("shows the spinner and blocks repeated clicks while uploading", async () => {
    const user = userEvent.setup();
    const pendingUpload = createDeferred<SavedCv>();
    vi.mocked(documentsService.uploadCv).mockReturnValueOnce(pendingUpload.promise);
    await renderView();

    await chooseAndConfirm(user, createFile("CV_Nuevo.pdf"));

    const uploadingButton = await screen.findByRole("button", { name: "Cargando..." });

    expect(uploadingButton).toBeDisabled();
    expect(uploadingButton.querySelector("svg.lucide-loader-circle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar PDF" })).toBeDisabled();

    await user.click(uploadingButton);

    expect(documentsService.uploadCv).toHaveBeenCalledTimes(1);

    await act(async () => {
      const cv = buildCv("CV_Nuevo.pdf");
      storeCv(cv);
      pendingUpload.resolve(cv);
    });

    expect(await screen.findByRole("status")).toHaveTextContent("Tu CV se cargó correctamente.");
    expect(screen.getByText("CV_Nuevo.pdf")).toBeInTheDocument();
  });

  it("asks to confirm a new version showing the selected file", async () => {
    const user = userEvent.setup();
    seedCvs("CV_Valeria_Quispe.pdf");
    await renderView();
    const clickSpy = vi.spyOn(getFileInput(), "click");

    await user.click(screen.getByRole("button", { name: "Subir nueva versión" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);

    await user.upload(getFileInput(), createFile("CV_Nuevo.pdf"));

    const dialog = await screen.findByRole("alertdialog", { name: "¿Subir una nueva versión?" });

    expect(dialog).toHaveAccessibleDescription(
      "El archivo seleccionado será tu CV vigente. CV_Valeria_Quispe.pdf pasará al historial.",
    );
    expect(screen.getByText("CV_Nuevo.pdf · 1.2 MB")).toBeInTheDocument();
    expect(documentsService.uploadCv).not.toHaveBeenCalled();
  });

  it("keeps the previous cv in the list after uploading a new version", async () => {
    const user = userEvent.setup();
    seedCvs("CV_Valeria_Quispe.pdf");
    await renderView();
    const file = createFile("CV_Nuevo.pdf");

    await user.upload(getFileInput(), file);
    await user.click(await screen.findByRole("button", { name: "Subir" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(documentsService.uploadCv).toHaveBeenCalledWith(file);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Tu nueva versión del CV se cargó correctamente.",
    );
    const items = getRecentItems();
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("CV_Nuevo.pdf")).toBeInTheDocument();
    expect(within(items[0]).getByText("Vigente")).toBeInTheDocument();
    expect(within(items[1]).getByText("CV_Valeria_Quispe.pdf")).toBeInTheDocument();
    expect(within(items[1]).queryByText("Vigente")).not.toBeInTheDocument();
  });

  it("keeps the saved cvs when cancelling the new version", async () => {
    const user = userEvent.setup();
    seedCvs("CV_Valeria_Quispe.pdf");
    await renderView();

    await user.upload(getFileInput(), createFile("CV_Nuevo.pdf"));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(documentsService.uploadCv).not.toHaveBeenCalled();
    expect(getRecentItems()).toHaveLength(1);
  });

  it("shows the validation error without opening the dialog for an invalid new version", async () => {
    const user = userEvent.setup({ applyAccept: false });
    seedCvs("CV_Valeria_Quispe.pdf");
    await renderView();

    await user.upload(getFileInput(), createFile("foto.png", "image/png"));

    expect(screen.getByRole("alert")).toHaveTextContent("El CV debe estar en formato PDF.");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows the spinner in the dialog and blocks the actions while uploading a new version", async () => {
    const user = userEvent.setup();
    const pendingUpload = createDeferred<SavedCv>();
    seedCvs("CV_Valeria_Quispe.pdf");
    vi.mocked(documentsService.uploadCv).mockReturnValueOnce(pendingUpload.promise);
    await renderView();

    await user.upload(getFileInput(), createFile("CV_Nuevo.pdf"));
    await user.click(await screen.findByRole("button", { name: "Subir" }));

    const uploadingButton = await screen.findByRole("button", { name: "Subiendo..." });

    expect(uploadingButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    await act(async () => {
      const cv = buildCv("CV_Nuevo.pdf");
      storeCv(cv);
      pendingUpload.resolve(cv);
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Tu nueva versión del CV se cargó correctamente.",
    );
  });

  it("keeps the dialog open with the error to retry after a network error", async () => {
    const user = userEvent.setup();
    seedCvs("CV_Valeria_Quispe.pdf");
    vi.mocked(documentsService.uploadCv).mockRejectedValueOnce(new Error("Network Error"));
    await renderView();

    await user.upload(getFileInput(), createFile("CV_Nuevo.pdf"));
    await user.click(await screen.findByRole("button", { name: "Subir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo subir tu CV. Intenta de nuevo.",
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Subir" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(documentsService.uploadCv).toHaveBeenCalledTimes(2);
  });

  it("closes the dialog and keeps the saved cvs when the server rejects the new version", async () => {
    const user = userEvent.setup();
    seedCvs("CV_Valeria_Quispe.pdf");
    vi.mocked(documentsService.uploadCv).mockRejectedValueOnce({
      response: { status: 400, data: { data: { code: "CORRUPTED_FILE" } } },
    });
    await renderView();

    await user.upload(getFileInput(), createFile("CV_Nuevo.pdf"));
    await user.click(await screen.findByRole("button", { name: "Subir" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "El archivo está dañado o incompleto. Selecciona otro PDF.",
    );
    expect(screen.getByText("CV_Valeria_Quispe.pdf")).toBeInTheDocument();
  });

  it("keeps the cv when cancelling the delete dialog", async () => {
    const user = userEvent.setup();
    seedCvs("CV_Valeria_Quispe.pdf");
    await renderView();

    await user.click(screen.getByRole("button", { name: "Eliminar CV_Valeria_Quispe.pdf" }));

    expect(
      await screen.findByRole("alertdialog", { name: "¿Eliminar este CV?" }),
    ).toHaveAccessibleDescription("CV_Valeria_Quispe.pdf dejará de estar disponible en tu perfil.");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(documentsService.deleteCv).not.toHaveBeenCalled();
    expect(screen.getByText("CV_Valeria_Quispe.pdf")).toBeInTheDocument();
  });

  it("makes the previous cv current after deleting the current one", async () => {
    const user = userEvent.setup();
    seedCvs("CV_2026.pdf", "CV_2025.pdf");
    await renderView();

    await user.click(screen.getByRole("button", { name: "Eliminar CV_2026.pdf" }));

    expect(await screen.findByRole("alertdialog")).toHaveAccessibleDescription(
      "CV_2026.pdf dejará de estar disponible en tu perfil. Tu CV anterior más reciente pasará a ser el vigente.",
    );

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(documentsService.deleteCv).toHaveBeenCalledWith("cv-2");
    expect(screen.getByRole("status")).toHaveTextContent("El CV se eliminó.");
    const items = getRecentItems();
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText("CV_2025.pdf")).toBeInTheDocument();
    expect(within(items[0]).getByText("Vigente")).toBeInTheDocument();
  });

  it("restores the first upload when the only cv is deleted", async () => {
    const user = userEvent.setup();
    seedCvs("CV_Valeria_Quispe.pdf");
    await renderView();

    await user.click(screen.getByRole("button", { name: "Eliminar CV_Valeria_Quispe.pdf" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(
      screen.getByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar PDF" })).toBeEnabled();
  });

  it("disables the cv actions while deleting", async () => {
    const user = userEvent.setup();
    const pendingDelete = createDeferred<void>();
    seedCvs("CV_Valeria_Quispe.pdf");
    vi.mocked(documentsService.deleteCv).mockReturnValueOnce(pendingDelete.promise);
    await renderView();

    await user.click(screen.getByRole("button", { name: "Eliminar CV_Valeria_Quispe.pdf" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    expect(await screen.findByRole("button", { name: "Eliminando..." })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Subir nueva versión", hidden: true }),
    ).toBeDisabled();

    await act(async () => {
      serverCvs = [];
      pendingDelete.resolve();
    });

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("keeps the cv and shows a spanish message when the server fails to delete it", async () => {
    const user = userEvent.setup();
    seedCvs("CV_Valeria_Quispe.pdf");
    vi.mocked(documentsService.deleteCv).mockRejectedValueOnce({ response: { status: 404 } });
    await renderView();

    await user.click(screen.getByRole("button", { name: "Eliminar CV_Valeria_Quispe.pdf" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("No encontramos tu CV. Recarga la página.");
    expect(screen.getByText("CV_Valeria_Quispe.pdf")).toBeInTheDocument();
  });

  it("shows only the five most recent cvs and the full history on demand", async () => {
    const user = userEvent.setup();
    seedCvs(...Array.from({ length: 7 }, (_, index) => `CV_${index + 1}.pdf`));
    await renderView();

    expect(getRecentItems()).toHaveLength(5);
    expect(screen.queryByText("CV_6.pdf")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver historial (7)" }));

    const history = await screen.findByRole("dialog", { name: "Historial de CVs" });
    await waitFor(() =>
      expect(within(history).getAllByRole("listitem")).toHaveLength(7),
    );
    expect(within(history).getByText("CV_7.pdf")).toBeInTheDocument();

    await user.click(within(history).getByRole("button", { name: "Cerrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("deletes an old cv from the history and refreshes both lists", async () => {
    const user = userEvent.setup();
    seedCvs(...Array.from({ length: 7 }, (_, index) => `CV_${index + 1}.pdf`));
    await renderView();

    await user.click(screen.getByRole("button", { name: "Ver historial (7)" }));
    const history = await screen.findByRole("dialog", { name: "Historial de CVs" });
    await waitFor(() => expect(within(history).getAllByRole("listitem")).toHaveLength(7));

    await user.click(within(history).getByRole("button", { name: "Eliminar CV_7.pdf" }));
    const confirmation = await screen.findByRole("alertdialog", { name: "¿Eliminar este CV?" });
    await user.click(within(confirmation).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(within(history).getAllByRole("listitem")).toHaveLength(6));
    expect(within(history).queryByText("CV_7.pdf")).not.toBeInTheDocument();
    expect(within(history).getByRole("status")).toHaveTextContent("El CV se eliminó.");
  });

  it("opens the chosen cv in the viewer and closes it", async () => {
    const user = userEvent.setup();
    seedCvs("CV_2026.pdf", "CV_2025.pdf");
    await renderView();

    await user.click(screen.getByRole("button", { name: "Ver CV_2025.pdf" }));

    const viewer = await screen.findByRole("dialog", { name: "Vista previa del CV" });
    expect(documentsService.getCvFile).toHaveBeenCalledWith("cv-1");
    expect(within(viewer).getByTitle("Vista previa de CV_2025.pdf")).toHaveAttribute("src", "blob:cv");
    expect(within(viewer).getByRole("button", { name: "Descargar" })).toBeEnabled();

    await user.click(within(viewer).getByRole("button", { name: "Cerrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:cv");
  });

  it("shows a spanish message when the cv cannot be opened", async () => {
    const user = userEvent.setup();
    seedCvs("CV_2026.pdf");
    vi.mocked(documentsService.getCvFile).mockRejectedValueOnce({ response: { status: 404 } });
    await renderView();

    await user.click(screen.getByRole("button", { name: "Ver CV_2026.pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No encontramos tu CV. Recarga la página.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
