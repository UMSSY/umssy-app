import { describe, expect, it } from "vitest";
import { HEATMAP_EXTRA_COLUMNS } from "../constants/heatmap-dimensions.constants";
import type { HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";
import { buildCareerHeatmap } from "./build-career-heatmap";
import { buildEmployabilityHeatmap } from "./build-employability-heatmap";
import { buildExperienceHeatmap, getExperienceLevel } from "./build-experience-heatmap";
import { buildSalaryHeatmap } from "./build-salary-heatmap";

function graduate(overrides: Partial<HeatmapGraduateRecord>): HeatmapGraduateRecord {
  return {
    id: Math.random().toString(36),
    career: "systems",
    answeredAt: "2025-03-01T10:00:00-04:00",
    skills: [],
    nlpSkills: [],
    monthlySalary: null,
    employmentStatus: null,
    experienceYears: null,
    ...overrides,
  };
}

const cellOf = (data: ReturnType<typeof buildCareerHeatmap>, skillId: string, columnId: string) =>
  data.rows.find((row) => row.skillId === skillId)?.cells.find((cell) => cell.columnId === columnId);

describe("buildCareerHeatmap (HU5)", () => {
  it("calcula conteo y porcentaje sobre el total evaluado de cada carrera", () => {
    const data = buildCareerHeatmap([
      graduate({ career: "systems", skills: ["sql"] }),
      graduate({ career: "systems", skills: ["sql", "python"] }),
      graduate({ career: "systems", skills: ["python"] }),
      graduate({ career: "systems", skills: ["git"] }),
      graduate({ career: "informatics", skills: ["sql"] }),
      graduate({ career: "informatics", skills: [] }),
    ]);

    expect(data.baseCount).toBe(5);
    expect(data.columns.map((column) => column.label)).toEqual(["Ing. de Sistemas (n=4)", "Ing. Informática (n=1)"]);
    expect(cellOf(data, "sql", "systems")).toMatchObject({ count: 2, total: 4, percentage: 50 });
    expect(cellOf(data, "sql", "informatics")).toMatchObject({ count: 1, total: 1, percentage: 100 });
  });

  it("marca las celdas como vacías cuando una carrera no tiene egresados", () => {
    const data = buildCareerHeatmap([graduate({ career: "systems", skills: ["sql"] })]);
    expect(cellOf(data, "sql", "informatics")).toMatchObject({ isEmpty: true });
  });
});

describe("buildSalaryHeatmap (HU6)", () => {
  it("excluye titulados sin salario o sin habilidades NLP y ordena los rangos de menor a mayor", () => {
    const data = buildSalaryHeatmap([
      graduate({ monthlySalary: 3000, nlpSkills: ["sql"] }),
      graduate({ monthlySalary: 3001, nlpSkills: ["sql"] }),
      graduate({ monthlySalary: 15000, nlpSkills: ["python"] }),
      graduate({ monthlySalary: null, nlpSkills: ["sql"] }),
      graduate({ monthlySalary: 6000, nlpSkills: [] }),
    ]);

    expect(data.baseCount).toBe(3);
    expect(data.columns.map((column) => column.id)).toEqual(["up-to-3000", "3000-5000", "5000-8000", "8000-12000", "over-12000"]);
    expect(cellOf(data, "sql", "up-to-3000")).toMatchObject({ count: 1, total: 1, percentage: 100 });
    expect(cellOf(data, "sql", "3000-5000")).toMatchObject({ count: 1, total: 1 });
    expect(cellOf(data, "python", "over-12000")).toMatchObject({ count: 1, percentage: 100 });
    expect(cellOf(data, "sql", "5000-8000")).toMatchObject({ isEmpty: true });
  });
});

describe("buildEmployabilityHeatmap (HU7)", () => {
  it("calcula la retención laboral y ordena las filas de mayor a menor retención", () => {
    const data = buildEmployabilityHeatmap([
      graduate({ skills: ["sql"], employmentStatus: "employed-in-field" }),
      graduate({ skills: ["sql"], employmentStatus: "self-employed" }),
      graduate({ skills: ["sql", "python"], employmentStatus: "job-seeking" }),
      graduate({ skills: ["python"], employmentStatus: "job-seeking" }),
      graduate({ skills: ["git"], employmentStatus: "employed-other-field" }),
      graduate({ skills: ["git"], employmentStatus: null }),
    ]);
    const retention = (skillId: string) => data.rows.find((row) => row.skillId === skillId)?.extraValues?.[HEATMAP_EXTRA_COLUMNS.jobRetention.id];

    expect(data.baseCount).toBe(5);
    expect(retention("git")).toMatchObject({ percentage: 100, count: 1 });
    expect(retention("sql")).toMatchObject({ percentage: 67, count: 2 });
    expect(retention("python")).toMatchObject({ percentage: 0 });
    expect(data.rows.slice(0, 3).map((row) => row.skillId)).toEqual(["git", "sql", "python"]);
    expect(data.rows[1].extraValues?.[HEATMAP_EXTRA_COLUMNS.totalGraduates.id]).toMatchObject({ count: 3 });
  });
});

describe("buildExperienceHeatmap (HU8)", () => {
  it("clasifica los niveles de experiencia según los límites definidos", () => {
    expect(getExperienceLevel(0).id).toBe("junior");
    expect(getExperienceLevel(2).id).toBe("junior");
    expect(getExperienceLevel(2.1).id).toBe("semi-senior");
    expect(getExperienceLevel(5).id).toBe("semi-senior");
    expect(getExperienceLevel(5.5).id).toBe("senior");
  });

  it("calcula el total que domina la habilidad y el nivel de mayor adopción", () => {
    const data = buildExperienceHeatmap([
      graduate({ experienceYears: 1, skills: ["sql"] }),
      graduate({ experienceYears: 1, skills: [] }),
      graduate({ experienceYears: 3, skills: ["sql"] }),
      graduate({ experienceYears: 8, skills: ["sql", "docker"] }),
      graduate({ experienceYears: null, skills: ["sql"] }),
    ]);
    const sql = data.rows.find((row) => row.skillId === "sql");

    expect(data.baseCount).toBe(4);
    expect(data.columns.map((column) => column.sublabel)).toEqual(["hasta 2 años · 2 titulados", "2 a 5 años · 1 titulados", "más de 5 años · 1 titulados"]);
    expect(sql?.cells.map((cell) => cell.percentage)).toEqual([50, 100, 100]);
    expect(sql?.extraValues?.[HEATMAP_EXTRA_COLUMNS.totalMastering.id]).toMatchObject({ count: 3, percentage: 75, subtext: "75 % del total" });
    expect(sql?.extraValues?.[HEATMAP_EXTRA_COLUMNS.highestAdoption.id]).toEqual({ badgeText: "Semi-Senior" });
    expect(data.rows[0].skillId).toBe("sql");
    expect(data.quickReadSummary).toContain("SQL y bases de datos");
  });
});
