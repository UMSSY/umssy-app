import { describe, expect, it } from "vitest";
import { buildMatch } from "../testing/job-fixtures";
import { buildRequirements } from "./build-requirements";

describe("buildRequirements", () => {
  it("lista primero las habilidades que coinciden y después las que faltan", () => {
    const matchMock = {
      ...buildMatch(),
      matchedSkills: ["Python", "Docker"],
      missingSkills: ["React"],
    } as unknown as Record<string, unknown>;

    expect(buildRequirements(matchMock)).toEqual([
      { name: "Python", status: "matched" },
      { name: "Docker", status: "matched" },
      { name: "React", status: "missing" },
    ]);
  });

  it("devuelve una lista vacía cuando la vacante no pide habilidades", () => {
    const matchMock = {
      ...buildMatch(),
      matchedSkills: [],
      skills: [],
    } as unknown as Record<string, unknown>;

    expect(buildRequirements(matchMock)).toEqual([]);
  });
});