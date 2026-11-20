import { describe, expect, it } from "vitest";
import { sanitizePhoneInput } from "./sanitize-phone-input";

describe("sanitizePhoneInput", () => {
  it("keeps a phone with 15 digits or less unchanged", () => {
    expect(sanitizePhoneInput("+591 700-00000")).toBe("+591 700-00000");
    expect(sanitizePhoneInput("123456789012345")).toBe("123456789012345");
  });

  it("drops the digits after the fifteenth", () => {
    expect(sanitizePhoneInput("1234567890123456789")).toBe("123456789012345");
  });

  it("does not count spaces, hyphens or the plus sign as digits", () => {
    expect(sanitizePhoneInput("+591 7000-0000-0000 99")).toBe("+591 7000-0000-0000 ");
  });

  it("drops letters and symbols that are not phone separators", () => {
    expect(sanitizePhoneInput("prueba")).toBe("");
    expect(sanitizePhoneInput("7a0b0c1234")).toBe("7001234");
    expect(sanitizePhoneInput("(591) 700/00000")).toBe("591 70000000");
  });

  it("returns an empty text for an empty value", () => {
    expect(sanitizePhoneInput("")).toBe("");
  });
});
