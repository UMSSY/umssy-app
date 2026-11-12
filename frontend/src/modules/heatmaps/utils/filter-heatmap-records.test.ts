import { describe, expect, it } from "vitest";
import type { HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";
import { filterHeatmapRecords } from "./filter-heatmap-records";

function record(id: string, answeredAt: string, career: HeatmapGraduateRecord["career"] = "systems"): HeatmapGraduateRecord {
  return { id, career, answeredAt, skills: ["sql"], nlpSkills: ["sql"], monthlySalary: 4000, employmentStatus: "employed-in-field", experienceYears: 1 };
}

const RECORDS = [
  record("a", "2023-06-30T23:30:00-04:00"),
  record("b", "2023-07-01T00:10:00-04:00", "informatics"),
  record("c", "2025-03-15T10:00:00-04:00"),
];

describe("filterHeatmapRecords", () => {
  it("filtra por carrera", () => {
    expect(filterHeatmapRecords(RECORDS, { career: "informatics" }).map(({ id }) => id)).toEqual(["b"]);
  });

  it("filtra por gestión y mes usando la hora de Bolivia", () => {
    expect(filterHeatmapRecords(RECORDS, { year: "2023", month: "6" }).map(({ id }) => id)).toEqual(["a"]);
  });

  it("aplica el rango de semestres respetando los límites UTC-4", () => {
    const filtered = filterHeatmapRecords(RECORDS, { semesterRange: { startYear: 2023, startSemester: 2, endYear: 2025, endSemester: 1 } });
    expect(filtered.map(({ id }) => id)).toEqual(["b", "c"]);
  });

  it("ignora la gestión local cuando el rango de semestres está activo", () => {
    const filtered = filterHeatmapRecords(RECORDS, { year: "2023", semesterRange: { startYear: 2025, startSemester: 1, endYear: 2025, endSemester: 2 } });
    expect(filtered.map(({ id }) => id)).toEqual(["c"]);
  });
});
