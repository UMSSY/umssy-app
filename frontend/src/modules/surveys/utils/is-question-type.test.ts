import { describe, expect, it } from "vitest";
import { isQuestionType } from "./is-question-type";

describe("isQuestionType", () => {
  it("reconoce solo los tipos de pregunta cerrados", () => {
    expect(isQuestionType("single_choice")).toBe(true);
    expect(isQuestionType("multiple_choice")).toBe(true);
    expect(isQuestionType("dropdown")).toBe(false);
    expect(isQuestionType("short_text")).toBe(false);
  });
});
