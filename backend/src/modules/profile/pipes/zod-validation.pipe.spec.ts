import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    z.object({ name: z.string().min(1, 'El nombre es obligatorio.') }),
  );

  it('returns the parsed value when it is valid', () => {
    expect(pipe.transform({ name: 'Valeria' })).toEqual({ name: 'Valeria' });
  });

  it('throws BadRequest with the field errors when it is invalid', () => {
    try {
      pipe.transform({ name: '' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'Revisa los datos ingresados.',
        errors: [{ field: 'name', message: 'El nombre es obligatorio.' }],
      });
    }
  });
});
