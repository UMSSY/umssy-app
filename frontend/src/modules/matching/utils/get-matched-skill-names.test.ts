import { describe, expect, it } from "vitest";
import type { CategorizedJobRequirement } from "../types/requirement-category.types";
import { getMatchedSkillNames } from "./get-matched-skill-names";

describe("getMatchedSkillNames", () => {
  it("returns only the skills that match", () => {
    const requirements: CategorizedJobRequirement[] = [
      { name: "Docker", status: "Cumple", category: "skill" },
      { name: "Kubernetes", status: "Pendiente", category: "skill" },
      { name: "Ingeniería de Sistemas", status: "Cumple", category: "academic" },
      { name: "Experiencia mínima: 2 años", status: "Cumple", category: "academic" },
      { name: "Carta de motivación", status: "Cumple", category: "other" },
    ];

    expect(getMatchedSkillNames(requirements)).toEqual(["Docker"]);
  });

  it("treats requirements without category as skills", () => {
    const requirements: CategorizedJobRequirement[] = [
      { name: "Docker", status: "Cumple" },
      { name: "Kubernetes", status: "Pendiente" },
    ];

    expect(getMatchedSkillNames(requirements)).toEqual(["Docker"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(getMatchedSkillNames([])).toEqual([]);
    expect(getMatchedSkillNames([{ name: "Docker", status: "Pendiente", category: "skill" }])).toEqual([]);
  });
});
