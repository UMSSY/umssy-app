import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import type { SurveyAlertsDialogProps } from "../types/survey-alerts-dialog-props.types";
import { SurveyAlertsDialog } from "./survey-alerts-dialog";

const QUESTIONS = [
  { id: "question-1", code: "P1", text: "¿Cuál es tu situación laboral actual?" },
  { id: "question-2", code: "P2", text: "¿Qué competencias usas con más frecuencia?" },
];

function renderDialog(overrides: Partial<SurveyAlertsDialogProps> = {}) {
  const props: SurveyAlertsDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    questions: QUESTIONS,
    config: { enabled: true, threshold: 10, questionIds: null },
    isLoading: false,
    hasError: false,
    isSaving: false,
    onSave: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(<SurveyAlertsDialog {...props} />);
  return props;
}

async function changeThreshold(user: ReturnType<typeof userEvent.setup>, value: string) {
  const input = await screen.findByRole("textbox", { name: "Umbral de cambio" });
  await user.clear(input);
  await user.type(input, value);
}

describe("SurveyAlertsDialog - cambios sin guardar", () => {
  afterEach(() => cleanup());

  it("cierra sin preguntar cuando no hay cambios", async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("advierte antes de cerrar cuando hay cambios sin guardar", async () => {
    const user = userEvent.setup();
    const props = renderDialog();
    await changeThreshold(user, "25");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    const warning = await screen.findByRole("alertdialog");
    expect(within(warning).getByText(SURVEY_ALERTS_TEXT.discardDescription)).toBeInTheDocument();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it("conserva el diálogo abierto y los cambios al elegir seguir editando", async () => {
    const user = userEvent.setup();
    const props = renderDialog();
    await changeThreshold(user, "25");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Seguir editando" }));

    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Umbral de cambio" })).toHaveValue("25");
  });

  it("cierra y descarta los cambios al confirmar", async () => {
    const user = userEvent.setup();
    const props = renderDialog();
    await changeThreshold(user, "25");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Descartar" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("también advierte al cerrar con la tecla Escape", async () => {
    const user = userEvent.setup();
    const props = renderDialog();
    await changeThreshold(user, "25");

    await user.keyboard("{Escape}");

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it("pide confirmación al recargar o cerrar la pestaña solo cuando hay cambios", async () => {
    const user = userEvent.setup();
    renderDialog();
    await screen.findByRole("textbox", { name: "Umbral de cambio" });

    const clean = new Event("beforeunload", { cancelable: true });
    fireEvent(window, clean);
    expect(clean.defaultPrevented).toBe(false);

    await changeThreshold(user, "25");
    const dirty = new Event("beforeunload", { cancelable: true });
    fireEvent(window, dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });
});
