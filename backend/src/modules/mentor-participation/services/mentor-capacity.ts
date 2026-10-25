export function mentorCapacity(approvedGraduates: number, percentage: number,
  activeMentors: number, reservedOffers: number) {
  const capacity = Math.floor(approvedGraduates * percentage / 100);
  const occupied = activeMentors + reservedOffers;
  return { approvedGraduates, percentage, capacity, activeMentors, reservedOffers,
    occupied, available: Math.max(0, capacity - occupied) };
}
