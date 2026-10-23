import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SurveyStatisticsView } from "./survey-statistics-view";

describe("Pantalla general de estadísticas de encuestas", () => {
  afterEach(cleanup);

  it("pide elegir una encuesta y enlaza al historial", () => {
    render(<SurveyStatisticsView />);

    expect(screen.getByRole("heading", { name: "Estadísticas de encuestas" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Elige una encuesta" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Ir al historial de encuestas" }).getAttribute("href")).toBe("/backoffice/surveys");
  });
});
