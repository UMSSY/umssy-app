import { describe, it, expect } from "vitest";
import { maskEmail } from "./mask-email";

describe("maskEmail", () => {
  it("enmascara un correo mostrando dos letras visibles seguidas de asteriscos", () => {
    expect(maskEmail("keyla@gmail.com")).toBe("ke***@gmail.com");
    expect(maskEmail("usuario@umss.edu")).toBe("us***@umss.edu");
  });

  it("enmascara un correo de un solo caracter visible antes del arroba", () => {
    expect(maskEmail("a@x.com")).toBe("a***@x.com");
  });

  it("devuelve la cadena original si no tiene arroba", () => {
    expect(maskEmail("sin-arroba")).toBe("sin-arroba");
  });

  it("devuelve cadena vacía si el email es vacío", () => {
    expect(maskEmail("")).toBe("");
  });
});

