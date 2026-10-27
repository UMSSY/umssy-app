interface VacancyRank {
  compatibility: number;
  careerMatch: boolean;
  experienceMatch: boolean;
  matchingSkills: number;
}

export function compareVacancyRank(
  left: VacancyRank,
  right: VacancyRank,
): number {
  return (
    right.compatibility - left.compatibility ||
    Number(right.careerMatch) - Number(left.careerMatch) ||
    Number(right.experienceMatch) - Number(left.experienceMatch) ||
    right.matchingSkills - left.matchingSkills
  );
}
