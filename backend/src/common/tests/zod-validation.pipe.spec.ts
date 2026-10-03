import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ValidationException } from '../exceptions/validation.exception.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const schema = z.object({ name: z.string().min(1) });

  it('devuelve el valor parseado cuando es valido', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ name: 'Derek' })).toEqual({ name: 'Derek' });
  });

  it('lanza ValidationException cuando el valor no es valido', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() => pipe.transform({ name: '' })).toThrow(ValidationException);
  });

  it('lanza ValidationException con issues estructurados', () => {
    const pipe = new ZodValidationPipe(schema);
    try {
      pipe.transform({ name: '' });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['name'], message: expect.any(String) }),
        ]),
      );
    }
  });
});