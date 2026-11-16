import { describe, expect, it } from 'vitest';
import { getEducationDegrees, resolveEducationDegree } from './resolve-education-degree';

describe("education catalog resolution", () => {
  const catalog = [
    {
      institution: "Universidad de ejemplo",
      sources: [],
      degrees: [{ name: "Carrera de ejemplo", aliases: ["Alias de carrera"] }],
    },
  ];
  it("uses the supplied API catalog", () => {
    const degrees = getEducationDegrees(" UNIVERSIDAD DE EJEMPLO ", catalog);
    expect(resolveEducationDegree("alias de carrera", degrees)).toBe(
      "Carrera de ejemplo",
    );
  });
  it("does not invent degrees without a catalog or for unknown institutions", () => {
    expect(getEducationDegrees("Universidad de ejemplo")).toEqual([]);
    expect(getEducationDegrees("Desconocida", catalog)).toEqual([]);
  });
});
