import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SurveyQuestionTrend } from "./survey-question-trend";

describe("SurveyQuestionTrend", () => {
  afterEach(cleanup);

  it.each([
    ["up", "Tendencia al alza", "text-accent"],
    ["down", "Tendencia a la baja", "text-danger"],
    ["neutral", "Tendencia estable", "text-text-secondary"],
  ] as const)("con dirección %s muestra el icono «%s»", (direction, label, color) => {
    render(<SurveyQuestionTrend trend={{ text: "Texto de la tendencia.", direction }} />);

    const icon = screen.getByRole("img", { name: label });

    expect(icon).toHaveClass(color);
    expect(screen.getByText("Tendencia:")).toBeInTheDocument();
    expect(screen.getByText(/Texto de la tendencia\./)).toBeInTheDocument();
  });
});
