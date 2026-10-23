export const SURVEYS_QUERY_KEYS = {
  all: ["surveys"] as const,
  list: ["surveys", "list"] as const,
  careers: ["surveys", "careers"] as const,
};

export const SURVEY_TOAST_DURATION_MS = 7_000;
export const CAREERS_STALE_TIME_MS = 5 * 60_000;
