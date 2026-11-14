import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsService } from "../services/documents.service";
import { CvExportDialog } from "./cv-export-dialog";

const downloadFileMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/utils/download-file", () => ({
  downloadFile: downloadFileMock,
}));

vi.mock("../services/documents.service", () => ({
  documentsService: {
    generateCv: vi.fn(),
    getPortfolioProjectCount: vi.fn(),
  },
}));

const PDF = new Blob(["%PDF"], { type: "application/pdf" });
const FILE_URL = "blob:generated-cv";
const FILE_NAME = "CV_Valeria_Quispe.pdf";
const ALL_SECTIONS = {
  includeContactInfo: true,
  includeSummary: true,
  includeWorkExperience: true,
  includeEducation: true,
  includeCertifications: true,
  includeProjects: true,
};

async function renderDialog(isOpen = true) {
  const onClose = vi.fn();
  const { client } = render(<CvExportDialog isOpen={isOpen} onClose={onClose} />);

  if (isOpen) {
    await screen.findByRole("dialog");
    await waitFor(() => expect(client.isFetching()).toBe(0));
  }

  return { onClose, user: userEvent.setup() };
}

describe("CvExportDialog", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue(FILE_URL);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.mocked(documentsService.generateCv).mockResolvedValue({ file: PDF, fileName: FILE_NAME });
    vi.mocked(documentsService.getPortfolioProjectCount).mockResolvedValue(6);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("renders nothing while it is closed", async () => {
    await renderDialog(false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on the first step without requesting the cv", async () => {
    await renderDialog();

    expect(screen.getByRole("dialog", { name: "Generar CV profesional" })).toHaveAccessibleDescription(
      "Personaliza las secciones y descarga tu currículum en formato PDF.",
    );
    expect(
      screen.getByText(
        "El documento se maquetará en plantilla institucional optimizada de 1 a 2 páginas para postulaciones laborales.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previsualizar diseño del PDF" })).toBeInTheDocument();
    expect(screen.getByText("Formato A4 · Estándar ATS")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar CV en PDF" })).toBeInTheDocument();
    expect(documentsService.generateCv).not.toHaveBeenCalled();
  });

  it("lists every optional section checked by default as in the mockup", async () => {
    await renderDialog();

    expect(screen.getByText("Selecciona las secciones a incluir en el documento:")).toBeInTheDocument();
    expect(screen.getByText("6 de 6 activas")).toBeInTheDocument();
    for (const name of [
      "Datos personales y de contacto",
      "Presentación profesional",
      "Experiencia laboral",
      "Formación académica",
      "Certificaciones",
      "Proyectos de código y portafolio (GitHub / GitLab)",
    ]) {
      expect(screen.getByRole("checkbox", { name })).toBeChecked();
    }
    expect(await screen.findByText("6 repositorios")).toBeInTheDocument();
  });

  it("sends every section enabled when nothing is unchecked", async () => {
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await waitFor(() => expect(documentsService.generateCv).toHaveBeenCalledWith(ALL_SECTIONS));
  });

  it("sends the unchecked sections as excluded in the generation request", async () => {
    const { user } = await renderDialog();

    await user.click(screen.getByRole("checkbox", { name: "Certificaciones" }));
    await user.click(screen.getByRole("checkbox", { name: "Experiencia laboral" }));

    expect(screen.getByText("4 de 6 activas")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Certificaciones" })).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await waitFor(() =>
      expect(documentsService.generateCv).toHaveBeenCalledWith({
        ...ALL_SECTIONS,
        includeCertifications: false,
        includeWorkExperience: false,
      }),
    );
  });

  it("includes a section again when it is checked back", async () => {
    const { user } = await renderDialog();

    await user.click(screen.getByRole("checkbox", { name: "Formación académica" }));
    await user.click(screen.getByRole("checkbox", { name: "Formación académica" }));
    await user.click(screen.getByRole("button", { name: "Previsualizar diseño del PDF" }));

    await screen.findByTitle(`Vista previa de ${FILE_NAME}`);
    expect(documentsService.generateCv).toHaveBeenCalledWith(ALL_SECTIONS);
  });

  it("generates the cv again when the sections change after a preview", async () => {
    const { user } = await renderDialog();
    await user.click(screen.getByRole("button", { name: "Previsualizar diseño del PDF" }));
    await screen.findByTitle(`Vista previa de ${FILE_NAME}`);
    await user.click(screen.getByRole("button", { name: "Volver a secciones" }));

    await user.click(screen.getByRole("checkbox", { name: "Presentación profesional" }));
    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await waitFor(() => expect(documentsService.generateCv).toHaveBeenCalledTimes(2));
    expect(documentsService.generateCv).toHaveBeenLastCalledWith({ ...ALL_SECTIONS, includeSummary: false });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(FILE_URL);
  });

  it("keeps the sections chosen when coming back from the preview", async () => {
    const { user } = await renderDialog();
    await user.click(screen.getByRole("checkbox", { name: "Certificaciones" }));
    await user.click(screen.getByRole("button", { name: "Previsualizar diseño del PDF" }));
    await screen.findByTitle(`Vista previa de ${FILE_NAME}`);

    expect(screen.queryByRole("checkbox", { name: "Certificaciones" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Volver a secciones" }));

    expect(screen.getByRole("checkbox", { name: "Certificaciones" })).not.toBeChecked();
    expect(screen.getByText("5 de 6 activas")).toBeInTheDocument();
  });

  it("blocks the sections while the cv is generated", async () => {
    vi.mocked(documentsService.generateCv).mockReturnValue(new Promise(() => {}));
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await screen.findByText("Generando tu CV...");
    expect(screen.getByRole("checkbox", { name: "Certificaciones" })).toHaveAttribute("aria-disabled", "true");
  });

  it("clears a previous error when a section changes", async () => {
    vi.mocked(documentsService.generateCv).mockRejectedValueOnce({ response: { status: 500 } });
    const { user } = await renderDialog();
    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));
    await screen.findByRole("alert");

    await user.click(screen.getByRole("checkbox", { name: "Certificaciones" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hides the repositories badge when the user has no portfolio projects", async () => {
    vi.mocked(documentsService.getPortfolioProjectCount).mockResolvedValue(0);
    await renderDialog();

    expect(screen.queryByText(/repositorio/)).not.toBeInTheDocument();
  });

  it("hides the repositories badge when the portfolio cannot be loaded", async () => {
    vi.mocked(documentsService.getPortfolioProjectCount).mockRejectedValue(new Error("Network Error"));
    await renderDialog();

    expect(screen.queryByText(/repositorio/)).not.toBeInTheDocument();
  });

  it("shows a progress indicator while the cv is generated", async () => {
    vi.mocked(documentsService.generateCv).mockReturnValue(new Promise(() => {}));
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    expect(await screen.findByText("Generando tu CV...")).toBeVisible();
    expect(screen.getByRole("button", { name: "Descargar CV en PDF" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previsualizar diseño del PDF" })).toBeDisabled();
  });

  it("generates the cv and downloads it named after the user", async () => {
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledWith(PDF, FILE_NAME));
    expect(documentsService.generateCv).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses the fallback file name when returned by the service", async () => {
    vi.mocked(documentsService.generateCv).mockResolvedValueOnce({ file: PDF, fileName: "CV.pdf" });
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledWith(PDF, "CV.pdf"));
  });

  it("previews the institutional layout of the generated cv", async () => {
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Previsualizar diseño del PDF" }));

    expect(await screen.findByTitle(`Vista previa de ${FILE_NAME}`)).toHaveAttribute("src", FILE_URL);
    expect(screen.getByText("Vista previa de maquetación institucional (A4)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previsualizar diseño del PDF" })).not.toBeInTheDocument();
  });

  it("downloads the previewed cv without generating it again", async () => {
    const { user } = await renderDialog();
    await user.click(screen.getByRole("button", { name: "Previsualizar diseño del PDF" }));
    await screen.findByTitle(`Vista previa de ${FILE_NAME}`);

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledWith(PDF, FILE_NAME));
    expect(documentsService.generateCv).toHaveBeenCalledTimes(1);
  });

  it("goes back to the first step and reuses the generated cv", async () => {
    const { user } = await renderDialog();
    await user.click(screen.getByRole("button", { name: "Previsualizar diseño del PDF" }));
    await screen.findByTitle(`Vista previa de ${FILE_NAME}`);

    await user.click(screen.getByRole("button", { name: "Volver a secciones" }));

    expect(screen.queryByTitle(`Vista previa de ${FILE_NAME}`)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previsualizar diseño del PDF" }));

    expect(await screen.findByTitle(`Vista previa de ${FILE_NAME}`)).toBeInTheDocument();
    expect(documentsService.generateCv).toHaveBeenCalledTimes(1);
  });

  it("shows a spanish error when the cv cannot be generated", async () => {
    vi.mocked(documentsService.generateCv).mockRejectedValueOnce({ response: { status: 500 } });
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo generar tu CV. Intenta de nuevo.");
    expect(downloadFileMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledWith(PDF, FILE_NAME));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays on the first step when the preview cannot be generated", async () => {
    vi.mocked(documentsService.generateCv).mockRejectedValueOnce({ response: { status: 404 } });
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Previsualizar diseño del PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No encontramos tu perfil. Completa tus datos e intenta de nuevo.",
    );
    expect(screen.getByRole("button", { name: "Previsualizar diseño del PDF" })).toBeInTheDocument();
  });

  it("shows a spanish error when the download fails", async () => {
    downloadFileMock.mockImplementationOnce(() => {
      throw new Error("Blocked");
    });
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo descargar el CV. Intenta de nuevo.");
  });

  it("closes from Cancelar", async () => {
    const { onClose, user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close button of the header", async () => {
    const { onClose, user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with the escape key", async () => {
    const { onClose, user } = await renderDialog();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});
