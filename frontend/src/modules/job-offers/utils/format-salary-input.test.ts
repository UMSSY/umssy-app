import { describe, expect, it } from "vitest";
import { countDigits, findCaretAfterDigits, formatSalaryInput } from "./format-salary-input";

describe("formatSalaryInput", () => {
  it("formatea un monto y un rango separado por espacio o guion", () => {
    expect(formatSalaryInput("5000", "")).toBe("Bs 5.000");
    expect(formatSalaryInput("6500 8000", "")).toBe("Bs 6.500 - 8.000");
    expect(formatSalaryInput("6500-8000", "")).toBe("Bs 6.500 - 8.000");
  });

  it("ignora símbolos y el guion inicial", () => {
    expect(formatSalaryInput("-100", "")).toBe("Bs 100");
    expect(formatSalaryInput("@#$", "")).toBe("");
  });

  it("conserva el guion al borrar el primer dígito del máximo", () => {
    expect(formatSalaryInput("Bs 6.500 - ", "Bs 6.500 - 8")).toBe("Bs 6.500 - ");
  });

  it("quita el guion solo cuando se borra el separador", () => {
    expect(formatSalaryInput("Bs 6.500 -", "Bs 6.500 - ")).toBe("Bs 6.500");
  });

  it("limita cada monto a 9 dígitos sin pasar a notación científica", () => {
    expect(formatSalaryInput("6500000000000000000000 8000", "")).toBe("Bs 650.000.000 - 8.000");
  });

  it("quita ceros a la izquierda pero conserva el cero solo", () => {
    expect(formatSalaryInput("0500", "")).toBe("Bs 500");
    expect(formatSalaryInput("0", "")).toBe("Bs 0");
  });
});

describe("cursor del salario", () => {
  it("cuenta los dígitos antes del cursor", () => {
    expect(countDigits("Bs 6.50")).toBe(3);
  });

  it("ubica el cursor después del mismo número de dígitos en el texto formateado", () => {
    expect(findCaretAfterDigits("Bs 650 - 8.000", 3)).toBe(6);
    expect(findCaretAfterDigits("Bs 6.500 - 8.000", 5)).toBe(12);
  });

  it("ubica el cursor tras el prefijo sin dígitos y al final si sobran", () => {
    expect(findCaretAfterDigits("Bs 500", 0)).toBe(3);
    expect(findCaretAfterDigits("Bs 500", 9)).toBe(6);
  });
});
