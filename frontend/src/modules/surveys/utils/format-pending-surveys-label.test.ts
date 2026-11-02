import { describe, expect, it } from "vitest";
import { formatPendingSurveysLabel } from "./format-pending-surveys-label";

describe("formatPendingSurveysLabel", () => {
  it("usa singular y plural según la cantidad de pendientes", () => {
    expect(formatPendingSurveysLabel(1)).toBe("1 pendiente");
    expect(formatPendingSurveysLabel(2)).toBe("2 pendientes");
  });

  it("indica cuando no hay pendientes", () => {
    expect(formatPendingSurveysLabel(0)).toBe("Sin pendientes");
  });
});
