import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsService } from "../services/documents.service";
import type { CvPage } from "../types/cv-page.types";
import type { SavedCv } from "../types/saved-cv.types";
import { CvHistoryDialog } from "./cv-history-dialog";

vi.mock("../services/documents.service", () => ({
  documentsService: {
    getCvs: vi.fn(),
    getCvFile: vi.fn(),
    uploadCv: vi.fn(),
    deleteCv: vi.fn(),
  },
}));

function buildCv(index: number): SavedCv {
  return {
    id: `cv-${index}`,
    fileName: `CV_${index}.pdf`,
    fileType: "PDF",
    sizeInBytes: 1024,
    updatedAt: new Date(2026, 8, 30 - index),
    isCurrent: index === 1,
  };
}

let serverCvs: SavedCv[] = [];

function getPage(page: number, limit: number): Promise<CvPage> {
  const start = (page - 1) * limit;
  return Promise.resolve({
    items: serverCvs.slice(start, start + limit),
    totalItems: serverCvs.length,
    totalPages: Math.ceil(serverCvs.length / limit),
    page,
  });
}

function renderDialog(props: Partial<Parameters<typeof CvHistoryDialog>[0]> = {}) {
  const onDelete = vi.fn((cv: SavedCv) => {
    serverCvs = serverCvs.filter((item) => item.id !== cv.id);
    return Promise.resolve();
  });
  const onClose = vi.fn();
  const view = render(
    <CvHistoryDialog isOpen onDelete={onDelete} onClose={onClose} {...props} />,
  );
  return { onDelete, onClose, user: userEvent.setup(), ...view };
}

function getHistoryItems() {
  return within(screen.getByRole("list", { name: "Historial de CVs" })).getAllByRole("listitem");
}

describe("CvHistoryDialog", () => {
  beforeEach(() => {
    serverCvs = Array.from({ length: 12 }, (_, index) => buildCv(index + 1));
    vi.mocked(documentsService.getCvs).mockImplementation(getPage);
    vi.mocked(documentsService.getCvFile).mockResolvedValue(
      new Blob(["%PDF"], { type: "application/pdf" }),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cv");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("renders nothing while closed", () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(documentsService.getCvs).not.toHaveBeenCalled();
  });

  it("lists the first page of the history newest first", async () => {
    renderDialog();

    expect(await screen.findByRole("dialog", { name: "Historial de CVs" })).toBeInTheDocument();
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));
    expect(documentsService.getCvs).toHaveBeenCalledWith(1, 10);
    expect(within(getHistoryItems()[0]).getByText("Vigente")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  });

  it("moves between pages", async () => {
    const { user } = renderDialog();
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(getHistoryItems()).toHaveLength(2));
    expect(screen.getByText("CV_11.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Anterior" }));

    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));
  });

  it("hides the pagination with a single page", async () => {
    serverCvs = [buildCv(1), buildCv(2)];
    renderDialog();

    await waitFor(() => expect(getHistoryItems()).toHaveLength(2));
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
  });

  it("shows an empty message without cvs", async () => {
    serverCvs = [];
    renderDialog();

    expect(await screen.findByText("Aún no tienes CVs guardados.")).toBeInTheDocument();
  });

  it("shows a spanish error when the history cannot be loaded", async () => {
    vi.mocked(documentsService.getCvs).mockRejectedValue(new Error("Network Error"));
    renderDialog();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo cargar el historial de CVs. Intenta de nuevo más tarde.",
    );
  });

  it("asks for confirmation inside the history before deleting a cv", async () => {
    const { onDelete, user } = renderDialog();
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));

    await user.click(screen.getByRole("button", { name: "Eliminar CV_3.pdf" }));
    const confirmation = await screen.findByRole("alertdialog", { name: "¿Eliminar este CV?" });
    await user.click(within(confirmation).getByRole("button", { name: "Eliminar" }));

    expect(onDelete).toHaveBeenCalledWith(buildCv(3));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    const history = screen.getByRole("dialog", { name: "Historial de CVs" });
    expect(within(history).getByRole("status")).toHaveTextContent("El CV se eliminó.");
  });

  it("shows inside the history why a cv could not be deleted", async () => {
    const { user } = renderDialog({ onDelete: vi.fn().mockRejectedValue({ response: { status: 500 } }) });
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));

    await user.click(screen.getByRole("button", { name: "Eliminar CV_3.pdf" }));
    const confirmation = await screen.findByRole("alertdialog", { name: "¿Eliminar este CV?" });
    await user.click(within(confirmation).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    const history = screen.getByRole("dialog", { name: "Historial de CVs" });
    expect(within(history).getByRole("alert")).toHaveTextContent(
      "No se pudo eliminar tu CV. Intenta de nuevo.",
    );
    expect(within(history).getByText("CV_3.pdf")).toBeInTheDocument();
  });

  it("keeps the cv when cancelling the confirmation", async () => {
    const { onDelete, user } = renderDialog();
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));

    await user.click(screen.getByRole("button", { name: "Eliminar CV_3.pdf" }));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("goes back to the last page when the current one becomes empty", async () => {
    serverCvs = Array.from({ length: 11 }, (_, index) => buildCv(index + 1));
    const { user, client } = renderDialog();
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(screen.getByText("Página 2 de 2")).toBeInTheDocument());

    serverCvs = serverCvs.slice(0, 10);
    await client.invalidateQueries();

    await waitFor(() => expect(screen.queryByText(/Página/)).not.toBeInTheDocument());
    expect(getHistoryItems()).toHaveLength(10);
  });

  it("disables the actions while deleting", async () => {
    renderDialog({ isDeleting: true });
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));

    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Eliminar CV_1.pdf" })).toBeDisabled();
  });

  it("opens an old cv in the viewer on top of the history", async () => {
    const { user } = renderDialog();
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));

    await user.click(screen.getByRole("button", { name: "Ver CV_8.pdf" }));

    const viewer = await screen.findByRole("dialog", { name: "Vista previa del CV" });
    expect(documentsService.getCvFile).toHaveBeenCalledWith("cv-8");
    expect(within(viewer).getByTitle("Vista previa de CV_8.pdf")).toBeInTheDocument();

    await user.click(within(viewer).getByRole("button", { name: "Cerrar" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Vista previa del CV" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog", { name: "Historial de CVs" })).toBeInTheDocument();
  });

  it("shows a spanish error inside the history when a cv cannot be opened", async () => {
    vi.mocked(documentsService.getCvFile).mockRejectedValueOnce(new Error("Network Error"));
    const { user } = renderDialog();
    await waitFor(() => expect(getHistoryItems()).toHaveLength(10));

    await user.click(screen.getByRole("button", { name: "Ver CV_8.pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo abrir el CV. Intenta de nuevo.",
    );
    expect(screen.queryByRole("dialog", { name: "Vista previa del CV" })).not.toBeInTheDocument();
  });

  it("closes from Cerrar", async () => {
    const { onClose, user } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
