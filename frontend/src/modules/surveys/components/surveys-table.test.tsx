import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SurveyListItem } from "../types/survey.types";
import { SurveysTable } from "./surveys-table";

function buildSurvey(overrides: Partial<SurveyListItem> = {}): SurveyListItem {
  return {
    id: "srv-1",
    title: "Encuesta de Empleabilidad",
    creator: { fullName: "Carla Arce", email: "carla.arce@umssy.edu" },
    period: "II-2026",
    createdAt: "2026-10-12T13:21:00",
    status: "PUBLISHED",
    ...overrides,
  };
}

describe("SurveysTable", () => {
  afterEach(cleanup);

  it("muestra las columnas en orden", () => {
    render(<SurveysTable surveys={[]} isLoading={false} />);

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual([
      "Título de la encuesta",
      "Administrador creador",
      "Gestión",
      "Fecha de creación",
      "Estado",
      "Estadísticas",
    ]);
  });

  it("muestra los datos de cada encuesta en su fila", () => {
    render(<SurveysTable surveys={[buildSurvey()]} isLoading={false} />);

    const cells = within(screen.getAllByRole("row")[1]).getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells.slice(0, 5)).toEqual([
      "Encuesta de Empleabilidad",
      "CACarla Arcecarla.arce@umssy.edu",
      "II-2026",
      "2026-10-12 13:21",
      "Publicada",
    ]);
  });

  it.each([
    ["DRAFT", "Borrador"],
    ["PUBLISHED", "Publicada"],
    ["CLOSED", "Cerrada"],
  ] as const)("muestra el estado %s como \"%s\"", (status, label) => {
    render(<SurveysTable surveys={[buildSurvey({ status })]} isLoading={false} />);

    expect(screen.getByText(label)).toBeDefined();
  });

  it.each(["PUBLISHED", "CLOSED"] as const)("en una encuesta %s enlaza a sus estadísticas", (status) => {
    render(<SurveysTable surveys={[buildSurvey({ status })]} isLoading={false} />);

    const link = screen.getByRole("link", { name: "Ver estadísticas de Encuesta de Empleabilidad" });
    expect(link.getAttribute("href")).toBe("/backoffice/surveys/statistics/srv-1");
  });

  it("un borrador no tiene estadísticas", () => {
    render(<SurveysTable surveys={[buildSurvey({ status: "DRAFT" })]} isLoading={false} />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Sin estadísticas")).toBeDefined();
  });

  it("muestra filas de carga mientras carga", () => {
    render(<SurveysTable surveys={[]} isLoading />);

    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
  });

  it("muestra el mensaje de error", () => {
    render(<SurveysTable surveys={[]} isLoading={false} errorMessage="No se pudieron cargar las encuestas." />);

    expect(screen.getByText("No se pudieron cargar las encuestas.")).toBeDefined();
  });

  it("muestra un mensaje si no hay encuestas", () => {
    render(<SurveysTable surveys={[]} isLoading={false} />);

    expect(screen.getByText("No hay encuestas registradas para la gestión seleccionada.")).toBeDefined();
  });

  it("muestra un mensaje si la búsqueda no encuentra encuestas", () => {
    render(<SurveysTable surveys={[]} isLoading={false} searchTerm="nadie" />);

    expect(screen.getByRole("status").textContent).toBe("No se encontró ninguna encuesta del administrador con ese correo");
  });
});
