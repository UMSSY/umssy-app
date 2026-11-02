import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { buildSurveyState } from "../testing/survey-fixtures";
import { SurveyPreviewDialog } from "./survey-preview-dialog";

const OPTIONS = [
  { id: "a", label: "Sí" },
  { id: "b", label: "" },
];

describe("SurveyPreviewDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("muestra la encuesta como la verá el titulado con cada tipo de pregunta", () => {
    const survey = buildSurveyState({
      questions: [
        { id: "q1", statement: "Única", type: "single_choice", isRequired: true, options: OPTIONS },
        { id: "q2", statement: "Múltiple", type: "multiple_choice", isRequired: false, options: OPTIONS },
        { id: "q3", statement: "", type: "single_choice", isRequired: true, options: OPTIONS },
      ],
    });
    render(<SurveyPreviewDialog open survey={survey} careerTitle="Sistemas" onOpenChange={vi.fn()} />);
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Encuesta de Empleabilidad" })).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Situación laboral");
    expect(dialog).toHaveTextContent("Sistemas · II-2026 · 03/11/2026 - 15/12/2026");
    expect(dialog).toHaveTextContent(SURVEY_MESSAGES.previewNotice);
    expect(within(dialog).getAllByRole("radio", { name: "Opción 2" })).toHaveLength(2);
    expect(within(dialog).getAllByRole("radiogroup")).toHaveLength(2);
    expect(within(dialog).getAllByRole("checkbox")).toHaveLength(2);
    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent("3. Pregunta sin título");
  });

  it("usa un título genérico y omite los detalles vacíos", () => {
    const survey = buildSurveyState({ title: " ", description: "", academicPeriod: "", opensAt: "", questions: [] });
    render(<SurveyPreviewDialog open survey={survey} careerTitle="" onOpenChange={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Encuesta sin título" })).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("se cierra con el botón Cerrar", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<SurveyPreviewDialog open survey={buildSurveyState()} careerTitle="" onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });
});
