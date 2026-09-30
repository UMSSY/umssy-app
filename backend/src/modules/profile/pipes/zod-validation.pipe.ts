import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors: ValidationErrorDetail[] = result.error.issues.map(
        (issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }),
      );

      throw new BadRequestException({
        statusCode: 400,
        message: 'Revisa los datos ingresados.',
        errors,
      });
    }

    return result.data;
  }
}
