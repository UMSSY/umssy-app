import { describe, expect, it } from "vitest";
import { getPasswordRules, validatePasswords } from "./password-rules";

describe("password-rules", () => {
  it("marca cada requisito cumplido", () => {
    expect(getPasswordRules("Abcdefg1").every((rule) => rule.met)).toBe(true);
    expect(getPasswordRules("abc").map((rule) => rule.met)).toEqual([false, false, false]);
  });

  it("valida requisitos y coincidencia", () => {
    expect(validatePasswords("Abcdefg1", "Abcdefg1")).toEqual({});
    expect(validatePasswords("abc", "abc").password).toBeDefined();
    expect(validatePasswords("Abcdefg1", "Abcdefg2").confirm).toBe("Las contraseñas no coinciden");
    expect(validatePasswords(`A1${"a".repeat(70)}`, "x").password).toContain("máximo");
  });
});
