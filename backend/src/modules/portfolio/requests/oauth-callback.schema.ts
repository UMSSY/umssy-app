import { z } from 'zod';

export const oauthCallbackSchema = z.object({
  code: z.string().trim().min(1),
  state: z.string().optional(),
  verifier: z
    .string()
    .regex(/^[A-Za-z0-9_-]{43,128}$/)
    .optional(),
});

export type OAuthCallbackRequest = z.infer<typeof oauthCallbackSchema>;
