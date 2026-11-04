import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AcademicPeriodFilter } from "./academic-period-filter";

const CLEAR_LABEL = "Quitar filtro de gestión académica";

describe("AcademicPeriodFilter", () => {
  afterEach(() => {
    cleanup();
  });

  it("no muestra el icono X cuando no hay una gestión seleccionada", () => {
    render(<AcademicPeriodFilter periods={["2025", "2026"]} onChange={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: "Gestión académica" })).toHaveTextContent("Selecciona una gestión");
    expect(screen.queryByRole("button", { name: CLEAR_LABEL })).not.toBeInTheDocument();
  });

  it("muestra el icono X con una gestión seleccionada y al pulsarlo limpia el filtro", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AcademicPeriodFilter periods={["2025", "2026"]} value="2026" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: CLEAR_LABEL }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
