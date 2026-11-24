import { describe, expect, it } from "vitest";
import { buildVacancy } from "../testing/vacancy-fixtures";
import { filterVacancies } from "./filter-vacancies";

const SCIENTIST = buildVacancy({ id: "scientist", title: "Científico de Datos" });
const DEVELOPER = buildVacancy({ id: "developer", title: "Desarrollador Backend" });
const VACANCIES = [SCIENTIST, DEVELOPER];

describe("filterVacancies", () => {
  it.each(["cientifico", "científico", "CIENTÍFICO"])("encuentra la vacante al buscar %s", (search) => {
    expect(filterVacancies(VACANCIES, search)).toEqual([SCIENTIST]);
  });

  it("ignora las tildes escritas en la búsqueda aunque el dato no las tenga", () => {
    const vacancy = buildVacancy({ id: "hybrid", modality: "Hibrido" });
    expect(filterVacancies([vacancy], "híbrido")).toEqual([vacancy]);
  });

  it("busca también en empresa y requisitos", () => {
    expect(filterVacancies(VACANCIES, "techbolivia")).toHaveLength(2);
    expect(filterVacancies(VACANCIES, "react")).toHaveLength(2);
  });

  it("devuelve todas las vacantes cuando la búsqueda está vacía", () => {
    expect(filterVacancies(VACANCIES, "   ")).toEqual(VACANCIES);
  });

  it("devuelve una lista vacía cuando nada coincide", () => {
    expect(filterVacancies(VACANCIES, "enfermería")).toEqual([]);
  });
});
