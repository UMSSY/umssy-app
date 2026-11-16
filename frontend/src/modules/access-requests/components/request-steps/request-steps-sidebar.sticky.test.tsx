import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RequestStepsSidebar } from "./request-steps-sidebar";

describe("RequestStepsSidebar: posición fija", () => {
  afterEach(() => cleanup());

  it("desde lg queda fija debajo de la cabecera con el alto de la ventana para no perderse al bajar", () => {
    render(<RequestStepsSidebar />);

    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toHaveClass("lg:sticky", "lg:top-app-header", "lg:h-app-sidebar", "lg:self-start");
    expect(screen.getByText(/Tus documentos se guardan cifrados/)).toBeInTheDocument();
  });

  it("en celular ocupa todo el ancho arriba del formulario y muestra los pasos en cuadrícula", () => {
    render(<RequestStepsSidebar currentStep={2} />);

    expect(screen.getByRole("complementary")).toHaveClass("w-full", "lg:w-72");
    expect(screen.getByRole("list")).toHaveClass("grid", "grid-cols-2", "sm:grid-cols-4", "lg:block");
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("aria-current", "step");
  });
});
