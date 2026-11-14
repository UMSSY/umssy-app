import { describe, expect, it } from 'vitest';
import { jobOfferParamsSchema } from '../requests/job-offer-id.schema.js';

describe('jobOfferParamsSchema', () => {
  it('acepta un uuid', () => {
    expect(jobOfferParamsSchema.safeParse({ id: '5b1f0c3e-8a4d-4f0b-9a52-1d6c7e2a9b10' }).success).toBe(true);
  });

  it.each([[''], ['abc'], ['5b1f0c3e-8a4d-4f0b-9a52'], [42], [null], [undefined]])(
    'rechaza el id %o',
    (id) => {
      const result = jobOfferParamsSchema.safeParse({ id });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(['id']);
    },
  );

  it('usa el mensaje de identificador de vacante inválido', () => {
    const result = jobOfferParamsSchema.safeParse({ id: 'abc' });

    expect(result.error?.issues[0]?.message).toBe('El identificador de la vacante no es valido');
  });
});
