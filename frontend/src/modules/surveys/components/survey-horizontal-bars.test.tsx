import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SurveyHorizontalBars } from "./survey-horizontal-bars";

const OPTIONS = [
  { id: "a", label: "Opción A", count: 1, percentage: 0.4 },
  { id: "b", label: "Opción B", count: 50, percentage: 12.5 },
  { id: "c", label: "Opción C", count: 0, percentage: 0 },
  { id: "d", label: "Opción D", count: 349, percentage: 87.1 },
];

describe("SurveyHorizontalBars", () => {
  afterEach(cleanup);

  it("dibuja cada barra con un ancho exactamente igual a su porcentaje", () => {
    render(<SurveyHorizontalBars options={OPTIONS} />);

    const widths = screen.getAllByTestId("option-bar").map((bar) => (bar as HTMLElement).style.width);

    expect(widths).toEqual(["0.4%", "12.5%", "0%", "87.1%"]);
  });

  it("no agranda artificialmente las opciones con pocos votos", () => {
    render(<SurveyHorizontalBars options={OPTIONS} />);

    expect((screen.getAllByTestId("option-bar")[0] as HTMLElement).style.width).toBe("0.4%");
  });

  it("muestra el conteo y el porcentaje de cada opción, también las que tienen 0", () => {
    render(<SurveyHorizontalBars options={OPTIONS} />);

    expect(screen.getByLabelText("Opción C: 0 votos, 0%")).toBeInTheDocument();
    expect(screen.getByLabelText("Opción D: 349 votos, 87.1%")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("resalta solo la opción indicada", () => {
    render(<SurveyHorizontalBars options={OPTIONS} highlightedId="d" />);

    const [first, , , highlighted] = screen.getAllByTestId("option-bar");

    expect(highlighted).toHaveClass("bg-accent");
    expect(first).toHaveClass("bg-primary");
  });
});
