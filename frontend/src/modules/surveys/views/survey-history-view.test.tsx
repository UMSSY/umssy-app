import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { surveyHistoryService } from "../services/survey-history.service";
import { SurveyHistoryView } from "./survey-history-view";

const COLUMN_HEADERS = [
  "Título de Encuesta",
  "Administrador Creador",
  "Gestión",
  "Fecha de Creación",
  "Estado",
  "Acciones",
];

function getBodyRows(): HTMLElement[] {
  return screen.getAllByRole("row").slice(1);
}

async function renderLoadedView() {
  render(<SurveyHistoryView />);
  await screen.findByText("Encuesta de Egresados 2026");
}

describe("SurveyHistoryView", () => {
  beforeEach(() => {
    // Se fija la fecha para que la gestión por defecto sea II-2026.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T12:00:00"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("muestra el título, las columnas y las encuestas de la gestión actual", async () => {
    render(<SurveyHistoryView />);

    expect(screen.getByRole("heading", { name: "Historial de Encuestas" })).toBeDefined();
    expect(screen.getByText("Cargando encuestas...")).toBeDefined();
    await screen.findByText("Encuesta de Egresados 2026");

    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(COLUMN_HEADERS);
    expect(screen.getByRole("combobox", { name: "Gestión académica" }).textContent).toContain("II-2026");
    expect(getBodyRows()).toHaveLength(2);
    expect(screen.getByText("Mostrando 1-2 de 2 encuestas")).toBeDefined();

    const firstRow = within(getBodyRows()[0]);
    expect(firstRow.getByText("JD")).toBeDefined();
    expect(firstRow.getByText("juan.davalos@umssy.edu")).toBeDefined();
    expect(firstRow.getByText("2026-10-15 14:32")).toBeDefined();
    expect(firstRow.getByText("Activa")).toBeDefined();
    expect(within(getBodyRows()[1]).getByText("Inactiva")).toBeDefined();
  });

  it("lista solo gestiones académicas concretas, sin la opción Todos", async () => {
    await renderLoadedView();

    await userEvent.setup().click(screen.getByRole("combobox", { name: "Gestión académica" }));

    const options = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(options.slice(0, 3)).toEqual(["II-2026", "I-2026", "II-2025"]);
    expect(options).not.toContain("Todos");
    expect(options).not.toContain("Todas");
  });

  it("muestra únicamente las encuestas de la gestión seleccionada", async () => {
    const user = userEvent.setup();
    await renderLoadedView();

    await user.click(screen.getByRole("combobox", { name: "Gestión académica" }));
    await user.click(await screen.findByRole("option", { name: "I-2026" }));

    await screen.findByText("Encuesta de Inserción Laboral");
    expect(getBodyRows()).toHaveLength(1);
    expect(within(getBodyRows()[0]).getByText("I-2026")).toBeDefined();
    expect(screen.queryByText("Encuesta de Egresados 2026")).toBeNull();
    expect(screen.queryByText("Encuesta de Satisfacción de Titulados")).toBeNull();
  });

  it("filtra por correo electrónico del administrador", async () => {
    await renderLoadedView();

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar por correo electrónico del administrador..." }), {
      target: { value: "carla" },
    });

    await waitFor(() => expect(getBodyRows()).toHaveLength(1));
    expect(screen.getByText("Seguimiento Laboral - Ingeniería")).toBeDefined();
    expect(screen.queryByText("Encuesta de Egresados 2026")).toBeNull();
  });

  it("muestra un mensaje cuando ningún correo coincide", async () => {
    await renderLoadedView();

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar por correo electrónico del administrador..." }), {
      target: { value: "no-existe@umssy.edu" },
    });

    expect(await screen.findByText("No se encontró ninguna encuesta con el correo")).toBeDefined();
  });

  it("abre el detalle de la encuesta con el botón de ver", async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalles de Seguimiento Laboral - Ingeniería" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Ingeniería de Sistemas")).toBeDefined();
    expect(within(dialog).getByText("63")).toBeDefined();
  });

  it("vuelve a cargar el historial con actualizar", async () => {
    const getSurveyHistory = vi.spyOn(surveyHistoryService, "getSurveyHistory");
    await renderLoadedView();

    fireEvent.click(screen.getByRole("button", { name: "actualizar" }));

    await waitFor(() => expect(getSurveyHistory).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Encuesta de Egresados 2026")).toBeDefined();
  });
});
