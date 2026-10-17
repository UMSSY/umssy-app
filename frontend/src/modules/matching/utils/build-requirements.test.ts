import { describe, expect, it } from "vitest";
import { buildMatch } from "../testing/job-fixtures";
import { buildRequirements } from "./build-requirements";

describe("buildRequirements", () => {
  it("lista primero las habilidades que coinciden y después las que faltan", () => {
    expect(buildRequirements(buildMatch())).toEqual([
      { name: "Python", status: "matched" },
      { name: "Docker", status: "matched" },
      { name: "React", status: "missing" },
    ]);
  });

  it("devuelve una lista vacía cuando la vacante no pide habilidades", () => {
    expect(buildRequirements(buildMatch({ matchedSkills: [], missingSkills: [], skills: [] }))).toEqual([]);
  });
});
