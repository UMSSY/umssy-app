import { describe, expect, it } from "vitest";
import type { SurveyResponseQuestion } from "../types/survey-response.types";
import { findUnansweredQuestions } from "./find-unanswered-questions";

const question = (id: string, isRequired: boolean): SurveyResponseQuestion => ({
  id,
  position: 1,
  statement: id,
  type: "single_choice",
  isRequired,
  options: [],
});

describe("findUnansweredQuestions", () => {
  it("devuelve solo las preguntas obligatorias sin respuesta", () => {
    const questions = [question("a", true), question("b", true), question("c", false)];

    expect(findUnansweredQuestions(questions, { a: ["x"], b: [] })).toEqual(["b"]);
  });
});
