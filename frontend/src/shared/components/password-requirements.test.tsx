import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordRequirements } from "./password-requirements";

describe("PasswordRequirements", () => {
  it("renderiza todos los requisitos como pendientes cuando no hay contraseña", () => {
    render(<PasswordRequirements password="" id="reqs" />);

    const list = screen.getByRole("list", { name: "Requisitos de la contraseña" });
    expect(list).toBeDefined();

    const pending = screen.getAllByText("(pendiente)");
    expect(pending.length).toBe(3);
  });

  it("marca los requisitos como cumplidos según la contraseña ingresada", () => {
    render(<PasswordRequirements password="Password1" id="reqs" />);

    const fulfilled = screen.getAllByText("(cumplido)");
    expect(fulfilled.length).toBe(3);
  });
});

