import { beforeEach, describe, expect, it } from "vitest";
import { resetSurveyTables } from "../mocks/survey-store.mock";
import { surveysService } from "../services/surveys.service";
import { buildMetricCards } from "./build-metric-cards";
import { getSurveyReportFileName } from "./get-survey-report-file-name";
import { renderSurveyReportPdf } from "./render-survey-report-pdf";

describe("reporte PDF de una encuesta", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSurveyTables();
  });

  it("arma el nombre del archivo sin acentos ni símbolos y con la fecha de Bolivia", () => {
    expect(getSurveyReportFileName("Encuesta de Empleabilidad (ejemplo)", "2026-10-23T02:00:00.000Z")).toBe(
      "reporte-encuesta-encuesta-de-empleabilidad-ejemplo-2026-10-22.pdf",
    );
    expect(getSurveyReportFileName("¿¡!?", "2026-10-22T15:00:00.000Z")).toBe("reporte-encuesta-sin-titulo-2026-10-22.pdf");
  });

  it("usa los mismos textos de las tarjetas que la pantalla, con ceros si no hay datos", () => {
    expect(buildMetricCards().map((card) => card.value)).toEqual(["0", "0%", "0:00 min", "0"]);
  });

  it("genera un archivo PDF real con los datos de la encuesta", async () => {
    const [{ data: statistics }, { data: metrics }] = await Promise.all([
      surveysService.getSurveyStatistics("srv-demo"),
      surveysService.getSurveyMetrics("srv-demo"),
    ]);

    const file = await renderSurveyReportPdf({ statistics, metrics, generatedAt: "2026-10-22T15:00:00.000Z" });
    const header = new TextDecoder().decode(new Uint8Array(await file.arrayBuffer()).slice(0, 5));

    expect(file.type).toBe("application/pdf");
    expect(header).toBe("%PDF-");
  }, 30000);
});
