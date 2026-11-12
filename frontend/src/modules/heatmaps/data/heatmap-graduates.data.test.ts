import { describe, expect, it } from "vitest";
import { generateHeatmapGraduates } from "./heatmap-graduates.data";

describe("generateHeatmapGraduates", () => {
  it("genera datos deterministas con la misma semilla", () => {
    expect(generateHeatmapGraduates(20, 7)).toEqual(generateHeatmapGraduates(20, 7));
  });

  it("incluye registros sin salario, sin experiencia y sin encuesta para probar exclusiones", () => {
    const records = generateHeatmapGraduates();
    expect(records.some((record) => record.monthlySalary === null)).toBe(true);
    expect(records.some((record) => record.experienceYears === null)).toBe(true);
    expect(records.some((record) => record.employmentStatus === null)).toBe(true);
  });
});
