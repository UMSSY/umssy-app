import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { buildSurveyState } from "../testing/survey-fixtures";
import { PublishSurveyDialog } from "./publish-survey-dialog";

const SURVEY = buildSurveyState({
  questions: [
    { id: "q1", statement: "A", type: "single_choice", isRequired: true, options: [] },
    { id: "q2", statement: "B", type: "multiple_choice", isRequired: true, options: [] },
    { id: "q3", statement: "C", type: "multiple_choice", isRequired: true, options: [] },
    { id: "q4", statement: "D", type: "single_choice", isRequired: false, options: [] },
  ],
});

describe("PublishSurveyDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("muestra el texto de confirmación y el resumen de la encuesta", () => {
    render(
      <PublishSurveyDialog
        open
        survey={SURVEY}
        careerTitle="Ingeniería de Sistemas"
        isPublishing={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("alertdialog");

    expect(within(dialog).getByRole("heading", { name: "¿Publicar encuesta?" })).toBeInTheDocument();
    expect(dialog).toHaveTextContent(SURVEY_MESSAGES.publishDialogDescription);
    expect(dialog).toHaveTextContent("EncuestaEncuesta de Empleabilidad");
    expect(dialog).toHaveTextContent("Dirigida aIngeniería de Sistemas");
    expect(dialog).toHaveTextContent("Vigencia03/11/2026 - 15/12/2026");
    expect(dialog).toHaveTextContent("Preguntas4 (3 obligatorias)");
  });

  it("confirma o cancela", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <PublishSurveyDialog
        open
        survey={SURVEY}
        careerTitle="Sistemas"
        isPublishing={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("bloquea los botones y el cierre mientras publica", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <PublishSurveyDialog
        open
        survey={SURVEY}
        careerTitle="Sistemas"
        isPublishing
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Publicando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
