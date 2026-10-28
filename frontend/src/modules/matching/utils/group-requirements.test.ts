import { describe, expect, it } from "vitest";
import type { CategorizedJobRequirement } from "../types/requirement-category.types";
import { groupRequirements } from "./group-requirements";

const skill = (name: string): CategorizedJobRequirement => ({
  name,
  status: "Cumple",
  category: "skill",
});
const academic = (name: string): CategorizedJobRequirement => ({
  name,
  status: "Pendiente",
  category: "academic",
});
const other = (name: string): CategorizedJobRequirement => ({
  name,
  status: "Pendiente",
  category: "other",
});

describe("groupRequirements", () => {
  it("returns no groups for an empty list", () => {
    expect(groupRequirements([])).toEqual([]);
  });

  it("groups by category in the fixed order skills, academic, other", () => {
    const groups = groupRequirements([
      other("Carta de motivación"),
      academic("Ingeniería de Sistemas"),
      skill("Docker"),
      skill("Kubernetes"),
    ]);

    expect(groups.map(({ category }) => category)).toEqual(["skill", "academic", "other"]);
    expect(groups[0].requirements.map(({ name }) => name)).toEqual(["Docker", "Kubernetes"]);
  });

  it("omits the categories that have no requirements", () => {
    const groups = groupRequirements([skill("Docker"), other("Carta de motivación")]);

    expect(groups.map(({ category }) => category)).toEqual(["skill", "other"]);
  });

  it("returns a single ungrouped list when no requirement has a category", () => {
    const requirements: CategorizedJobRequirement[] = [
      { name: "Docker", status: "Cumple" },
      { name: "Kubernetes", status: "Pendiente" },
    ];

    expect(groupRequirements(requirements)).toEqual([{ category: null, requirements }]);
  });

  it("returns a single ungrouped list when only some requirements have a category", () => {
    const requirements: CategorizedJobRequirement[] = [
      skill("Docker"),
      { name: "Kubernetes", status: "Pendiente" },
    ];

    expect(groupRequirements(requirements)).toEqual([{ category: null, requirements }]);
  });

  it("does not lose requirements when the API sends an unknown category", () => {
    const requirements = [
      skill("Docker"),
      { name: "Algo nuevo", status: "Pendiente", category: "future" },
    ] as unknown as CategorizedJobRequirement[];

    const groups = groupRequirements(requirements);

    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBeNull();
    expect(groups[0].requirements).toHaveLength(2);
  });
});
