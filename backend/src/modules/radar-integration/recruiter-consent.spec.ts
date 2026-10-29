import { describe, expect, it } from 'vitest';
import { recruiterContactProjection } from './recruiter-consent.js';

describe('HU4: confidencialidad de datos de contacto', () => {
  it('no expone correo ni teléfono sin consentimiento', () => {
    expect(recruiterContactProjection(false, 'prueba@example.com', '555-0100')).toEqual({ email: null, phone: null });
  });
  it('permite los datos expresamente autorizados', () => {
    expect(recruiterContactProjection(true, 'prueba@example.com', '555-0100')).toEqual({ email: 'prueba@example.com', phone: '555-0100' });
  });
  it('respeta campos opcionales nulos', () => {
    expect(recruiterContactProjection(true, 'prueba@example.com', null)).toEqual({ email: 'prueba@example.com', phone: null });
  });
});
