import { describe, expect, it } from 'vitest';
import { recruiterContactProjection } from '../recruiter-consent.js';

describe('recruiterContactProjection', () => {
  it('oculta correo y teléfono cuando no hay autorización', () => {
    expect(recruiterContactProjection(false, 'a@b.test', '70000000')).toEqual({
      email: null,
      phone: null,
    });
  });

  it('expone los datos de contacto autorizados', () => {
    expect(recruiterContactProjection(true, 'a@b.test', '70000000')).toEqual({
      email: 'a@b.test',
      phone: '70000000',
    });
  });
});
