import { REQUIREMENT_GROUP_ORDER } from "../constants/requirement-display.constants";
import type { CategorizedJobRequirement } from "../types/categorized-job-requirement.types";
import type { RequirementGroup } from "../types/requirement-group.types";

function hasKnownCategory({ category }: CategorizedJobRequirement): boolean {
  return category !== undefined && REQUIREMENT_GROUP_ORDER.includes(category);
}

export function groupRequirements(requirements: CategorizedJobRequirement[]): RequirementGroup[] {
  if (requirements.length === 0) return [];

  
  if (!requirements.every(hasKnownCategory)) {
    return [{ category: null, requirements }];
  }

  return REQUIREMENT_GROUP_ORDER.flatMap((category) => {
    const items = requirements.filter((requirement) => requirement.category === category);
    return items.length > 0 ? [{ category, requirements: items }] : [];
  });
}
