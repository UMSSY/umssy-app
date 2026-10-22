import { beforeEach, describe, expect, it } from "vitest";
import type { SurveyInput } from "../types/survey.types";
import { clearSurveyFormDraft, readSurveyFormDraft, writeSurveyFormDraft } from "./survey-form-draft-storage";

const STORAGE_KEY = "umssy.surveys.form-draft";
const VALUES: SurveyInput = {
  title: "Encuesta",
  description: "",
  targetCareer: null,
  period: "II-2026",
  opensAt: "",
  closesAt: "",
  questions: [],
};

describe("guardado local del formulario de encuesta", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("guarda y recupera el avance con su fecha", () => {
    writeSurveyFormDraft("srv-02", VALUES, new Date("2026-10-22T15:00:00.000Z"));

    expect(readSurveyFormDraft()).toEqual({ surveyId: "srv-02", values: VALUES, savedAt: "2026-10-22T15:00:00.000Z" });
  });

  it("devuelve null si no hay nada guardado o si se borró", () => {
    expect(readSurveyFormDraft()).toBeNull();

    writeSurveyFormDraft(null, VALUES);
    clearSurveyFormDraft();

    expect(readSurveyFormDraft()).toBeNull();
  });

  it("ignora datos dañados o con otra forma", () => {
    localStorage.setItem(STORAGE_KEY, "{dañado");
    expect(readSurveyFormDraft()).toBeNull();

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: "hoy", values: { title: 1 } }));
    expect(readSurveyFormDraft()).toBeNull();

    localStorage.setItem(STORAGE_KEY, "null");
    expect(readSurveyFormDraft()).toBeNull();
  });
});
