import type { MentorCapacityCounts } from '../types/mentor-capacity.types.js';

export function mentorCapacity(counts: MentorCapacityCounts) {
  const capacity = Math.floor(counts.approvedGraduates * 0.4);
  const occupied = counts.activeMentors + counts.reservedOffers;
  return { ...counts, percentage: 40, capacity, occupied, available: Math.max(0, capacity - occupied) };
}
