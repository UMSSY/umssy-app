import { describe, expect, it } from "vitest";
import { SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import { getAlertThresholdError, parseAlertThreshold, validateSurveyAlertForm } from "./validate-survey-alert-form";

describe("getAlertThresholdError", () => {
  it.each(["1", "10", "50", " 25 "])("no devuelve error para %j", (value) => {
    expect(getAlertThresholdError(value)).toBeNull();
  });

  it.each(["", "   "])("indica que el umbral es obligatorio cuando está vacío (%j)", (value) => {
    expect(getAlertThresholdError(value)).toBe(SURVEY_ALERTS_TEXT.thresholdRequired);
  });

  it("indica que el mínimo es 1 con el valor 0", () => {
    expect(getAlertThresholdError("0")).toBe(SURVEY_ALERTS_TEXT.thresholdMin);
  });

  it.each(["51", "99"])("indica que el máximo es 50 con el valor %s", (value) => {
    expect(getAlertThresholdError(value)).toBe(SURVEY_ALERTS_TEXT.thresholdMax);
  });

  it.each(["abc", "10.5", "-3"])("rechaza el valor no entero %s", (value) => {
    expect(getAlertThresholdError(value)).toBe(SURVEY_ALERTS_TEXT.thresholdError);
  });
});

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
      threshold: SURVEY_ALERTS_TEXT.thresholdMax,
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
