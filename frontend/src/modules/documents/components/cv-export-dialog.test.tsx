import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsService } from "../services/documents.service";
import { CvExportDialog } from "./cv-export-dialog";

const downloadFileMock = vi.hoisted(() => vi.fn());
const useProfileCompletenessMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/utils/download-file", () => ({
  downloadFile: downloadFileMock,
}));

vi.mock("@/modules/profile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/profile")>();
  return {
    ...actual,
    useProfileCompleteness: useProfileCompletenessMock,
  };
});

vi.mock("../services/documents.service", () => ({
  documentsService: {
    generateCv: vi.fn(),
    uploadCv: vi.fn(),
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
    vi.mocked(documentsService.uploadCv).mockResolvedValue(null);
    vi.mocked(documentsService.getPortfolioProjectCount).mockResolvedValue(6);
    useProfileCompletenessMock.mockReturnValue({
      completeness: null,
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
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
    const { user, onClose } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledWith(PDF, FILE_NAME));
    expect(documentsService.generateCv).toHaveBeenCalledTimes(1);
    expect(documentsService.uploadCv).toHaveBeenCalledTimes(1);
    const [uploadedFile] = vi.mocked(documentsService.uploadCv).mock.calls[0];
    expect(uploadedFile).toBeInstanceOf(File);
    expect(uploadedFile.name).toBe(FILE_NAME);
    expect(onClose).toHaveBeenCalled();
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

  it("renders a cordial warning banner when profile completeness is below 50%", async () => {
    useProfileCompletenessMock.mockReturnValue({
      completeness: { percentage: 35, sections: [] },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    await renderDialog();

    expect(screen.getByText("Perfil con nivel de completitud bajo (35%)")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Te sugerimos registrar más información en tu perfil para que tu currículum destaque ante reclutadores.",
      ),
    ).toBeInTheDocument();
  });

  it("does not render the low completeness banner when completeness is 50% or higher", async () => {
    useProfileCompletenessMock.mockReturnValue({
      completeness: { percentage: 50, sections: [] },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    await renderDialog();

    expect(screen.queryByText(/Perfil con nivel de completitud bajo/)).not.toBeInTheDocument();
  });

  it("prompts the user with a confirmation alert dialog on download when completeness is below 50%", async () => {
    useProfileCompletenessMock.mockReturnValue({
      completeness: { percentage: 30, sections: [] },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Perfil con información incompleta" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tu perfil cuenta actualmente con menos del 50% de la información registrada (30%). Te sugerimos completar más datos para obtener un currículum más competitivo, pero puedes continuar con la descarga si lo prefieres.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar de todos modos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Completar mi perfil" })).toBeInTheDocument();
    expect(documentsService.generateCv).not.toHaveBeenCalled();
  });

  it("proceeds with CV generation and download when clicking Continuar de todos modos", async () => {
    useProfileCompletenessMock.mockReturnValue({
      completeness: { percentage: 30, sections: [] },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));
    await user.click(screen.getByRole("button", { name: "Continuar de todos modos" }));

    await waitFor(() => expect(documentsService.generateCv).toHaveBeenCalledWith(ALL_SECTIONS));
    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledWith(PDF, FILE_NAME));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("does not prompt again on subsequent downloads once confirmed in the same session", async () => {
    useProfileCompletenessMock.mockReturnValue({
      completeness: { percentage: 30, sections: [] },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));
    await user.click(screen.getByRole("button", { name: "Continuar de todos modos" }));
    await waitFor(() => expect(documentsService.generateCv).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(documentsService.generateCv).toHaveBeenCalledTimes(1);
  });

  it("closes the dialog when clicking Completar mi perfil in the warning dialog", async () => {
    useProfileCompletenessMock.mockReturnValue({
      completeness: { percentage: 30, sections: [] },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    const { user, onClose } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));
    await user.click(screen.getByRole("button", { name: "Completar mi perfil" }));

    expect(onClose).toHaveBeenCalled();
    expect(documentsService.generateCv).not.toHaveBeenCalled();
  });

  it("downloads directly without alert dialog when completeness is 50% or higher", async () => {
    useProfileCompletenessMock.mockReturnValue({
      completeness: { percentage: 75, sections: [] },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    const { user } = await renderDialog();

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(documentsService.generateCv).toHaveBeenCalledWith(ALL_SECTIONS));
    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledWith(PDF, FILE_NAME));
  });
});

