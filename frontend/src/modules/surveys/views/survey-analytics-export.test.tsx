import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { downloadFile } from "@/shared/utils/download-file";
import { resetSurveyTables } from "../mocks/survey-store.mock";
import { surveysService } from "../services/surveys.service";
import { renderSurveyReportPdf } from "../utils/render-survey-report-pdf";
import { SurveyAnalyticsView } from "./survey-analytics-view";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/shared/utils/download-file", () => ({ downloadFile: vi.fn() }));
vi.mock("../utils/render-survey-report-pdf", () => ({ renderSurveyReportPdf: vi.fn() }));

const PDF_FILE = new Blob(["%PDF-"], { type: "application/pdf" });

function exportButton() {
  return screen.getByRole("button", { name: /Exportar PDF|Generando/ });
}

async function renderAnalytics(id = "srv-demo") {
  renderWithQuery(<SurveyAnalyticsView id={id} />);
  await waitFor(() => expect(exportButton().hasAttribute("disabled")).toBe(false));
}

describe("Exportar PDF (HU5)", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSurveyTables();
    vi.mocked(renderSurveyReportPdf).mockResolvedValue(PDF_FILE);
    URL.createObjectURL = vi.fn(() => "blob:reporte");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra la vista previa del reporte antes de descargarlo", async () => {
    await renderAnalytics();

    fireEvent.click(exportButton());

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Vista previa del reporte")).toBeDefined();
    expect(within(dialog).getByTitle("Vista previa del reporte").getAttribute("src")).toBe("blob:reporte");
    expect(within(dialog).getByText(/^reporte-encuesta-encuesta-de-empleabilidad-de-egresados-ejemplo-\d{4}-\d{2}-\d{2}\.pdf$/)).toBeDefined();
    expect(downloadFile).not.toHaveBeenCalled();
    const [report] = vi.mocked(renderSurveyReportPdf).mock.calls[0];
    expect(report.statistics.survey.id).toBe("srv-demo");
    expect(report.metrics.respondedCount).toBe(248);
  });

  it("al confirmar avisa con un toast y descarga el archivo", async () => {
    await renderAnalytics();
    fireEvent.click(exportButton());
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "Descargar PDF" }));

    expect(toast.success).toHaveBeenCalledWith("Reporte PDF generado. La descarga comenzará en un momento.", expect.any(Object));
    expect(downloadFile).toHaveBeenCalledWith(PDF_FILE, expect.stringMatching(/\.pdf$/));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:reporte");
  });

  it("al cancelar cierra la vista previa sin descargar", async () => {
    await renderAnalytics();
    fireEvent.click(exportButton());
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(downloadFile).not.toHaveBeenCalled();
  });

  it("avisa con un toast si no se pudo generar el PDF", async () => {
    vi.mocked(renderSurveyReportPdf).mockRejectedValue(new Error("fallo"));
    await renderAnalytics();

    fireEvent.click(exportButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo generar el reporte PDF. Intenta de nuevo.", expect.any(Object)));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(exportButton().hasAttribute("disabled")).toBe(false);
  });

  it("deshabilita el botón mientras genera el PDF", async () => {
    vi.mocked(renderSurveyReportPdf).mockReturnValue(new Promise(() => {}));
    await renderAnalytics();

    fireEvent.click(exportButton());

    await waitFor(() => expect(screen.getByRole("button", { name: "Generando vista previa..." }).hasAttribute("disabled")).toBe(true));
  });

  it("deshabilita la exportación si la encuesta no tiene respuestas", async () => {
    const created = await surveysService.createSurvey({
      title: "Sin respuestas",
      description: "",
      targetCareer: null,
      period: "II-2026",
      opensAt: "2099-01-01",
      closesAt: "2099-02-01",
      questions: [{ text: "¿Trabajas?", type: "SINGLE_CHOICE", isRequired: true, options: ["Sí", "No"] }],
    });
    await surveysService.changeSurveyStatus(created.data.id, "PUBLISHED");

    renderWithQuery(<SurveyAnalyticsView id={created.data.id} />);

    await screen.findByText(/todavía no tiene respuestas registradas/);
    expect(exportButton().hasAttribute("disabled")).toBe(true);
    expect(exportButton().getAttribute("title")).toBe("No hay respuestas registradas para exportar");
  });
});
