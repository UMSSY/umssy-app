import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const MAX_REQUIREMENT_TEXT_LENGTH = 5000;

export const requirementTermsBodySchema = z.object({
  text: z.string({ error: 'El texto de los requisitos es obligatorio' }).max(MAX_REQUIREMENT_TEXT_LENGTH, {
    error: `El texto no puede superar los ${MAX_REQUIREMENT_TEXT_LENGTH} caracteres`,
  }),
});

export class RequirementTermsBodyDto extends createZodDto(requirementTermsBodySchema) {}
