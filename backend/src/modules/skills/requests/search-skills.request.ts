import { z } from 'zod';

export const SKILL_SEARCH_MAX_LENGTH = 100;

export const searchSkillsRequestSchema = z.object({
  search: z
    .string()
    .trim()
    .max(
      SKILL_SEARCH_MAX_LENGTH,
      `El texto de búsqueda no puede superar ${SKILL_SEARCH_MAX_LENGTH} caracteres`,
    )
    .optional(),
});

export type SearchSkillsRequest = z.infer<typeof searchSkillsRequestSchema>;
export const searchSkillsSchema = z.object({
  search: z.string().trim().max(100).optional(),
});


