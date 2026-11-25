import { z } from 'zod';

export const mentorDirectoryQuerySchema = z
  .object({
    page: z
      .string()
      .regex(/^[1-9]\d*$/, 'La página debe ser un entero positivo')
      .transform(Number)
      .pipe(z.number().safe().int())
      .default(1),
    search: z.string().trim().max(100).default(''),
    area: z.string().trim().min(1).max(80).optional(),
    areaIds: z
      .string()
      .max(739)
      .transform((value) => value.split(','))
      .pipe(z.array(z.uuid()).min(1).max(20))
      .optional(),
    orientation: z.string().trim().min(1).max(80).optional(),
    available: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    sort: z
      .enum(['default', 'name_asc', 'name_desc', 'affinity'])
      .default('default'),
  })
  .strict()
  .refine(({ area, areaIds }) => !(area && areaIds), {
    path: ['areaIds'],
    message: 'Usa solo area o areaIds',
  });

export type MentorDirectoryQuery = z.infer<typeof mentorDirectoryQuerySchema>;
