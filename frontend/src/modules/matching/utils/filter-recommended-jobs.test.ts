import { describe, expect, it } from "vitest";
import { buildJob } from "../testing/job-fixtures";
import {
  ALL_MODALITIES,
  DEFAULT_FILTERS,
  filterRecommendedJobs,
  getModalityOptions,
  hasActiveFilters,
  normalizeSearchText,
} from "./filter-recommended-jobs";

const JOBS = [
  buildJob({ jobOfferId: "a", title: "Desarrollador Backend", score: 90, modality: "Remoto", skills: ["Python", "Docker"] }),
  buildJob({ jobOfferId: "b", title: "Analista de Datos", companyName: "Andes Data Labs", score: 70, modality: "Presencial", skills: ["SQL"] }),
  buildJob({ jobOfferId: "c", title: "Diseñador Web", score: 69, modality: "Híbrido", skills: ["React"] }),
  buildJob({ jobOfferId: "d", title: "Soporte", score: 30, modality: "Remoto", skills: ["Linux"] }),
];

const ids = (jobs: typeof JOBS) => jobs.map((job) => job.jobOfferId);

describe("normalizeSearchText", () => {
  it.each([
    ["  Diseñador   WEB ", "disenador web"],
    ["Análisis", "analisis"],
    ["", ""],
  ])("normaliza %o como %o", (value, expected) => {
    expect(normalizeSearchText(value)).toBe(expected);
  });
});

describe("hasActiveFilters", () => {
  it("es falso con los filtros por defecto y con una búsqueda de solo espacios", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: "   " })).toBe(false);
  });

  it.each([
    [{ ...DEFAULT_FILTERS, search: "python" }],
    [{ ...DEFAULT_FILTERS, modality: "Remoto" }],
    [{ ...DEFAULT_FILTERS, highAffinityOnly: true }],
  ])("es verdadero con %o", (filters) => {
    expect(hasActiveFilters(filters)).toBe(true);
  });
});

describe("getModalityOptions", () => {
  it("devuelve las modalidades sin repetir y ordenadas", () => {
    expect(getModalityOptions(JOBS)).toEqual(["Híbrido", "Presencial", "Remoto"]);
  });

  it("devuelve una lista vacía sin vacantes", () => {
    expect(getModalityOptions([])).toEqual([]);
  });
});

describe("filterRecommendedJobs", () => {
  it("devuelve todas las vacantes con los filtros por defecto", () => {
    expect(ids(filterRecommendedJobs(JOBS, DEFAULT_FILTERS))).toEqual(["a", "b", "c", "d"]);
  });

  it.each([
    ["backend", ["a"]],
    ["ANDES", ["b"]],
    ["sql", ["b"]],
    ["disenador", ["c"]],
    ["remoto", ["a", "d"]],
    ["inexistente", []],
  ])("busca %o en título, empresa, modalidad y habilidades", (search, expected) => {
    expect(ids(filterRecommendedJobs(JOBS, { ...DEFAULT_FILTERS, search }))).toEqual(expected);
  });

  it("filtra por modalidad", () => {
    expect(ids(filterRecommendedJobs(JOBS, { ...DEFAULT_FILTERS, modality: "Remoto" }))).toEqual(["a", "d"]);
    expect(ids(filterRecommendedJobs(JOBS, { ...DEFAULT_FILTERS, modality: ALL_MODALITIES }))).toHaveLength(4);
  });

  it("con solo alta afinidad incluye 70 % y excluye 69 %", () => {
    expect(ids(filterRecommendedJobs(JOBS, { ...DEFAULT_FILTERS, highAffinityOnly: true }))).toEqual(["a", "b"]);
  });

  it("combina búsqueda, modalidad y alta afinidad", () => {
    const filters = { search: "backend", modality: "Remoto", highAffinityOnly: true };

    expect(ids(filterRecommendedJobs(JOBS, filters))).toEqual(["a"]);
    expect(ids(filterRecommendedJobs(JOBS, { ...filters, modality: "Presencial" }))).toEqual([]);
  });
});
