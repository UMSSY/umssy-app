import { describe, expect, it } from "vitest";
import { buildVacancyTarget } from "./vacancy-target";

describe("Vacantes de Épica 4 a seis ejes", () => {
  it("solo mapea habilidades que el catálogo identifica con un área", () => {
    const result = buildVacancyTarget({
      id: "1", title: "Backend", description: "Descripción", status: "published",
      skills: [{ id: "python", name: "Python" }, { id: "unknown", name: "Otra" }],
    }, new Map([["python", "desarrollo"]]));
    expect(result.target.desarrollo).toBe(2);
    expect(result.target.qa).toBe(0);
    expect(result.unmappedSkills).toEqual(["Otra"]);
  });
  it("rechaza vacantes no publicadas", () => {
    expect(() => buildVacancyTarget({ id: "2", title: "Borrador", description: "", status: "draft", skills: [] }, new Map())).toThrow("no está publicada");
  });
});
