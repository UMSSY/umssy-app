export type MentorIntakeOutcome = {
  status: number;
  code?: string;
  data: unknown;
  detail?: string;
  retryAfterSeconds?: number;
};
