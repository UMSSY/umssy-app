import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { surveysService } from "../services/surveys.service";
import { buildEmptyStatistics, buildStatistics } from "../testing/survey-statistics-fixtures";
import { apiResponse } from "../testing/survey-fixtures";
import { SurveyAnalyticsView } from "./survey-analytics-view";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ALL = buildStatistics();
const SECOND_SEMESTER = buildStatistics({
  period: "II-2026",
  totalResponses: 3,
  questions: [
    {
      ...ALL.questions[0],
      answeredCount: 3,
      totalSelections: 3,
      options: [
        { id: "option-1", label: "Empleado a tiempo completo", count: 3, percentage: 100 },
        { id: "option-2", label: "Empleado a medio tiempo", count: 0, percentage: 0 },
        { id: "option-3", label: "Trabajador independiente", count: 0, percentage: 0 },
        { id: "option-4", label: "Buscando empleo", count: 0, percentage: 0 },
      ],
      trend: { text: "La opción más elegida es «Empleado a tiempo completo» con 100% (3 de 3 respuestas). Sube 60 pts frente a I-2026.", direction: "up" },
    },
  ],
});

function mockStatistics() {
  return vi.spyOn(surveysService, "getSurveyStatistics").mockImplementation(async (_id, period) => {
    if (period === "II-2026") return apiResponse(SECOND_SEMESTER);
    if (period) return apiResponse(buildEmptyStatistics(period));
    return apiResponse(ALL);
  });
}

async function renderLoaded() {
  renderWithQuery(<SurveyAnalyticsView id="survey-1" />);
  await screen.findByText("Analíticas de Encuesta de empleabilidad 2020");
}

async function selectPeriod(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("combobox", { name: "Gestión académica" }));
  await user.click(await screen.findByRole("option", { name }));
}

