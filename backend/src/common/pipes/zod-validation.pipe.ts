import { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ValidationException } from '../exceptions/validation.exception.js';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.map(String),
        message: i.message,
      }));
      throw new ValidationException(issues);
    }
    return result.data;
  }
}