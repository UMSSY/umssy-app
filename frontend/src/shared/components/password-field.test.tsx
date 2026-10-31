import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PasswordField } from "./password-field";

describe("PasswordField", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza el label y el input de tipo password por defecto", () => {
    render(<PasswordField id="pass" label="Contraseña" value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Contraseña")).toBeDefined();
    const input = screen.getByLabelText("Contraseña") as HTMLInputElement;
    expect(input.type).toBe("password");
  });

  it("permite alternar la visibilidad de la contraseña", () => {
    render(<PasswordField id="pass" label="Contraseña" value="secreto123" onChange={vi.fn()} />);

    const toggleButton = screen.getByRole("button", { name: /mostrar contraseña/i });
    expect(toggleButton).toBeDefined();

    fireEvent.click(toggleButton);
    const input = screen.getByLabelText("Contraseña") as HTMLInputElement;
    expect(input.type).toBe("text");

    const hideButton = screen.getByRole("button", { name: /ocultar contraseña/i });
    fireEvent.click(hideButton);
    expect(input.type).toBe("password");
  });

  it("llama a onChange al tipear", () => {
    const handleChange = vi.fn();
    render(<PasswordField id="pass" label="Contraseña" value="" onChange={handleChange} />);

    const input = screen.getByLabelText("Contraseña");
    fireEvent.change(input, { target: { value: "MiClave1" } });

    expect(handleChange).toHaveBeenCalledWith("MiClave1");
  });

  it("muestra el mensaje de error cuando se le pasa", () => {
    render(<PasswordField id="pass" label="Contraseña" value="" onChange={vi.fn()} error="Campo requerido" />);

    expect(screen.getByText("Campo requerido")).toBeDefined();
    const input = screen.getByLabelText("Contraseña");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});
