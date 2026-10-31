import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { OtpInput } from "./otp-input";

describe("OtpInput", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza 6 casillas por defecto", () => {
    render(<OtpInput value="" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("permite escribir dígitos y avanza a la siguiente casilla", () => {
    const onChange = vi.fn();
    render(<OtpInput value="1" onChange={onChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith("12");
  });

  it("redirige el dígito a la primera casilla vacía si se escribe en una posterior", () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[2], { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith("5");
  });

  it("borra el dígito anterior con backspace cuando la casilla actual está vacía", () => {
    const onChange = vi.fn();
    render(<OtpInput value="12" onChange={onChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[2], { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("permite navegar con flechas izquierda y derecha", () => {
    render(<OtpInput value="123" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");

    fireEvent.keyDown(inputs[1], { key: "ArrowRight" });
    fireEvent.keyDown(inputs[1], { key: "ArrowLeft" });
  });

  it("soporta pegar un código de 6 dígitos completo", () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "654321",
      },
    });

    expect(onChange).toHaveBeenCalledWith("654321");
  });

  it("aplica aria-invalid y aria-describedby cuando está en estado inválido", () => {
    render(<OtpInput value="" onChange={vi.fn()} invalid describedBy="error-id" />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveAttribute("aria-invalid", "true");
    expect(inputs[0]).toHaveAttribute("aria-describedby", "error-id");
  });
});

