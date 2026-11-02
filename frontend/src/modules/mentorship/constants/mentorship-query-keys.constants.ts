export const MENTORSHIP_QUERY_KEYS = {
  profile: (mentorId: string) => ["mentorship", "profile", mentorId] as const,
};
