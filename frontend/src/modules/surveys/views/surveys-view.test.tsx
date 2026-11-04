import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { getRouteRoles } from "@/shared/utils/get-route-roles";
import { surveysService } from "../services/surveys.service";
import { apiResponse, SURVEY_SUMMARIES } from "../testing/survey-fixtures";
import { SurveysView } from "./surveys-view";

describe("SurveysView", () => {
  beforeEach(() => {
    vi.spyOn(surveysService, "listSurveys").mockResolvedValue(apiResponse(SURVEY_SUMMARIES));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("CA1: muestra la página Historial de Encuestas con el botón Crear encuesta", async () => {
    renderWithQuery(<SurveysView />);

    expect(screen.getByRole("heading", { name: "Historial de Encuestas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear encuesta" })).toHaveAttribute("href", "/backoffice/surveys/create");
    expect(await screen.findByText("Encuesta de Empleabilidad")).toBeInTheDocument();
  });

  it("CA2: muestra el buscador con el texto Buscar por correo electrónico", async () => {
    renderWithQuery(<SurveysView />);

    expect(await screen.findByPlaceholderText("Buscar por correo electrónico")).toBeInTheDocument();
  });

  it("CA3: el dropdown de gestión académica lista solo años, sin la opción Todas", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SurveysView />);
    await screen.findByText("Encuesta de Empleabilidad");

    const periodSelect = screen.getByRole("combobox", { name: "Gestión académica" });
    expect(periodSelect).toHaveTextContent("Selecciona una gestión");
    await user.click(periodSelect);
    expect(await screen.findByRole("option", { name: "2026" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Todas" })).not.toBeInTheDocument();
  });

  it("CA14: al elegir una gestión muestra solo las encuestas de ese año", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SurveysView />);
    expect(await screen.findByText("Borrador sin carrera")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Gestión académica" }));
    await user.click(await screen.findByRole("option", { name: "2026" }));
    expect(screen.queryByText("Borrador sin carrera")).not.toBeInTheDocument();
    expect(screen.getByText("Encuesta de Empleabilidad")).toBeInTheDocument();
  });

  it("CA13: filtra las filas por el correo electrónico del autor", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SurveysView />);
    await screen.findByText("Encuesta de Empleabilidad");

    await user.type(screen.getByPlaceholderText("Buscar por correo electrónico"), "carla.arce");
    expect(screen.getByText("Borrador sin carrera")).toBeInTheDocument();
    expect(screen.queryByText("Encuesta de Empleabilidad")).not.toBeInTheDocument();
  });

  it("CA8 y CA9: muestra el badge Publicada en verde y Cerrada en rojo", async () => {
    vi.mocked(surveysService.listSurveys).mockResolvedValue(
      apiResponse([...SURVEY_SUMMARIES, { ...SURVEY_SUMMARIES[0], id: "survey-3", title: "Encuesta cerrada", status: "closed" }]),
    );
    renderWithQuery(<SurveysView />);
    await screen.findByText("Encuesta cerrada");

    expect(screen.getByText("Publicada")).toHaveClass("bg-success/10", "text-success");
    expect(screen.getByText("Cerrada")).toHaveClass("bg-danger/10", "text-danger");
  });

  it("CA15: restringe la creación y el listado al rol administrativo", () => {
    expect(getRouteRoles("/backoffice/surveys")).toEqual(["administrativo"]);
    expect(getRouteRoles("/backoffice/surveys/create")).toEqual(["administrativo"]);
  });
});
