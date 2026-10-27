import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RequestStepsSidebar } from "./request-steps-sidebar";

describe("RequestStepsSidebar: posición fija", () => {
  afterEach(() => cleanup());

  it("queda fija debajo de la cabecera con el alto de la ventana para no perderse al bajar", () => {
    render(<RequestStepsSidebar />);

    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toHaveClass("sticky", "top-app-header", "h-app-sidebar", "self-start");
    expect(screen.getByText(/Tus documentos se guardan cifrados/)).toBeInTheDocument();
  });
});
