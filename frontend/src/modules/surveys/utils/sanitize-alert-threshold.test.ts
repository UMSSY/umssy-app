import { describe, expect, it } from "vitest";
import { sanitizeAlertThreshold } from "./sanitize-alert-threshold";

describe("sanitizeAlertThreshold", () => {
  it.each([
    ["25", "25"],
    ["abc", ""],
    ["diez", ""],
    ["1e5", "15"],
    ["-3", "3"],
    ["10.5", "10"],
    ["+7", "7"],
    [" 4 ", "4"],
    ["", ""],
  ])("limpia %j y deja %j", (value, expected) => {
    expect(sanitizeAlertThreshold(value)).toBe(expected);
  });

  it("limita la entrada a los dígitos del valor máximo", () => {
    expect(sanitizeAlertThreshold("1234")).toBe("12");
  });
});
