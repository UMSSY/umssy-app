import { z } from 'zod';

export const oauthCallbackSchema = z.object({
  code: z.string().trim().min(1),
});

export type OAuthCallbackRequest = z.infer<typeof oauthCallbackSchema>;

