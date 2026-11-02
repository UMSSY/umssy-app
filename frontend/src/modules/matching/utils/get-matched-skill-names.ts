import type { CategorizedJobRequirement } from "../types/requirement-category.types";

export function getMatchedSkillNames(requirements: CategorizedJobRequirement[]): string[] {
  return requirements
    .filter(
      ({ status, category }) =>
        status === "Cumple" && (category === undefined || category === "skill"),
    )
    .map(({ name }) => name);
}
