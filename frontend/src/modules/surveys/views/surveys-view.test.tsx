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
    // Se fija la fecha para que la gestión por defecto sea 2026.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T12:00:00"));
    vi.spyOn(surveysService, "listSurveys").mockResolvedValue(apiResponse(SURVEY_SUMMARIES));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("CA1: muestra la página Historial de Encuestas con el botón Crear encuesta", async () => {
    renderWithQuery(<SurveysView />);

    expect(screen.getByRole("heading", { name: "Historial de Encuestas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear encuesta" })).toHaveAttribute("href", "/backoffice/surveys/create");
    expect(await screen.findByText("Encuesta de Empleabilidad")).toBeInTheDocument();
  });

  it("lista solo gestiones concretas, sin la opción Todos, y selecciona el año actual", async () => {
    renderWithQuery(<SurveysView />);

    const select = screen.getByRole("combobox", { name: "Gestión académica" });
    expect(select.textContent).toContain("2026");

    await userEvent.setup().click(select);
    const options = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(options[0]).toBe("2026");
    expect(options).not.toContain("Todos");
    expect(options).not.toContain("Todas");
  });

  it("muestra únicamente las encuestas de la gestión seleccionada", async () => {
    vi.mocked(surveysService.listSurveys).mockResolvedValue(
      apiResponse([
        ...SURVEY_SUMMARIES,
        { ...SURVEY_SUMMARIES[0], id: "survey-2020", title: "Encuesta 2020", academicPeriod: "2020" },
        { ...SURVEY_SUMMARIES[0], id: "survey-all", title: "Encuesta de todas las gestiones", academicPeriod: "Todas" },
      ]),
    );
    const user = userEvent.setup();
    renderWithQuery(<SurveysView />);
    await screen.findByText("Encuesta de Empleabilidad");

    await user.click(screen.getByRole("combobox", { name: "Gestión académica" }));
    await user.click(await screen.findByRole("option", { name: "2020" }));

    expect(await screen.findByText("Encuesta 2020")).toBeInTheDocument();
    expect(screen.queryByText("Encuesta de Empleabilidad")).not.toBeInTheDocument();
    expect(screen.queryByText("Encuesta de todas las gestiones")).not.toBeInTheDocument();
  });

  it("CA15: restringe la creación y el listado al rol administrativo", () => {
    expect(getRouteRoles("/backoffice/surveys")).toEqual(["administrativo"]);
    expect(getRouteRoles("/backoffice/surveys/create")).toEqual(["administrativo"]);
  });
});
