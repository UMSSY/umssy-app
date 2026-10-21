export const APPOINTMENTS_QUERY_KEYS = {
  all: ["appointments"] as const,
  mine: () => ["appointments", "mine"] as const,
};
