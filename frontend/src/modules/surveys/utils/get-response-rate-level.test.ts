import { describe, expect, it } from "vitest";
import { getResponseRateLevel } from "./get-response-rate-level";

describe("getResponseRateLevel", () => {
  it.each([0, 20, 35])("clasifica %i%% como participación baja", (rate) => {
    expect(getResponseRateLevel(rate)).toBe("low");
  });

  it.each([36, 50, 65])("clasifica %i%% como participación media", (rate) => {
    expect(getResponseRateLevel(rate)).toBe("medium");
  });

  it.each([66, 80, 100])("clasifica %i%% como participación esperada", (rate) => {
    expect(getResponseRateLevel(rate)).toBe("expected");
  });

  it("trata valores inválidos como 0%", () => {
    expect(getResponseRateLevel(Number.NaN)).toBe("low");
  });
});
