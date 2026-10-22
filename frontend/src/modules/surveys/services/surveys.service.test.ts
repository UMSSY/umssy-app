import { beforeEach, describe, expect, it } from "vitest";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { MOCK_CURRENT_ADMIN } from "../mocks/survey-seed.mock";
import { readSurveyTables, resetSurveyTables } from "../mocks/survey-store.mock";
import type { SurveyTables } from "../types/survey-records.types";
import type { SurveyInput } from "../types/survey.types";
import { surveysService } from "./surveys.service";

const SEEDED_SURVEYS = 24;

function buildInput(overrides: Partial<SurveyInput> = {}): SurveyInput {
  return {
    title: "Encuesta nueva",
    description: "Descripción",
    targetCareer: null,
    period: "II-2026",
    opensAt: "2099-01-10",
    closesAt: "2099-02-10",
    questions: [{ text: "¿Trabajas?", type: "SINGLE_CHOICE", isRequired: true, options: ["Sí", "No"] }],
    ...overrides,
  };
}

async function getErrorDetail(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return getApiErrorDetail(error);
  }
  throw new Error("Se esperaba un error");
}

describe("surveysService", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSurveyTables();
  });

  describe("getSurveys", () => {
    it("devuelve la primera página ordenada de la más reciente a la más antigua", async () => {
      const response = await surveysService.getSurveys({ page: 1, limit: 10 });

      expect(response.ok).toBe(true);
      expect(response.data.totalItems).toBe(SEEDED_SURVEYS);
      expect(response.data.items).toHaveLength(10);
      const dates = response.data.items.map((survey) => survey.createdAt);
      expect(dates).toEqual([...dates].sort().reverse());
    });

    it("pagina los resultados", async () => {
      const response = await surveysService.getSurveys({ page: 3, limit: 10 });

      expect(response.page).toBe(3);
      expect(response.data.items).toHaveLength(SEEDED_SURVEYS - 20);
    });

    it("filtra por gestión", async () => {
      const response = await surveysService.getSurveys({ page: 1, limit: 50, period: "I-2025" });

      expect(response.data.totalItems).toBeGreaterThan(0);
      expect(response.data.items.every((survey) => survey.period === "I-2025")).toBe(true);
    });

    it("busca por correo del administrador sin distinguir mayúsculas", async () => {
      const response = await surveysService.getSurveys({ page: 1, limit: 50, search: "  CARLA.ARCE " });

      expect(response.data.totalItems).toBeGreaterThan(0);
      expect(response.data.items.every((survey) => survey.creator.email === "carla.arce@umssy.edu")).toBe(true);
    });

    it("devuelve una lista vacía si nada coincide", async () => {
      const response = await surveysService.getSurveys({ page: 1, limit: 10, search: "no-existe" });

      expect(response.data).toEqual({ items: [], totalItems: 0 });
    });
  });

  describe("crear y editar borradores", () => {
    it("crea la encuesta como borrador a nombre del administrador actual y la muestra primero", async () => {
      const created = await surveysService.createSurvey(buildInput());
      const list = await surveysService.getSurveys({ page: 1, limit: 10 });

      expect(created.statusCode).toBe(201);
      expect(created.data.status).toBe("DRAFT");
      expect(list.data.items[0]).toMatchObject({ id: created.data.id, status: "DRAFT", creator: { email: MOCK_CURRENT_ADMIN.email } });
    });

    it("guarda las preguntas y opciones como filas relacionadas", async () => {
      const created = await surveysService.createSurvey(buildInput());
      const tables = readSurveyTables();
      const question = tables.surveyQuestions.find((row) => row.surveyId === created.data.id);

      expect(question).toMatchObject({ text: "¿Trabajas?", order: 1 });
      expect(tables.surveyOptions.filter((option) => option.questionId === question?.id).map((option) => option.text)).toEqual(["Sí", "No"]);
    });

    it("guarda los cambios en localStorage", async () => {
      await surveysService.createSurvey(buildInput({ title: "Persistente" }));
      const stored = JSON.parse(localStorage.getItem("umssy.surveys.mock-db.v1") ?? "{}") as SurveyTables;

      expect(stored.surveys.some((survey) => survey.title === "Persistente")).toBe(true);
    });

    it("rechaza un borrador sin título", async () => {
      await expect(getErrorDetail(surveysService.createSurvey(buildInput({ title: " " })))).resolves.toBe(
        "El título de la encuesta es obligatorio",
      );
    });

    it("actualiza un borrador reemplazando sus preguntas", async () => {
      const created = await surveysService.createSurvey(buildInput());
      const updated = await surveysService.updateSurvey(
        created.data.id,
        buildInput({ title: "Editada", questions: [{ text: "Otra", type: "DROPDOWN", isRequired: false, options: ["A", "B", "C"] }] }),
      );

      expect(updated.data).toMatchObject({ title: "Editada", questions: [{ text: "Otra", options: ["A", "B", "C"] }] });
      expect(readSurveyTables().surveyQuestions.filter((row) => row.surveyId === created.data.id)).toHaveLength(1);
    });

    it("no permite editar una encuesta publicada", async () => {
      await expect(getErrorDetail(surveysService.updateSurvey("srv-01", buildInput()))).resolves.toBe(
        "Una encuesta publicada ya no se puede editar",
      );
    });

    it("devuelve 404 si la encuesta no existe", async () => {
      await expect(getErrorDetail(surveysService.getSurvey("no-existe"))).resolves.toBe("La encuesta no existe");
    });
  });

  describe("changeSurveyStatus", () => {
    it("publica un borrador completo", async () => {
      const created = await surveysService.createSurvey(buildInput());
      const response = await surveysService.changeSurveyStatus(created.data.id, "PUBLISHED");

      expect(response.data.status).toBe("PUBLISHED");
    });

    it("no publica un borrador incompleto", async () => {
      const created = await surveysService.createSurvey(buildInput({ questions: [] }));

      await expect(getErrorDetail(surveysService.changeSurveyStatus(created.data.id, "PUBLISHED"))).resolves.toBe(
        "Preguntas: la encuesta debe tener al menos una pregunta.",
      );
    });

    it("alterna una encuesta entre activa e inactiva", async () => {
      await surveysService.changeSurveyStatus("srv-01", "CLOSED");
      const reopened = await surveysService.changeSurveyStatus("srv-01", "PUBLISHED");

      expect(reopened.data.status).toBe("PUBLISHED");
    });

    it("no permite cerrar un borrador", async () => {
      await expect(getErrorDetail(surveysService.changeSurveyStatus("srv-02", "CLOSED"))).resolves.toBe(
        "La encuesta no puede cambiar a ese estado",
      );
    });
  });

  describe("métricas y estadísticas", () => {
    it("calcula métricas coherentes para una encuesta con respuestas", async () => {
      const { data } = await surveysService.getSurveyMetrics("srv-06");

      expect(data.respondedCount).toBeGreaterThan(0);
      expect(data.completedCount).toBeLessThanOrEqual(data.respondedCount);
      expect(data.respondedCount).toBeLessThanOrEqual(data.invitedCount);
    });

    it("devuelve todas las preguntas con sus opciones y conteos que suman el total", async () => {
      const { data } = await surveysService.getSurveyStatistics("srv-06");
      const tables = readSurveyTables();

      expect(data.questions).toHaveLength(tables.surveyQuestions.filter((row) => row.surveyId === "srv-06").length);
      data.questions.forEach((question) => {
        expect(question.options.reduce((sum, option) => sum + option.count, 0)).toBe(question.totalSelections);
      });
    });

    it("no tiene estadísticas para un borrador", async () => {
      await expect(getErrorDetail(surveysService.getSurveyStatistics("srv-02"))).resolves.toBe(
        "La encuesta todavía no tiene estadísticas",
      );
    });

    it("devuelve 404 en métricas de una encuesta inexistente", async () => {
      await expect(getErrorDetail(surveysService.getSurveyMetrics("no-existe"))).resolves.toBe("La encuesta no existe");
    });
  });
});
