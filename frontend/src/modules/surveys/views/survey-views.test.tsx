import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { surveysService } from "../services/surveys.service";
import { apiResponse, SURVEY_SUMMARIES } from "../testing/survey-fixtures";
import { SurveyAnalyticsView } from "./survey-analytics-view";

describe("Pantallas de encuestas", () => {
  beforeEach(() => {
    vi.spyOn(surveysService, "listSurveys").mockResolvedValue(apiResponse(SURVEY_SUMMARIES));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra la pantalla de analíticas de encuesta, permite generar PDF y muestra confirmación", async () => {
    const mockStats = {
      id: "survey-1",
      title: "Encuesta Inteligencia Artificial",
      description: "Encuesta sobre IA",
      status: "published" as const,
      academicPeriod: "1-2026",
      career: { id: "c1", title: "Ingeniería de Sistemas" },
      opensAt: "2026-08-14T00:00:00.000Z",
      closesAt: "2027-02-10T00:00:00.000Z",
      totalResponses: 105,
      questions: [
        {
          id: "q1",
          position: 1,
          statement: "¿Utilizas herramientas de IA asistida?",
          type: "single_choice" as const,
          isRequired: true,
          answeredCount: 105,
          totalSelections: 105,
          options: [
            { id: "o1", label: "Diariamente", count: 21, percentage: 20 },
            { id: "o2", label: "Frecuentemente", count: 34, percentage: 32.4 },
          ],
        },
      ],
    };

    vi.spyOn(surveysService, "getSurveyStatistics").mockResolvedValue(apiResponse(mockStats));
    const exportSpy = vi.spyOn(surveysService, "exportSurveyPdf").mockResolvedValue({
      file: new Blob(["pdf-content"], { type: "application/pdf" }),
      fileName: "reporte-encuesta-ia.pdf",
    });

    renderWithQuery(<SurveyAnalyticsView id="survey-1" />);

    expect(await screen.findByText("Analíticas: Encuesta Inteligencia Artificial")).toBeInTheDocument();
    expect(screen.getByText("Respuestas Recibidas")).toBeInTheDocument();
    expect(screen.getByText("105")).toBeInTheDocument();

    const generatePdfButton = screen.getByRole("button", { name: /Generar PDF/i });
    expect(generatePdfButton).toBeInTheDocument();

    fireEvent.click(generatePdfButton);

    expect(exportSpy).toHaveBeenCalledWith("survey-1");
    expect(await screen.findByText("PDF generado correctamente")).toBeInTheDocument();
  });
});
