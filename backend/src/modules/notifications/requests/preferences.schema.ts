import { z } from 'zod';

export const UpdatePreferencesSchema = z.object({
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});