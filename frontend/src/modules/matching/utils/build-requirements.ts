export interface RequirementItem {
  name: string;
  status: string;
}

export function buildRequirements(
  match: Record<string, unknown> | null | undefined
): RequirementItem[] {
  if (!match) return [];

  if (Array.isArray(match.requirements) && match.requirements.length > 0) {
    return match.requirements as RequirementItem[];
  }

  const matchedSkills = Array.isArray(match.matchedSkills)
    ? (match.matchedSkills as string[])
    : [];
  const missingSkills = Array.isArray(match.missingSkills)
    ? (match.missingSkills as string[])
    : [];

  const matched = matchedSkills.map((skill) => ({
    name: skill,
    status: "matched",
  }));

  const missing = missingSkills.map((skill) => ({
    name: skill,
    status: "missing",
  }));

  return [...matched, ...missing];
}