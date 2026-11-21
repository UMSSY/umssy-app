import type { MentorCapacityCounts } from '../types/mentor-capacity.types.js';

export const DEFAULT_MENTOR_CAPACITY_PERCENTAGE = 40;

export function mentorCapacity(counts: MentorCapacityCounts) {
  const percentage = counts.percentage ?? DEFAULT_MENTOR_CAPACITY_PERCENTAGE;
  const capacity = Math.ceil((counts.approvedGraduates * percentage) / 100);
  const occupied = counts.activeMentors + counts.reservedOffers;
  return {
    ...counts,
    percentage,
    capacity,
    occupied,
    available: Math.max(0, capacity - occupied),
  };
}
