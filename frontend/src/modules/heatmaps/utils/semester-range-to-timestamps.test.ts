import { describe, expect, it } from "vitest";
import { formatSemesterRange, isValidSemesterRange, semesterRangeToTimestamps } from "./semester-range-to-timestamps";

describe("semesterRangeToTimestamps", () => {
  it("convierte el 1er semestre al rango enero-junio en hora de Bolivia", () => {
    expect(semesterRangeToTimestamps({ startYear: 2023, startSemester: 1, endYear: 2023, endSemester: 1 })).toEqual({
      startTimestamp: "2023-01-01T00:00:00-04:00",
      endTimestamp: "2023-06-30T23:59:59-04:00",
    });
  });

  it("convierte el 2do semestre al rango julio-diciembre en hora de Bolivia", () => {
    expect(semesterRangeToTimestamps({ startYear: 2024, startSemester: 2, endYear: 2025, endSemester: 2 })).toEqual({
      startTimestamp: "2024-07-01T00:00:00-04:00",
      endTimestamp: "2025-12-31T23:59:59-04:00",
    });
  });
});

describe("isValidSemesterRange", () => {
  it("acepta rangos crecientes o del mismo semestre", () => {
    expect(isValidSemesterRange({ startYear: 2024, startSemester: 2, endYear: 2024, endSemester: 2 })).toBe(true);
    expect(isValidSemesterRange({ startYear: 2023, startSemester: 2, endYear: 2024, endSemester: 1 })).toBe(true);
  });

  it("rechaza rangos invertidos", () => {
    expect(isValidSemesterRange({ startYear: 2024, startSemester: 2, endYear: 2024, endSemester: 1 })).toBe(false);
  });
});

describe("formatSemesterRange", () => {
  it("formatea el rango para el botón activo", () => {
    expect(formatSemesterRange({ startYear: 2023, startSemester: 1, endYear: 2025, endSemester: 2 })).toBe("2023-1 a 2025-2");
  });
});
