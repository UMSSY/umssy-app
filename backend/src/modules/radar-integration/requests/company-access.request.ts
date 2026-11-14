import { z } from 'zod';

export const companyAccessSchema = z
  .object({
    userId: z.uuid(),
    companyId: z.uuid(),
  })
  .strict();
