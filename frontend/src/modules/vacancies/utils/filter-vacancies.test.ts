import { describe, expect, it } from "vitest";
import { buildVacancy } from "../testing/vacancy-fixtures";
import { filterVacancies } from "./filter-vacancies";

const SCIENTIST = buildVacancy({ id: "scientist", title: "Científico de Datos" });
const DEVELOPER = buildVacancy({ id: "developer", title: "Desarrollador Backend" });
const VACANCIES = [SCIENTIST, DEVELOPER];

describe("filterVacancies", () => {
  it.each(["cientifico", "científico", "CIENTÍFICO"])("finds the vacancy when searching for %s", (search) => {
    expect(filterVacancies(VACANCIES, search)).toEqual([SCIENTIST]);
  });

  it("ignores query accents when the stored value has none", () => {
    const vacancy = buildVacancy({ id: "hybrid", modality: "Hibrido" });
    expect(filterVacancies([vacancy], "híbrido")).toEqual([vacancy]);
  });

  it("also searches company names and requirements", () => {
    expect(filterVacancies(VACANCIES, "techbolivia")).toHaveLength(2);
    expect(filterVacancies(VACANCIES, "react")).toHaveLength(2);
  });

  it("returns every vacancy when the query is blank", () => {
    expect(filterVacancies(VACANCIES, "   ")).toEqual(VACANCIES);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterVacancies(VACANCIES, "enfermería")).toEqual([]);
  });
});
