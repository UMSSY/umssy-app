import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSurveyState, CAREERS } from "../testing/survey-fixtures";
import type { SurveyHeaderCardProps } from "../types/survey-component-props.types";
import { SurveyHeaderCard } from "./survey-header-card";

function renderHeader(overrides: Partial<SurveyHeaderCardProps> = {}) {
  const props: SurveyHeaderCardProps = {
    values: buildSurveyState({ careerId: "", academicPeriod: "", opensAt: "", closesAt: "" }),
    careers: CAREERS,
    isLoadingCareers: false,
    academicPeriods: ["2026", "2025"],
    minDate: new Date(2026, 9, 22),
    errors: {},
    onFieldChange: vi.fn(),
    ...overrides,
  };
  render(<SurveyHeaderCard {...props} />);
  return { props, user: userEvent.setup() };
}

describe("SurveyHeaderCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("notifica cambios de título, descripción, carrera y gestión", async () => {
    const { props, user } = renderHeader();

    await user.type(screen.getByLabelText("Título"), "!");
    await user.type(screen.getByLabelText("Descripción"), "?");
    await user.click(screen.getByRole("combobox", { name: "Carrera dirigida" }));
    await user.click(await screen.findByRole("option", { name: CAREERS[1].title }));
    await user.click(screen.getByRole("combobox", { name: "Gestión" }));
    await user.click(await screen.findByRole("option", { name: "2025" }));

    expect(props.onFieldChange).toHaveBeenCalledWith("title", "Encuesta de Empleabilidad!");
    expect(props.onFieldChange).toHaveBeenCalledWith("description", "Situación laboral?");
    expect(props.onFieldChange).toHaveBeenCalledWith("careerId", CAREERS[1].id);
    expect(props.onFieldChange).toHaveBeenCalledWith("academicPeriod", "2025");
  });

  it("ofrece todas las gestiones y los años sin semestre", async () => {
    const { props, user } = renderHeader();

    await user.click(screen.getByRole("combobox", { name: "Gestión" }));
    const options = await screen.findAllByRole("option");

    expect(options.map((option) => option.textContent)).toEqual(["Todas", "2026", "2025"]);
    await user.click(screen.getByRole("option", { name: "Todas" }));
    expect(props.onFieldChange).toHaveBeenCalledWith("academicPeriod", "Todas");
  });

  it("muestra la opción Todas cuando está seleccionada", () => {
    renderHeader({ values: buildSurveyState({ academicPeriod: "Todas" }) });

    expect(screen.getByRole("combobox", { name: "Gestión" })).toHaveTextContent("Todas");
  });

  it("muestra los placeholders de los selectores y de las fechas", () => {
    renderHeader({ isLoadingCareers: true });

    expect(screen.getByRole("combobox", { name: "Carrera dirigida" })).toHaveTextContent("Cargando...");
    expect(screen.getByRole("combobox", { name: "Gestión" })).toHaveTextContent("Seleccione la gestión");
    expect(screen.getByLabelText(/^Apertura/)).toHaveAttribute("placeholder", "dd/mm/aaaa");
  });

  it("muestra la carrera y la fecha seleccionadas", () => {
    renderHeader({ values: buildSurveyState() });

    expect(screen.getByRole("combobox", { name: "Carrera dirigida" })).toHaveTextContent(CAREERS[0].title);
    expect(screen.getByLabelText(/^Apertura/)).toHaveValue("03/11/2026");
    expect(screen.getByLabelText(/^Cierre/)).toHaveValue("15/12/2026");
  });

  it("marca los campos inválidos con su mensaje", () => {
    renderHeader({
      errors: { title: "Título inválido", academicPeriod: "Gestión inválida", closesAt: "Cierre inválido" },
      careersErrorMessage: "No se pudieron cargar las carreras",
    });

    expect(screen.getByLabelText("Título")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("combobox", { name: "Gestión" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^Cierre/)).toHaveAttribute("aria-invalid", "true");
    for (const message of ["Título inválido", "Gestión inválida", "Cierre inválido", "No se pudieron cargar las carreras"]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  });
});
