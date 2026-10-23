import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "umssy.surveys.mock-db.v2";

async function loadStore() {
  vi.resetModules();
  return import("./survey-store.mock");
}

describe("almacén de encuestas de ejemplo", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("arranca con los datos iniciales cuando no hay nada guardado", async () => {
    const { readSurveyTables } = await loadStore();

    expect(readSurveyTables().surveys).toHaveLength(25);
  });

  it("recupera las tablas guardadas al recargar la página", async () => {
    const { readSurveyTables, writeSurveyTables } = await loadStore();
    writeSurveyTables({ ...readSurveyTables(), surveys: [] });

    const reloaded = await loadStore();

    expect(reloaded.readSurveyTables().surveys).toEqual([]);
  });

  it("descarta datos dañados y vuelve a los iniciales", async () => {
    localStorage.setItem(STORAGE_KEY, "{dañado");
    const { readSurveyTables } = await loadStore();

    expect(readSurveyTables().surveys).toHaveLength(25);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restablece los datos iniciales", async () => {
    const { readSurveyTables, writeSurveyTables, resetSurveyTables } = await loadStore();
    writeSurveyTables({ ...readSurveyTables(), surveys: [] });

    resetSurveyTables();

    expect(readSurveyTables().surveys).toHaveLength(25);
  });

  it("genera siempre los mismos datos de ejemplo", async () => {
    const { buildSurveySeed } = await import("./survey-seed.mock");

    expect(buildSurveySeed().surveyAnswers.length).toBe(buildSurveySeed().surveyAnswers.length);
    expect(buildSurveySeed().surveyResponses.length).toBeGreaterThan(0);
  });
});
