import { describe, expect, it } from "vitest";
import { formatCvPeriod } from "./format-cv-period";

describe("formatCvPeriod", () => {
  it("formats a closed period with short month names", () => {
    expect(formatCvPeriod("2019-03-01", "2020-12-01")).toBe("mar 2019 – dic 2020");
  });

  it("shows the current label for ongoing periods", () => {
    expect(formatCvPeriod("2021-02-01", null, true)).toBe("feb 2021 – Actualidad");
  });

  it("shows the known date when the other one is missing", () => {
    expect(formatCvPeriod(null, "2015-01-01")).toBe("ene 2015");
  });

  it("falls back when there are no dates", () => {
    expect(formatCvPeriod(null, undefined)).toBe("Sin fecha");
  });
});
