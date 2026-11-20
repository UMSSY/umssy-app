import { describe, expect, it } from "vitest";
import { sanitizeNameInput } from "./sanitize-name-input";

describe("sanitizeNameInput", () => {
  it("keeps letters, accents and the separators of compound names", () => {
    expect(sanitizeNameInput("María José")).toBe("María José");
    expect(sanitizeNameInput("Peña Ñáñez")).toBe("Peña Ñáñez");
    expect(sanitizeNameInput("O'Connor-Vargas")).toBe("O'Connor-Vargas");
  });

  it("drops digits and symbols", () => {
    expect(sanitizeNameInput("christian2134")).toBe("christian");
    expect(sanitizeNameInput("segund 123")).toBe("segund ");
    expect(sanitizeNameInput("Ana@#$%")).toBe("Ana");
  });

  it("returns an empty text for an empty value", () => {
    expect(sanitizeNameInput("")).toBe("");
  });
});
