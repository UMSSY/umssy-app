import { describe, expect, it } from "vitest";
import { SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import { parseAlertThreshold, validateSurveyAlertForm } from "./validate-survey-alert-form";

describe("parseAlertThreshold", () => {
  it.each([
    ["1", 1],
    ["50", 50],
    [" 10 ", 10],
  ])("acepta %s", (value, expected) => {
    expect(parseAlertThreshold(value)).toBe(expected);
  });

  it.each(["0", "51", "", "abc", "10.5", "-3"])("rechaza %s", (value) => {
    expect(parseAlertThreshold(value)).toBeNull();
  });
});

describe("validateSurveyAlertForm", () => {
  it("exige umbral válido y al menos una pregunta cuando las alertas están activas", () => {
    expect(validateSurveyAlertForm({ enabled: true, threshold: "60", questionIds: [] })).toEqual({
      threshold: SURVEY_ALERTS_TEXT.thresholdError,
      questions: SURVEY_ALERTS_TEXT.questionsError,
    });
  });

  it("permite guardar sin preguntas cuando las alertas están desactivadas", () => {
    expect(validateSurveyAlertForm({ enabled: false, threshold: "", questionIds: [] })).toEqual({});
  });

  it("no devuelve errores con datos válidos", () => {
    expect(validateSurveyAlertForm({ enabled: true, threshold: "10", questionIds: ["p1"] })).toEqual({});
  });
});
