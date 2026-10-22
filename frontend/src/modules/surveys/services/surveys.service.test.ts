import { describe, expect, it } from "vitest";
import { SURVEYS_MOCK } from "../mocks/surveys.mock";
import { surveysService } from "./surveys.service";

describe("surveysService.getSurveys", () => {
  it("devuelve la primera página ordenada de la más reciente a la más antigua", async () => {
    const response = await surveysService.getSurveys({ page: 1, limit: 10 });

    expect(response.ok).toBe(true);
    expect(response.data.totalItems).toBe(SURVEYS_MOCK.length);
    expect(response.data.items).toHaveLength(10);
    const dates = response.data.items.map((survey) => survey.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("pagina los resultados", async () => {
    const response = await surveysService.getSurveys({ page: 3, limit: 10 });

    expect(response.page).toBe(3);
    expect(response.data.items).toHaveLength(SURVEYS_MOCK.length - 20);
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
