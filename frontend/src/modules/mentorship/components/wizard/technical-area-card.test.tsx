import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TechnicalAreaCard } from "./technical-area-card";

const AREA = {
  id: "backend",
  name: "Desarrollo Backend con un nombre extenso",
  description:
    "Diseño de servicios, APIs y soluciones que necesitan varias líneas de contenido.",
};

afterEach(cleanup);

function SelectableCard() {
  const [isSelected, setIsSelected] = useState(false);
  return (
    <TechnicalAreaCard
      area={AREA}
      isSelected={isSelected}
      onToggle={() => setIsSelected((selected) => !selected)}
    />
  );
}

describe("TechnicalAreaCard", () => {
  it("muestra el nombre y la descripción dentro de una tarjeta flexible", () => {
    render(
      <TechnicalAreaCard
        area={AREA}
        isSelected={false}
        onToggle={vi.fn()}
      />,
    );

    const card = screen.getByRole("button", { name: /Desarrollo Backend/i });
    expect(screen.getByText(AREA.name)).toBeInTheDocument();
    expect(screen.getByText(AREA.description)).toBeInTheDocument();
    expect(card).toHaveClass(
      "h-auto",
      "min-h-40",
      "min-w-0",
      "self-stretch",
      "overflow-hidden",
      "whitespace-normal",
    );
    expect(screen.getByText(AREA.description)).toHaveClass(
      "leading-relaxed",
      "font-normal",
      "break-words",
    );
  });

  it("expone los estilos y aria-pressed del estado inactivo", () => {
    render(
      <TechnicalAreaCard
        area={AREA}
        isSelected={false}
        onToggle={vi.fn()}
      />,
    );

    const card = screen.getByRole("button", { name: /Desarrollo Backend/i });
    expect(card).toHaveAttribute("aria-pressed", "false");
    expect(card).toHaveClass(
      "border-border",
      "bg-surface",
      "hover:bg-surface-soft",
    );
    expect(card).not.toHaveClass("hover:bg-brand-hover");
    expect(card).not.toHaveClass("border-accent", "bg-interaction");
  });

  it("expone los estilos y aria-pressed del estado activo", () => {
    render(
      <TechnicalAreaCard
        area={AREA}
        isSelected
        onToggle={vi.fn()}
      />,
    );

    const card = screen.getByRole("button", { name: /Desarrollo Backend/i });
    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(card).toHaveClass(
      "border-accent",
      "bg-interaction",
      "hover:bg-interaction",
    );
    expect(card.querySelectorAll(".text-accent-foreground")).toHaveLength(2);
  });

  it("permite seleccionar y deseleccionar mediante teclado", async () => {
    const user = userEvent.setup();
    render(<SelectableCard />);
    const card = screen.getByRole("button", { name: /Desarrollo Backend/i });

    card.focus();
    await user.keyboard("{Enter}");
    expect(card).toHaveAttribute("aria-pressed", "true");

    await user.keyboard(" ");
    expect(card).toHaveAttribute("aria-pressed", "false");
  });
});
