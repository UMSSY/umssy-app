import { z } from 'zod';

export const oauthUrlQuerySchema = z.object({
  state: z.string().trim().optional(),
  challenge: z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/)
    .optional(),
});

export type OAuthUrlQueryRequest = z.infer<typeof oauthUrlQuerySchema>;
