import { z } from 'zod';

export const oauthCallbackSchema = z.object({
  code: z.string().trim().min(1),
  state: z.string().trim().min(1),
  verifier: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
});

export type OAuthCallbackRequest = z.infer<typeof oauthCallbackSchema>;
