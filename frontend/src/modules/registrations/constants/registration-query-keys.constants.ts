export const REGISTRATION_QUERY_KEYS = {
  own: (eventId: string | null, accessToken: string | null) => ["events", "registration", accessToken, eventId] as const,
  passes: ["events", "my-passes"] as const,
  list: ["events", "list"] as const,
  detail: (eventId: string) => ["events", "detail", eventId] as const,
};
