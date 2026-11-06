interface VacancyRank {
  id: string;
  compatibility: number;
  publishedAt: Date;
}

export function compareVacancyRank(
  left: VacancyRank,
  right: VacancyRank,
): number {
  return (
    right.compatibility - left.compatibility ||
    right.publishedAt.getTime() - left.publishedAt.getTime() ||
    left.id.localeCompare(right.id)
  );
}
