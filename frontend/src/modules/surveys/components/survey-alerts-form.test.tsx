import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SurveyAlertsFormProps } from "../types/survey-alerts-form-props.types";
import { SurveyAlertsForm } from "./survey-alerts-form";

const QUESTIONS = [
  { id: "question-1", code: "P1", text: "¿Cuál es tu situación laboral actual?" },
  { id: "question-2", code: "P2", text: "¿Qué competencias usas con más frecuencia?" },
];

function renderForm(overrides: Partial<SurveyAlertsFormProps> = {}) {
  const props: SurveyAlertsFormProps = {
    questions: QUESTIONS,
    config: { enabled: true, threshold: 10, questionIds: null },
    isSaving: false,
    onCancel: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(<SurveyAlertsForm {...props} />);
  return props;
}

function thresholdInput() {
  return screen.getByRole("textbox", { name: "Umbral de cambio" });
}

describe("SurveyAlertsForm - campo de umbral", () => {
  afterEach(() => cleanup());

  it("solo admite caracteres numéricos al escribir", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.clear(thresholdInput());
    await user.type(thresholdInput(), "a1e-.2");

    expect(thresholdInput()).toHaveValue("12");
  });

  it("rechaza el texto no numérico pegado", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.clear(thresholdInput());
    await user.click(thresholdInput());
    await user.paste("diez");

    expect(thresholdInput()).toHaveValue("");
  });

  it("conserva solo los números del texto pegado", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.clear(thresholdInput());
    await user.click(thresholdInput());
    await user.paste("2x5");

    expect(thresholdInput()).toHaveValue("25");
  });

  it("no permite escribir más dígitos que los del valor máximo", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.clear(thresholdInput());
    await user.type(thresholdInput(), "123");

    expect(thresholdInput()).toHaveValue("12");
  });
});
