import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SurveyValidationAlert } from "./survey-validation-alert";

describe("SurveyValidationAlert", () => {
  afterEach(() => {
    cleanup();
  });

  it("lista los errores con su etiqueta", () => {
    render(
      <SurveyValidationAlert
        errors={[
          { path: "closesAt", label: "Fecha de cierre", message: "", summary: "debe ser posterior a la fecha de apertura." },
          { path: "questions.3.statement", label: "Pregunta 4", message: "", summary: "el enunciado es obligatorio." },
        ]}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Complete los campos obligatorios antes de publicar");
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Fecha de cierre: debe ser posterior a la fecha de apertura.",
      "Pregunta 4: el enunciado es obligatorio.",
    ]);
  });

  it("no se muestra sin errores", () => {
    render(<SurveyValidationAlert errors={[]} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
