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

  it("permite limpiar el filtro de gestión académica con la opción Todas", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SurveysView />);
    expect(await screen.findByText("Borrador sin carrera")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Gestión académica" }));
    await user.click(await screen.findByRole("option", { name: "2026" }));
    expect(screen.queryByText("Borrador sin carrera")).not.toBeInTheDocument();
    expect(screen.getByText("Encuesta de Empleabilidad")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Gestión académica" }));
    await user.click(await screen.findByRole("option", { name: "Todas" }));
    expect(await screen.findByText("Borrador sin carrera")).toBeInTheDocument();
    expect(screen.getByText("Encuesta de Empleabilidad")).toBeInTheDocument();
  });

  it("CA15: restringe la creación y el listado al rol administrativo", () => {
    expect(getRouteRoles("/backoffice/surveys")).toEqual(["administrativo"]);
    expect(getRouteRoles("/backoffice/surveys/create")).toEqual(["administrativo"]);
  });
});
