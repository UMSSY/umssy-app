import type { MentorAdmissionFacts } from '../types/mentor-admission-facts.types.js';

export function isEligibleMentor(facts: MentorAdmissionFacts): boolean {
  return facts.isActive && facts.hasGraduateRole && facts.hasApprovedAccount;
}
