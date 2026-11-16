import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
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

describe("SurveyAlertsForm - botón Guardar", () => {
  afterEach(() => cleanup());

  it("permanece deshabilitado mientras los valores sean idénticos a los guardados", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("se habilita al cambiar el umbral y vuelve a deshabilitarse al restaurar el valor guardado", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.clear(thresholdInput());
    await user.type(thresholdInput(), "25");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();

    await user.clear(thresholdInput());
    await user.type(thresholdInput(), "10");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("se habilita al cambiar el interruptor o las preguntas elegidas", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("checkbox", { name: /¿Qué competencias usas/ }));
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();

    await user.click(screen.getByRole("checkbox", { name: /¿Qué competencias usas/ }));
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();

    await user.click(screen.getByRole("switch", { name: "Activar alertas" }));
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });
});

describe("SurveyAlertsForm - campo de umbral", () => {
  afterEach(() => cleanup());

  it.each([
    ["0", SURVEY_ALERTS_TEXT.thresholdMin],
    ["51", SURVEY_ALERTS_TEXT.thresholdMax],
  ])("bloquea el guardado con el valor %s y muestra su mensaje", async (value, message) => {
    const user = userEvent.setup();
    const props = renderForm();

    await user.clear(thresholdInput());
    await user.type(thresholdInput(), value);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("marca el umbral como obligatorio y no guarda cuando está vacío", async () => {
    const user = userEvent.setup();
    const props = renderForm();

    await user.clear(thresholdInput());
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText(SURVEY_ALERTS_TEXT.thresholdRequired)).toBeInTheDocument();
    expect(thresholdInput()).toHaveAttribute("aria-invalid", "true");
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it.each(["1", "50"])("permite guardar con el valor límite %s", async (value) => {
    const user = userEvent.setup();
    const props = renderForm();

    await user.clear(thresholdInput());
    await user.type(thresholdInput(), value);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ threshold: Number(value) }));
  });

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
