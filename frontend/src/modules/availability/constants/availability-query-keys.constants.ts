export const AVAILABILITY_QUERY_KEYS = {
  all: ["availability"] as const,
  futureBlockedDates: (today: string) => ["availability", "blocked-dates", "future", today] as const,
  blockedDates: (weekStart: string) => ["availability", "blocked-dates", weekStart] as const,
  myBlocks: (weekStart: string) => ["availability", "my-blocks", weekStart] as const,
  freeBlocks: (mentorId: string, weekStart: string) =>
    ["availability", "free-blocks", mentorId, weekStart] as const,
  status: ["availability", "status"] as const,
};
