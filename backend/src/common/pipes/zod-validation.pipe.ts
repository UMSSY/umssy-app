import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const detalles = result.error.issues.map((issue) => ({
        campo: issue.path.map((p) => String(p)).join('.') || 'body',
        codigo: String(issue.code),
        mensaje: issue.message,
      }));

      // Se lanza BadRequestException y el HttpExceptionFilter la mapea a 422
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        detalles,
      });
    }

    return result.data;
  }
}