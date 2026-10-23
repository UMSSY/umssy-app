import { describe, expect, it } from "vitest";
import type { SurveyOptionResult, SurveyQuestionResult } from "../types/survey.types";
import { buildQuestionTrend } from "./build-question-trend";
import {
  formatAverageTime,
  formatCompletionRate,
  formatOptionPercentage,
  formatResponseRate,
} from "./format-survey-metrics";
import { getHighlightedOptionId } from "./get-highlighted-option-id";

function option(id: string, count: number, percentage: number): SurveyOptionResult {
  return { id, text: `Opción ${id}`, count, percentage };
}

function question(options: SurveyOptionResult[], overrides: Partial<SurveyQuestionResult> = {}): SurveyQuestionResult {
  const totalSelections = options.reduce((sum, item) => sum + item.count, 0);
  return {
    id: "q1",
    order: 1,
    text: "¿Trabajas?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    answeredBy: totalSelections,
    totalSelections,
    options,
    ...overrides,
  };
}

describe("formatos de las métricas", () => {
  it("muestra la tasa de respuesta con un decimal y la de finalización sin decimales", () => {
    expect(formatResponseRate(60.14)).toBe("60.1%");
    expect(formatResponseRate(0)).toBe("0.0%");
    expect(formatCompletionRate(84.6)).toBe("85%");
  });

  it("muestra el tiempo promedio como minutos:segundos", () => {
    expect(formatAverageTime(225)).toBe("3:45 min");
    expect(formatAverageTime(0)).toBe("0:00 min");
    expect(formatAverageTime(61.6)).toBe("1:02 min");
    expect(formatAverageTime(-5)).toBe("0:00 min");
  });

  it("muestra el porcentaje de una opción sin decimales de más", () => {
    expect(formatOptionPercentage(53)).toBe("53%");
    expect(formatOptionPercentage(66.66)).toBe("66.7%");
  });
});

describe("getHighlightedOptionId", () => {
  it("resalta la opción más elegida y, ante un empate, la primera", () => {
    expect(getHighlightedOptionId([option("a", 2, 20), option("b", 5, 50), option("c", 3, 30)])).toBe("b");
    expect(getHighlightedOptionId([option("a", 4, 50), option("b", 4, 50)])).toBe("a");
  });

  it("no resalta nada si nadie respondió", () => {
    expect(getHighlightedOptionId([option("a", 0, 0), option("b", 0, 0)])).toBeNull();
    expect(getHighlightedOptionId([])).toBeNull();
  });
});

describe("buildQuestionTrend", () => {
  it("describe la opción más elegida y la que le sigue", () => {
    expect(buildQuestionTrend(question([option("a", 6, 60), option("b", 3, 30), option("c", 1, 10)]))).toBe(
      "La opción más elegida es «Opción a» con 60% (6 de 10 respuestas). Le sigue «Opción b» con 30%.",
    );
  });

  it("en opción múltiple habla de selecciones", () => {
    const trend = buildQuestionTrend(question([option("a", 6, 75), option("b", 2, 25)], { type: "MULTIPLE_CHOICE", answeredBy: 6 }));

    expect(trend).toContain("(6 de 8 selecciones)");
  });

  it("indica los empates", () => {
    expect(buildQuestionTrend(question([option("a", 3, 50), option("b", 3, 50)]))).toBe(
      "Hay un empate entre «Opción a», «Opción b» con 50% cada una.",
    );
  });

  it("si solo una opción tiene respuestas no menciona a las demás", () => {
    expect(buildQuestionTrend(question([option("a", 5, 100), option("b", 0, 0)]))).toBe(
      "La opción más elegida es «Opción a» con 100% (5 de 5 respuestas).",
    );
  });

  it("no muestra tendencia con menos de 5 respuestas", () => {
    expect(buildQuestionTrend(question([option("a", 3, 75), option("b", 1, 25)]))).toBeNull();
  });
});
