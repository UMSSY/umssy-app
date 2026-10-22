import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SurveyStatisticsView } from "./survey-statistics-view";

describe("Pantallas de encuestas", () => {
  afterEach(cleanup);

  it("muestra la pantalla de estadísticas de encuestas", () => {
    render(<SurveyStatisticsView />);

    expect(screen.getByRole("heading", { name: "Estadísticas de encuestas" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Todavía no hay estadísticas" })).toBeDefined();
  });
});