describe("SurveyAnalyticsView", () => {
  beforeEach(() => {
    mockStatistics();
    vi.spyOn(surveysService, "exportSurveyPdf").mockResolvedValue({
      file: new Blob(["pdf"], { type: "application/pdf" }),
      fileName: "reporte.pdf",
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.mocked(toast.error).mockClear();
  });

  describe("estructura de la pantalla", () => {
    it("muestra el título de la encuesta, el resumen y un card por pregunta con su enunciado completo", async () => {
      await renderLoaded();

      expect(screen.getByText("Respuestas Recibidas")).toBeInTheDocument();
      expect(screen.getByText("¿Cuál es tu situación laboral actual?")).toBeInTheDocument();
      expect(screen.getByText("¿Qué competencias usas con más frecuencia?")).toBeInTheDocument();
      expect(screen.getByText("P1")).toBeInTheDocument();
      expect(screen.getByText("P2")).toBeInTheDocument();
    });

    it("el header con el título queda fijo en la zona superior al hacer scroll", async () => {
      await renderLoaded();

      const header = screen.getByRole("banner");

      expect(header).toHaveClass("sticky");
      expect(within(header).getByRole("heading", { level: 1 }).textContent).toBe("Analíticas de Encuesta de empleabilidad 2020");
      expect(within(header).getByRole("button", { name: "Exportar PDF" })).toBeInTheDocument();
    });

    it("muestra el estado de carga mientras llegan los datos", () => {
      vi.spyOn(surveysService, "getSurveyStatistics").mockReturnValue(new Promise(() => {}));

      renderWithQuery(<SurveyAnalyticsView id="survey-1" />);

      expect(screen.getByRole("status", { name: "Cargando analíticas" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Analíticas de la encuesta");
    });

    it("muestra un error con un enlace para volver si no se puede cargar", async () => {
      vi.spyOn(surveysService, "getSurveyStatistics").mockRejectedValue(new Error("falló"));

      renderWithQuery(<SurveyAnalyticsView id="survey-1" />);

      expect(await screen.findByText("No se pudo encontrar la encuesta o cargar sus métricas.")).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: /Volver a encuestas/ })[0]).toHaveAttribute("href", "/backoffice/surveys");
    });
  });

  describe("selector de gestión", () => {
    it("empieza en Todos y ofrece los semestres de la encuesta", async () => {
      const user = userEvent.setup();
      await renderLoaded();

      const select = screen.getByRole("combobox", { name: "Gestión académica" });
      expect(select).toHaveTextContent("Todos");
      expect(screen.getByText("Semestre en que se recibieron las respuestas")).toBeInTheDocument();

      await user.click(select);
      const options = within(await screen.findByRole("listbox")).getAllByRole("option");
      expect(options.map((option) => option.textContent)).toEqual(["Todos", "II-2026", "I-2026"]);
    });

    it("al elegir un semestre con respuestas pide sus resultados y los muestra", async () => {
      const user = userEvent.setup();
      await renderLoaded();

      await selectPeriod(user, "II-2026");

      await waitFor(() => expect(surveysService.getSurveyStatistics).toHaveBeenCalledWith("survey-1", "II-2026"));
      expect(await screen.findByText(/Sube 60 pts frente a I-2026/)).toBeInTheDocument();
      expect(screen.getByText("3 respuestas registradas")).toBeInTheDocument();
    });

    it("al cambiar de semestre limpia los valores anteriores y muestra el estado de carga", async () => {
      const user = userEvent.setup();
      await renderLoaded();
      let release: () => void = () => undefined;
      vi.mocked(surveysService.getSurveyStatistics).mockImplementationOnce(
        () => new Promise((resolve) => (release = () => resolve(apiResponse(SECOND_SEMESTER)))),
      );

      await selectPeriod(user, "II-2026");

      expect(await screen.findByRole("status", { name: "Cargando analíticas" })).toBeInTheDocument();
      expect(screen.queryByText("¿Cuál es tu situación laboral actual?")).not.toBeInTheDocument();
      expect(screen.queryByText("5 respuestas registradas")).not.toBeInTheDocument();
      // El selector no desaparece mientras carga.
      expect(screen.getByRole("combobox", { name: "Gestión académica" })).toHaveTextContent("II-2026");

      release();

      expect(await screen.findByText("3 respuestas registradas")).toBeInTheDocument();
      expect(screen.queryByRole("status", { name: "Cargando analíticas" })).not.toBeInTheDocument();
    });

    it("al volver a Todos muestra de nuevo todas las respuestas", async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await selectPeriod(user, "II-2026");
      await screen.findByText("3 respuestas registradas");

      await selectPeriod(user, "Todos");

      expect(await screen.findByText("5 respuestas registradas")).toBeInTheDocument();
    });
  });

  describe("gestión sin respuestas", () => {
    it("muestra el mensaje de ausencia de datos y mantiene los cards con sus opciones en cero", async () => {
      const user = userEvent.setup();
      await renderLoaded();

      await selectPeriod(user, "I-2026");

      expect(await screen.findByText("No hay respuestas registradas en la gestión I-2026")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Las preguntas y sus opciones se muestran en cero");
      // Los contenedores siguen ahí: resumen, cards por pregunta y todas sus opciones.
      expect(screen.getByText("Respuestas Recibidas")).toBeInTheDocument();
      expect(screen.getByText("¿Cuál es tu situación laboral actual?")).toBeInTheDocument();
      expect(screen.getByText("Buscando empleo")).toBeInTheDocument();
      expect(screen.getAllByLabelText(/: 0 votos, 0%/).length).toBeGreaterThanOrEqual(8);
      expect(screen.getAllByText("Sin respuestas registradas en este periodo.")).toHaveLength(2);
    });

    it("sin ningún periodo elegido y sin respuestas lo indica sin mencionar una gestión", async () => {
      vi.spyOn(surveysService, "getSurveyStatistics").mockResolvedValue(apiResponse({ ...buildEmptyStatistics("II-2026"), period: null }));

      await renderLoaded();

      expect(screen.getByText("Esta encuesta aún no ha recibido respuestas")).toBeInTheDocument();
    });

    it("no permite exportar un PDF vacío", async () => {
      const user = userEvent.setup();
      await renderLoaded();

      await selectPeriod(user, "I-2026");
      await screen.findByText("No hay respuestas registradas en la gestión I-2026");

      const button = screen.getByRole("button", { name: "Exportar PDF" });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("title", "No hay respuestas para exportar");
    });
  });

  describe("exportar PDF", () => {
    it("exporta toda la encuesta cuando no hay un semestre elegido", async () => {
      await renderLoaded();

      fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));

      await waitFor(() => expect(surveysService.exportSurveyPdf).toHaveBeenCalledWith("survey-1", undefined));
      expect(await screen.findByText("PDF generado correctamente")).toBeInTheDocument();
    });

    it("exporta el semestre que se está viendo", async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await selectPeriod(user, "II-2026");
      await screen.findByText("3 respuestas registradas");

      fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));

      await waitFor(() => expect(surveysService.exportSurveyPdf).toHaveBeenCalledWith("survey-1", "II-2026"));
    });

    it("avisa con un toast si el PDF no se pudo generar", async () => {
      vi.mocked(surveysService.exportSurveyPdf).mockRejectedValue(new Error("falló"));
      await renderLoaded();

      fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("No se pudo generar el reporte en PDF. Inténtalo de nuevo.", expect.any(Object)),
      );
      expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeEnabled();
    });

    it("vuelve a pedir los datos al presionar Actualizar", async () => {
      await renderLoaded();
      const callsBefore = vi.mocked(surveysService.getSurveyStatistics).mock.calls.length;

      fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

      await waitFor(() => expect(vi.mocked(surveysService.getSurveyStatistics).mock.calls.length).toBeGreaterThan(callsBefore));
    });
  });
});
