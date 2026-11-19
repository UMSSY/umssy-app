import { describe, expect, it } from "vitest";
import { getAppointmentsPageRange, getAppointmentsTotalPages } from "./appointments-pagination.utils";

describe("getAppointmentsPageRange", () => {
  it("calcula el rango de la primera página", () => {
    expect(getAppointmentsPageRange(1, 10, 48)).toEqual({ from: 1, to: 10 });
  });

  it("calcula el rango de una página incompleta", () => {
    expect(getAppointmentsPageRange(5, 10, 48)).toEqual({ from: 41, to: 48 });
  });

  it("devuelve cero sin resultados", () => {
    expect(getAppointmentsPageRange(1, 10, 0)).toEqual({ from: 0, to: 0 });
  });
});

describe("getAppointmentsTotalPages", () => {
  it("redondea hacia arriba la cantidad de páginas", () => {
    expect(getAppointmentsTotalPages(10, 48)).toBe(5);
  });

  it("devuelve cero sin tamaño de página", () => {
    expect(getAppointmentsTotalPages(0, 48)).toBe(0);
  });
});
