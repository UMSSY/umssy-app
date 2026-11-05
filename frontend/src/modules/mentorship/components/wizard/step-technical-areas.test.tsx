import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { StepTechnicalAreas } from "./step-technical-areas";

const AREAS = [
  {
    id: "backend",
    name: "Backend",
    description: "Servicios y APIs",
  },
  {
    id: "frontend",
    name: "Frontend",
    description: "Interfaces accesibles",
  },
];

afterEach(cleanup);

function TechnicalAreasHarness() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <StepTechnicalAreas
      technicalAreas={AREAS}
      selectedIds={selectedIds}
      onToggle={(id) =>
        setSelectedIds((current) =>
          current.includes(id)
            ? current.filter((selectedId) => selectedId !== id)
            : [...current, id],
        )
      }
    />
  );
}

describe("StepTechnicalAreas", () => {
  it("actualiza el contador y la validación al seleccionar y deseleccionar", async () => {
    const user = userEvent.setup();
    render(<TechnicalAreasHarness />);

    expect(screen.getByText("0 seleccionadas")).toBeInTheDocument();
    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("Debe seleccionarse al menos un área para continuar");

    const backend = screen.getByRole("button", { name: /Backend/i });
    await user.click(backend);
    expect(screen.getByText("1 seleccionada")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(backend).toHaveAttribute("aria-pressed", "true");

    await user.click(backend);
    expect(screen.getByText("0 seleccionadas")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(backend).toHaveAttribute("aria-pressed", "false");
  });

  it("mantiene selecciones independientes y usa el grid responsivo", async () => {
    const user = userEvent.setup();
    const { container } = render(<TechnicalAreasHarness />);
    const grid = container.querySelector(".grid");

    expect(grid).toHaveClass("grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3");
    await user.click(screen.getByRole("button", { name: /Backend/i }));
    await user.click(screen.getByRole("button", { name: /Frontend/i }));
    expect(screen.getByText("2 seleccionadas")).toBeInTheDocument();
  });
});
