import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FILTERS } from "../utils/filter-recommended-jobs";
import { RecommendedJobsFilters } from "./recommended-jobs-filters";

afterEach(() => {
  cleanup();
});

function renderFilters(overrides: Partial<Parameters<typeof RecommendedJobsFilters>[0]> = {}) {
  const props = {
    filters: DEFAULT_FILTERS,
    modalities: ["Híbrido", "Remoto"],
    onChange: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
  render(<RecommendedJobsFilters {...props} />);
  return props;
}

describe("RecommendedJobsFilters", () => {
  it("muestra el buscador, la modalidad con Todas, la casilla y el enlace Limpiar", () => {
    renderFilters();

    expect(screen.getByRole("search", { name: "Filtrar vacantes" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveAttribute("placeholder", "Buscar");
    expect(screen.getByLabelText("Modalidad:")).toHaveValue("");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Todas",
      "Híbrido",
      "Remoto",
    ]);
    expect(screen.getByRole("checkbox", { name: "Solo alta afinidad" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
  });

  it("informa la búsqueda escrita", () => {
    const { onChange } = renderFilters();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), { target: { value: "python" } });

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, search: "python" });
  });

  it("informa la modalidad elegida", () => {
    const { onChange } = renderFilters();

    fireEvent.change(screen.getByLabelText("Modalidad:"), { target: { value: "Remoto" } });

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, modality: "Remoto" });
  });

  it("informa el cambio de Solo alta afinidad", async () => {
    const { onChange } = renderFilters();

    await userEvent.click(screen.getByRole("checkbox", { name: "Solo alta afinidad" }));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, highAffinityOnly: true });
  });

  it("refleja los filtros recibidos", () => {
    renderFilters({ filters: { search: "sql", modality: "Híbrido", highAffinityOnly: true } });

    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveValue("sql");
    expect(screen.getByLabelText("Modalidad:")).toHaveValue("Híbrido");
    expect(screen.getByRole("checkbox", { name: "Solo alta afinidad" })).toBeChecked();
  });

  it("llama a onClear con Limpiar", async () => {
    const { onClear } = renderFilters();

    await userEvent.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
