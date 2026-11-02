import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_JOB_OFFER_FILTERS } from "../utils/filter-job-offers";
import { VacancyFiltersDialog } from "./vacancy-filters-dialog";

describe("VacancyFiltersDialog", () => {
  afterEach(() => cleanup());

  it("no muestra el filtro de estado por defecto", async () => {
    const user = userEvent.setup();
    render(
      <VacancyFiltersDialog filters={DEFAULT_JOB_OFFER_FILTERS} onChange={vi.fn()} onReset={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));

    expect(screen.queryByRole("heading", { name: "Estado" })).not.toBeInTheDocument();
  });

  it("muestra las opciones de estado cuando se habilita", async () => {
    const user = userEvent.setup();
    render(
      <VacancyFiltersDialog
        filters={DEFAULT_JOB_OFFER_FILTERS}
        onChange={vi.fn()}
        onReset={vi.fn()}
        showStatusFilter
      />,
    );

    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));

    expect(screen.getByRole("heading", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Activas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerradas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminadas" })).toBeInTheDocument();
  });

  it.each([
    ["Activas", "Publicada"],
    ["Cerradas", "Cerrada"],
    ["Eliminadas", "Eliminada"],
  ])("selecciona el estado %s", async (label, value) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VacancyFiltersDialog
        filters={DEFAULT_JOB_OFFER_FILTERS}
        onChange={onChange}
        onReset={vi.fn()}
        showStatusFilter
      />,
    );

    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));
    await user.click(screen.getByRole("button", { name: label }));

    expect(onChange).toHaveBeenCalledWith("status", value);
  });

  it("restablece el estado con la opción Todas", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VacancyFiltersDialog
        filters={{ ...DEFAULT_JOB_OFFER_FILTERS, status: "Cerrada" }}
        onChange={onChange}
        onReset={vi.fn()}
        showStatusFilter
      />,
    );

    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));
    await user.click(screen.getByRole("button", { name: "Todas" }));

    expect(onChange).toHaveBeenCalledWith("status", "");
  });

  it("cuenta el estado como filtro activo solo cuando se habilita", () => {
    const filters = { ...DEFAULT_JOB_OFFER_FILTERS, status: "Cerrada" };
    const { rerender } = render(
      <VacancyFiltersDialog filters={filters} onChange={vi.fn()} onReset={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Filtrar por" })).toBeInTheDocument();

    rerender(
      <VacancyFiltersDialog filters={filters} onChange={vi.fn()} onReset={vi.fn()} showStatusFilter />,
    );

    expect(screen.getByRole("button", { name: "Filtrar por (1)" })).toBeInTheDocument();
  });
});