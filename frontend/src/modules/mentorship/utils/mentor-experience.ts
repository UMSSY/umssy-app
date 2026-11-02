import type { MentorProfile } from "../types/mentor-profile.types";

export function calculateExperienceYears(
  experiences: MentorProfile["workExperiences"],
  now = new Date(),
): number | null {
  const months = new Set<number>();
  for (const experience of experiences) {
    const start = new Date(experience.startDate);
    const end = experience.endDate ? new Date(experience.endDate) : experience.isCurrent ? now : null;
    if (!end || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) continue;
    const firstMonth = start.getUTCFullYear() * 12 + start.getUTCMonth();
    const lastMonth = end.getUTCFullYear() * 12 + end.getUTCMonth();
    for (let month = firstMonth; month <= lastMonth; month += 1) months.add(month);
  }
  return months.size ? Math.floor(months.size / 12) : null;
}
