import { describe, it, expect } from "vitest";
import { getPasswordRules, validatePasswords } from "./password-rules";

describe("password-rules", () => {
  describe("getPasswordRules", () => {
    it("marca todas las reglas como no cumplidas para una contraseña vacía", () => {
      const rules = getPasswordRules("");
      expect(rules.every((rule) => !rule.met)).toBe(true);
    });

    it("evalúa correctamente longitud, mayúscula y número", () => {
      const shortNoUpperNoDigit = getPasswordRules("abc");
      expect(shortNoUpperNoDigit.find((r) => r.id === "length")?.met).toBe(false);
      expect(shortNoUpperNoDigit.find((r) => r.id === "uppercase")?.met).toBe(false);
      expect(shortNoUpperNoDigit.find((r) => r.id === "digit")?.met).toBe(false);

      const valid = getPasswordRules("Valida123");
      expect(valid.find((r) => r.id === "length")?.met).toBe(true);
      expect(valid.find((r) => r.id === "uppercase")?.met).toBe(true);
      expect(valid.find((r) => r.id === "digit")?.met).toBe(true);
    });
  });

  describe("validatePasswords", () => {
    it("retorna error si la contraseña excede la longitud máxima", () => {
      const longPassword = "A1" + "a".repeat(65);
      const errors = validatePasswords(longPassword, longPassword);
      expect(errors.password).toContain("como máximo 64 caracteres");
    });

    it("retorna error si no cumple los requisitos", () => {
      const errors = validatePasswords("invalida", "invalida");
      expect(errors.password).toBe("La contraseña no cumple los requisitos");
    });

    it("retorna error si las contraseñas no coinciden", () => {
      const errors = validatePasswords("Password123", "Password456");
      expect(errors.confirm).toBe("Las contraseñas no coinciden");
    });

    it("no retorna errores para contraseñas válidas e iguales", () => {
      const errors = validatePasswords("Password123", "Password123");
      expect(errors.password).toBeUndefined();
      expect(errors.confirm).toBeUndefined();
    });
  });
});

