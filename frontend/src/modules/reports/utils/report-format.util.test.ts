import { describe, expect, it } from "vitest";
import { getReportFormatLabel } from "./report-format.util";

describe("getReportFormatLabel", () => {
  it.each([
    ["reporte-usuarios.pdf", "PDF"],
    ["reporte-usuarios.CSV", "CSV"],
    ["reporte.final.pdf", "PDF"],
  ])("devuelve el formato de %s", (fileName, expected) => {
    expect(getReportFormatLabel(fileName)).toBe(expected);
  });

  it("devuelve un guion si no hay una extensión conocida", () => {
    expect(getReportFormatLabel("reporte")).toBe("-");
    expect(getReportFormatLabel("reporte.xlsx")).toBe("-");
  });
});
