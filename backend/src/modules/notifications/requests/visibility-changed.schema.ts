import { z } from 'zod';

export const VisibilityChangedSchema = z.object({
  visible: z.boolean(),
});
