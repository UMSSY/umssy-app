import { z } from 'zod';

export const MAX_PAGE_SIZE = 50;
export const MAX_SEARCH_LENGTH = 150;

export const GetEventsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(10),
  categoryId: z.string().uuid({ message: 'categoryId debe ser un UUID válido' }).optional(),
  statusId: z.string().uuid({ message: 'statusId debe ser un UUID válido' }).optional(),
  search: z
    .string()
    .trim()
    .max(MAX_SEARCH_LENGTH, {
      message: `search no puede tener más de ${MAX_SEARCH_LENGTH} caracteres`,
    })
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
});

export type GetEventsPayload = z.infer<typeof GetEventsSchema>;
