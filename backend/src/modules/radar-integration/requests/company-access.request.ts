import { z } from 'zod';

export const companyAccessSchema = z
  .object({
    userId: z.uuid(),
    companyId: z.uuid(),
  })
  .strict()
  .meta({
    example: {
      userId: 'a0000000-0000-4000-8000-000000000001',
      companyId: 'a0000000-0000-4000-8000-000000000002',
    },
  });
