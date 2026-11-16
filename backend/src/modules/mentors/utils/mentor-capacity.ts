import type { MentorCapacityCounts } from '../types/mentor-capacity.types.js';

export function mentorCapacity(counts: MentorCapacityCounts) {
  const percentage = counts.percentage ?? 40;
  const capacity = Math.floor(
    (counts.approvedGraduates * percentage) / 100,
  );
  const occupied = counts.activeMentors + counts.reservedOffers;
  return {
    ...counts,
    percentage,
    capacity,
    occupied,
    available: Math.max(0, capacity - occupied),
  };
}
