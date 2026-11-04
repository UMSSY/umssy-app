import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildMultipleChoiceStatistic,
  buildQuestionStatistic,
} from "../testing/survey-statistics-fixtures";
import { SurveyQuestionResultCard } from "./survey-question-result-card";

describe("SurveyQuestionResultCard", () => {
  afterEach(cleanup);

  it("muestra la etiqueta Pn, el enunciado completo y el tipo de pregunta", () => {
    render(<SurveyQuestionResultCard question={buildQuestionStatistic({ position: 3 })} />);

    expect(screen.getByText("P3")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "¿Cuál es tu situación laboral actual?" })).toBeInTheDocument();
    expect(screen.getByText("Opción única")).toBeInTheDocument();
  });

  it("lista todas las opciones con su conteo absoluto y su porcentaje, incluidas las que tienen 0", () => {
    render(<SurveyQuestionResultCard question={buildQuestionStatistic()} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByLabelText("Trabajador independiente: 3 votos, 60%")).toBeInTheDocument();
    expect(screen.getByLabelText("Buscando empleo: 0 votos, 0%")).toBeInTheDocument();
  });

  it("en opción única cuenta respuestas", () => {
    render(<SurveyQuestionResultCard question={buildQuestionStatistic()} />);

    expect(screen.getByText("5 respuestas registradas")).toBeInTheDocument();
  });

  it("en opción múltiple cuenta selecciones, no personas", () => {
    render(<SurveyQuestionResultCard question={buildMultipleChoiceStatistic()} />);

    expect(screen.getByText("10 selecciones registradas")).toBeInTheDocument();
    expect(screen.getByText("Opción múltiple")).toBeInTheDocument();
  });

  it("los porcentajes del card suman 100% con los datos del backend", () => {
    [buildQuestionStatistic(), buildMultipleChoiceStatistic()].forEach((question) => {
      const { unmount } = render(<SurveyQuestionResultCard question={question} />);

      expect(question.options.reduce((total, option) => total + option.percentage, 0)).toBe(100);
      expect(question.options.reduce((total, option) => total + option.count, 0)).toBe(question.totalSelections);
      unmount();
    });
  });

  it("muestra la tendencia en la zona inferior del card, después del chart", () => {
    const { container } = render(<SurveyQuestionResultCard question={buildQuestionStatistic()} />);

    const card = container.firstElementChild as HTMLElement;
    const trend = within(card).getByText("Tendencia:").closest("p") as HTMLElement;

    expect(card.lastElementChild).toBe(trend);
    expect(trend).toHaveTextContent("La opción más elegida es «Trabajador independiente» con 60% (3 de 5 respuestas).");
  });

  it("un card sin respuestas conserva sus opciones y muestra la tendencia neutra", () => {
    render(
      <SurveyQuestionResultCard
        question={buildQuestionStatistic({
          answeredCount: 0,
          totalSelections: 0,
          options: buildQuestionStatistic().options.map((option) => ({ ...option, count: 0, percentage: 0 })),
          trend: { text: "Sin respuestas registradas en este periodo.", direction: "neutral" },
        })}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("0 respuestas registradas")).toBeInTheDocument();
    expect(screen.getByText(/Sin respuestas registradas en este periodo/)).toBeInTheDocument();
  });
});
