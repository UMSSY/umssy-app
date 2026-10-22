import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SurveyListItem } from "../types/survey.types";
import type { SurveysTableProps } from "../types/surveys-table-props.types";
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

function renderTable(props: Partial<SurveysTableProps> = {}) {
  const onToggleStatus = vi.fn();
  render(<SurveysTable surveys={[]} isLoading={false} onToggleStatus={onToggleStatus} {...props} />);
  return { onToggleStatus };
}

describe("SurveysTable", () => {
  afterEach(cleanup);

  it("muestra las columnas en orden", () => {
    renderTable();

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual([
      "Título de Encuesta",
      "Administrador Creador",
      "Gestión",
      "Fecha de Creación",
      "Estado",
      "Acciones",
    ]);
  });

  it("muestra los datos de cada encuesta en su fila", () => {
    renderTable({ surveys: [buildSurvey()] });

    const cells = within(screen.getAllByRole("row")[1]).getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells.slice(0, 5)).toEqual([
      "Encuesta de Empleabilidad",
      "CACarla Arcecarla.arce@umssy.edu",
      "II-2026",
      "2026-10-12 13:21",
      "Activa",
    ]);
  });

  it("indica cuando un borrador todavía no tiene gestión", () => {
    renderTable({ surveys: [buildSurvey({ status: "DRAFT", period: null })] });

    expect(screen.getByText("Sin gestión")).toBeDefined();
  });

  it.each([
    ["PUBLISHED", "Activa", true],
    ["CLOSED", "Inactiva", false],
  ] as const)("una encuesta %s muestra el toggle \"%s\"", (status, label, checked) => {
    renderTable({ surveys: [buildSurvey({ status })] });

    const toggle = screen.getByRole("switch", { name: label });
    expect(toggle.getAttribute("aria-checked")).toBe(String(checked));
  });

  it("un borrador muestra su estado sin toggle", () => {
    renderTable({ surveys: [buildSurvey({ status: "DRAFT" })] });

    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByText("Borrador")).toBeDefined();
  });

  it("al presionar el toggle pide el estado contrario", () => {
    const { onToggleStatus } = renderTable({ surveys: [buildSurvey({ status: "PUBLISHED" })] });

    fireEvent.click(screen.getByRole("switch", { name: "Activa" }));

    expect(onToggleStatus).toHaveBeenCalledWith({ id: "srv-1", status: "CLOSED" });
  });

  it("mientras se guarda muestra el estado nuevo y bloquea el toggle", () => {
    renderTable({ surveys: [buildSurvey({ status: "PUBLISHED" })], pendingChange: { id: "srv-1", status: "CLOSED" } });

    const toggle = screen.getByRole("switch", { name: "Inactiva" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(toggle.hasAttribute("data-disabled")).toBe(true);
  });

  it.each(["PUBLISHED", "CLOSED"] as const)("una encuesta %s enlaza a sus estadísticas y no se puede editar", (status) => {
    renderTable({ surveys: [buildSurvey({ status })] });

    const link = screen.getByRole("link", { name: "Ver estadísticas de Encuesta de Empleabilidad" });
    expect(link.getAttribute("href")).toBe("/backoffice/surveys/statistics/srv-1");
    expect(screen.queryByRole("link", { name: /Editar/ })).toBeNull();
    expect(screen.getByLabelText("Una encuesta publicada ya no se puede editar").getAttribute("aria-disabled")).toBe("true");
  });

  it("un borrador se puede editar y todavía no tiene estadísticas", () => {
    renderTable({ surveys: [buildSurvey({ status: "DRAFT" })] });

    expect(screen.getByRole("link", { name: "Editar Encuesta de Empleabilidad" }).getAttribute("href")).toBe(
      "/backoffice/surveys/srv-1/edit",
    );
    expect(screen.getByLabelText("Las estadísticas estarán disponibles al publicarla").getAttribute("aria-disabled")).toBe("true");
  });

  it("muestra filas de carga mientras carga por primera vez", () => {
    renderTable({ isLoading: true });

    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
  });

  it("mantiene las filas visibles mientras se actualiza", () => {
    renderTable({ isLoading: true, surveys: [buildSurvey()] });

    expect(screen.queryAllByTestId("skeleton-row")).toHaveLength(0);
    expect(screen.getByText("Encuesta de Empleabilidad")).toBeDefined();
  });

  it("muestra el mensaje de error", () => {
    renderTable({ errorMessage: "No se pudieron cargar las encuestas." });

    expect(screen.getByText("No se pudieron cargar las encuestas.")).toBeDefined();
  });

  it("muestra un mensaje si no hay encuestas", () => {
    renderTable();

    expect(screen.getByText("No hay encuestas registradas para la gestión seleccionada.")).toBeDefined();
  });

  it("muestra un mensaje si la búsqueda no encuentra encuestas", () => {
    renderTable({ searchTerm: "nadie" });

    expect(screen.getByRole("status").textContent).toBe("No se encontró ninguna encuesta del administrador con ese correo");
  });
});
