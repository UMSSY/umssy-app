import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Limite de caracteres del texto de experiencia (pendiente de confirmar con el equipo)
export const MAX_EXPERIENCE_TEXT_LENGTH = 5000;

// Parametro de ruta: la experiencia laboral se identifica con UUID (work_experiences.id)
export const analyzeExperienceParamsSchema = z.object({
  id: z.uuid({ error: 'El identificador de la experiencia no es valido' }),
});

// Body: el texto puede venir vacio, nulo o ausente (AC-01.9); el servicio lo trata como ''
export const analyzeExperienceBodySchema = z.object({
  text: z
    .string()
    .max(MAX_EXPERIENCE_TEXT_LENGTH, {
      error: `El texto no puede superar los ${MAX_EXPERIENCE_TEXT_LENGTH} caracteres`,
    })
    .nullish(),
});

// El pipe global de nestjs-zod (APP_PIPE) valida estos DTO en @Param() y @Body()
export class AnalyzeExperienceParamsDto extends createZodDto(analyzeExperienceParamsSchema) {}
export class AnalyzeExperienceBodyDto extends createZodDto(analyzeExperienceBodySchema) {}
