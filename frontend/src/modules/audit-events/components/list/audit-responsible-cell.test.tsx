import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuditResponsibleCell } from "./audit-responsible-cell";

afterEach(cleanup);

describe("AuditResponsibleCell", () => {
  it("muestra el nombre en seminegrita por defecto, como en la tabla", () => {
    render(<AuditResponsibleCell responsible={{ id: "u-1", name: "Carla Montaño", role: "administrativo" }} />);

    const name = screen.getByText("Carla Montaño");
    expect(name).toHaveClass("font-semibold");
    expect(name).not.toHaveClass("font-bold");
    expect(screen.getByText("CM")).toBeInTheDocument();
    expect(screen.getByText("Administrativo")).toBeInTheDocument();
  });

  it("muestra el nombre en negrita cuando se pide énfasis", () => {
    render(<AuditResponsibleCell emphasizeName responsible={{ id: "u-1", name: "Admin Uno", role: "administrativo" }} />);

    expect(screen.getByText("Admin Uno")).toHaveClass("font-bold");
    expect(screen.getByText("AU")).toBeInTheDocument();
  });

  it("usa la etiqueta de proceso automático y el ícono para el sistema", () => {
    render(<AuditResponsibleCell responsible={{ id: "s", name: "Sistema", role: "sistema" }} />);

    expect(screen.getByText("Proceso automático")).toBeInTheDocument();
    expect(screen.queryByText("SI")).not.toBeInTheDocument();
  });
});
