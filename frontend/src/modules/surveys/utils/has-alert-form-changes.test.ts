import { describe, expect, it } from "vitest";
import { hasAlertFormChanges } from "./has-alert-form-changes";

const SAVED = { enabled: true, threshold: "10", questionIds: ["q1", "q2"] };

describe("hasAlertFormChanges", () => {
  it("no detecta cambios cuando los valores son idénticos", () => {
    expect(hasAlertFormChanges({ ...SAVED }, SAVED)).toBe(false);
  });

  it("ignora el orden de las preguntas y los espacios del umbral", () => {
    expect(hasAlertFormChanges({ enabled: true, threshold: " 10 ", questionIds: ["q2", "q1"] }, SAVED)).toBe(false);
  });

  it.each([
    ["el interruptor", { ...SAVED, enabled: false }],
    ["el umbral", { ...SAVED, threshold: "25" }],
    ["el umbral vacío", { ...SAVED, threshold: "" }],
    ["una pregunta desmarcada", { ...SAVED, questionIds: ["q1"] }],
    ["una pregunta distinta", { ...SAVED, questionIds: ["q1", "q3"] }],
  ])("detecta cambios en %s", (_label, current) => {
    expect(hasAlertFormChanges(current, SAVED)).toBe(true);
  });
});
