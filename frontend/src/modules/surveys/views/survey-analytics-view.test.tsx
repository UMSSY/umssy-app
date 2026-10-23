import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { mockApiError } from "../mocks/mock-api.mock";
import { resetSurveyTables } from "../mocks/survey-store.mock";
import { surveysService } from "../services/surveys.service";
import { SurveyAnalyticsView } from "./survey-analytics-view";

// srv-09 usa la plantilla de empleabilidad: 6 preguntas con opción única, múltiple y lista desplegable.
const SURVEY_ID = "srv-09";

async function renderLoaded(id = SURVEY_ID) {
  renderWithQuery(<SurveyAnalyticsView id={id} />);
  await screen.findAllByRole("article", { name: /^P?\d|¿/ });
}

function questionCards() {
  return screen.getAllByRole("article").filter((article) => article.hasAttribute("aria-labelledby"));
}

describe("SurveyAnalyticsView", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSurveyTables();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("métricas de participación (HU3)", () => {
    it("muestra las cuatro tarjetas con su título, valor y descripción en los formatos pedidos", async () => {
      const { data: metrics } = await surveysService.getSurveyMetrics(SURVEY_ID);
      await renderLoaded();

      const participation = screen.getByRole("article", { name: `Total de participación: ${metrics.respondedCount}` });
      expect(participation.textContent).toContain(`de un total de ${metrics.invitedCount} usuarios invitados / ${metrics.responseRate.toFixed(1)}% de respuesta`);
      const completion = screen.getByRole("article", { name: `Tasa de finalización: ${Math.round(metrics.completionRate)}%` });
      expect(completion.textContent).toContain(`${metrics.completedCount} usuarios completaron todas las preguntas`);
      expect(screen.getByRole("article", { name: /^Tiempo promedio de respuesta: \d+:\d{2} min$/ })).toBeDefined();
      expect(screen.getByRole("article", { name: `Diversidad de perfiles: ${metrics.distinctCareers + metrics.distinctPeriods}` })).toBeDefined();
    });

    it("los que completaron no superan a los que respondieron, y estos no superan a los invitados", async () => {
      const { data } = await surveysService.getSurveyMetrics(SURVEY_ID);

      expect(data.completedCount).toBeLessThanOrEqual(data.respondedCount);
      expect(data.respondedCount).toBeLessThanOrEqual(data.invitedCount);
    });

    it("sin respuestas muestra ceros y un aviso, manteniendo las tarjetas y las preguntas", async () => {
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

      expect(await screen.findByText(/todavía no tiene respuestas registradas/)).toBeDefined();
      expect(screen.getByRole("article", { name: "Total de participación: 0" }).textContent).toContain("0.0% de respuesta");
      expect(screen.getByRole("article", { name: "Tasa de finalización: 0%" })).toBeDefined();
      expect(screen.getByRole("article", { name: "Tiempo promedio de respuesta: 0:00 min" })).toBeDefined();
      expect(screen.getByRole("listitem", { name: "Sí: 0 respuestas, 0%" })).toBeDefined();
    });

    it("muestra indicadores de carga mientras llegan los datos", () => {
      vi.spyOn(surveysService, "getSurveyMetrics").mockReturnValue(new Promise(() => {}));
      renderWithQuery(<SurveyAnalyticsView id={SURVEY_ID} />);

      expect(screen.getAllByTestId("metric-skeleton")).toHaveLength(4);
    });

    it("vuelve a pedir los datos al presionar Actualizar", async () => {
      const metricsSpy = vi.spyOn(surveysService, "getSurveyMetrics");
      const statisticsSpy = vi.spyOn(surveysService, "getSurveyStatistics");
      await renderLoaded();

      fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

      await waitFor(() => expect(metricsSpy).toHaveBeenCalledTimes(2));
      expect(statisticsSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("resultados por pregunta (HU4)", () => {
    it("muestra todas las preguntas de la encuesta, numeradas y con su enunciado completo", async () => {
      const { data } = await surveysService.getSurveyStatistics(SURVEY_ID);
      await renderLoaded();

      const cards = questionCards();
      expect(cards).toHaveLength(data.questions.length);
      data.questions.forEach((question, index) => {
        expect(cards[index].textContent).toContain(`P${index + 1}`);
        expect(within(cards[index]).getByRole("heading", { name: question.text })).toBeDefined();
      });
    });

    it("cada opción muestra su conteo y porcentaje juntos, y la barra coincide con el porcentaje", async () => {
      const { data } = await surveysService.getSurveyStatistics(SURVEY_ID);
      await renderLoaded();

      data.questions.forEach((question, index) => {
        const card = questionCards()[index];
        const unit = question.type === "MULTIPLE_CHOICE" ? "selecciones" : "respuestas";
        const bars = within(card).getAllByTestId("option-bar");
        expect(bars).toHaveLength(question.options.length);
        question.options.forEach((option, optionIndex) => {
          expect(within(card).getByRole("listitem", { name: new RegExp(`^${option.text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}: ${option.count} ${unit}`) })).toBeDefined();
          const style = bars[optionIndex].getAttribute("style") ?? "";
          expect(style).toContain(`${option.percentage}%`);
        });
        expect(question.options.reduce((sum, option) => sum + option.count, 0)).toBe(question.totalSelections);
      });
    });

    it("usa columnas para la lista desplegable y aclara la base del porcentaje en opción múltiple", async () => {
      await renderLoaded();
      const cards = questionCards();

      expect(cards[1].textContent).toContain("Lista desplegable");
      expect(cards[4].textContent).toMatch(/porcentaje sobre \d+ selecciones/);
    });

    it("muestra el bloque de tendencia cuando hay respuestas suficientes", async () => {
      await renderLoaded();

      expect(within(questionCards()[0]).getByText("Tendencia:")).toBeDefined();
    });
  });

  describe("estados", () => {
    it("un borrador todavía no tiene estadísticas", async () => {
      renderWithQuery(<SurveyAnalyticsView id="srv-02" />);

      expect(await screen.findByText(/todavía no tiene estadísticas/)).toBeDefined();
    });

    it("muestra un error en lugar de valores incompletos si falla la carga", async () => {
      vi.spyOn(surveysService, "getSurveyStatistics").mockRejectedValue(mockApiError(500, "Error"));
      renderWithQuery(<SurveyAnalyticsView id={SURVEY_ID} />);

      expect(await screen.findByText("No se pudieron cargar las estadísticas de la encuesta.")).toBeDefined();
      expect(questionCards()).toHaveLength(0);
    });

    it("muestra el título de la encuesta con su gestión y carrera, y un enlace al historial", async () => {
      await renderLoaded();

      expect(screen.getByRole("heading", { name: "Analíticas: Empleabilidad Sistemas I-2026" })).toBeDefined();
      expect(screen.getByText("I-2026 · Todas las carreras · 6 preguntas")).toBeDefined();
      expect(screen.getByRole("link", { name: "Volver al historial" }).getAttribute("href")).toBe("/backoffice/surveys");
    });
  });
});
