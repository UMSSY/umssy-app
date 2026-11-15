export const MENTORSHIP_QUERY_KEYS = {
  similar: (mentorId: string) => ['mentorship', 'similar', mentorId] as const,
  profile: (mentorId: string) => ['mentorship', 'profile', mentorId] as const,
};
