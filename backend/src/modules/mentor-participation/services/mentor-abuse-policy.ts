import { z } from 'zod';

const positiveInteger = z.coerce.number().int().positive();
const schema = z.object({
  threshold: positiveInteger,
  windowHours: positiveInteger,
  sanctionHours: positiveInteger,
});

export function mentorAbusePolicy(environment: NodeJS.ProcessEnv = process.env) {
  return schema.parse({
    threshold: environment.MENTOR_ABUSE_THRESHOLD ?? 5,
    windowHours: environment.MENTOR_ABUSE_WINDOW_HOURS ?? 24,
    sanctionHours: environment.MENTOR_SANCTION_HOURS ?? 72,
  });
}

export function sanctionRetryAfter(expiresAt: Date, now: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
}
