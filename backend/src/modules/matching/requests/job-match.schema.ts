import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const jobMatchParamsSchema = z.object({
  id: z.uuid({ error: 'El identificador de la vacante no es valido' }),
});

export class JobMatchParamsDto extends createZodDto(jobMatchParamsSchema) {}
