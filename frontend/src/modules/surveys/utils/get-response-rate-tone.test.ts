import { describe, expect, it } from "vitest";
import { getResponseRateTone } from "./get-response-rate-tone";

describe("getResponseRateTone", () => {
  it.each([0, 20, 35])("usa Danger para %i%%", (rate) => {
    expect(getResponseRateTone(rate)).toBe("danger");
  });

  it.each([36, 50, 65])("usa Warning para %i%%", (rate) => {
    expect(getResponseRateTone(rate)).toBe("warning");
  });

  it.each([66, 80, 100])("usa Success para %i%%", (rate) => {
    expect(getResponseRateTone(rate)).toBe("success");
  });

  it("trata valores inválidos como 0%", () => {
    expect(getResponseRateTone(Number.NaN)).toBe("danger");
  });
});
