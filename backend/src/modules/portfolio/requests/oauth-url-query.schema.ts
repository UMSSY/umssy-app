import { z } from 'zod';

export const oauthUrlQuerySchema = z.object({
  state: z.string().trim().optional(),
});

export type OAuthUrlQueryRequest = z.infer<typeof oauthUrlQuerySchema>;

