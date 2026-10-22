import { describe, expect, it } from "vitest";
import {
  canChangeSurveyStatus,
  canEditSurvey,
  getToggledSurveyStatus,
  hasSurveyStatistics,
  isSurveyActive,
} from "./survey-status";

describe("reglas de estado de una encuesta", () => {
  it("permite publicar un borrador y alternar entre publicada y cerrada", () => {
    expect(canChangeSurveyStatus("DRAFT", "PUBLISHED")).toBe(true);
    expect(canChangeSurveyStatus("PUBLISHED", "CLOSED")).toBe(true);
    expect(canChangeSurveyStatus("CLOSED", "PUBLISHED")).toBe(true);
  });

  it("no permite volver a borrador ni cerrar un borrador", () => {
    expect(canChangeSurveyStatus("PUBLISHED", "DRAFT")).toBe(false);
    expect(canChangeSurveyStatus("DRAFT", "CLOSED")).toBe(false);
  });

  it("solo se edita un borrador y solo las publicadas o cerradas tienen estadísticas", () => {
    expect(canEditSurvey("DRAFT")).toBe(true);
    expect(canEditSurvey("PUBLISHED")).toBe(false);
    expect(hasSurveyStatistics("DRAFT")).toBe(false);
    expect(hasSurveyStatistics("CLOSED")).toBe(true);
  });

  it("el toggle alterna entre activa e inactiva y no aplica a borradores", () => {
    expect(isSurveyActive("PUBLISHED")).toBe(true);
    expect(isSurveyActive("CLOSED")).toBe(false);
    expect(getToggledSurveyStatus("PUBLISHED")).toBe("CLOSED");
    expect(getToggledSurveyStatus("CLOSED")).toBe("PUBLISHED");
    expect(getToggledSurveyStatus("DRAFT")).toBeNull();
  });
});
