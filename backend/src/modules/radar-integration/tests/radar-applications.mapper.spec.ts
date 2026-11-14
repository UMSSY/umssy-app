import { describe, expect, it } from 'vitest';
import {
  mapApplicationStatus,
  mapApplicationSummary,
  mapApplicationConsentsResponse,
} from '../mappers/radar-applications.mapper.js';

describe('radar-applications mapper', () => {
  it('revocar radar conserva los otros permisos explícitos en la respuesta', () => {
    expect(mapApplicationConsentsResponse('app', 'En revisión', false, true, true)).toMatchObject({
      consent: false, consentCv: true, consentContact: true,
    });
  });
  it('traduce los estados de postulación del Epic a estados del radar', () => {
    expect(mapApplicationStatus('En revisión')).toBe('applied');
    expect(mapApplicationStatus('Entrevista')).toBe('interview');
    expect(mapApplicationStatus('Aceptada')).toBe('hired');
    expect(mapApplicationStatus('No seleccionado')).toBe('rejected');
    expect(mapApplicationStatus('Retirada')).toBe('withdrawn');
    expect(mapApplicationStatus('Desconocido')).toBe('applied');
  });

  it('resume una postulación con sus consentimientos', () => {
    expect(
      mapApplicationSummary({
        id: 'app',
        job_offer_id: 'job',
        user_id: 'user',
        status_title: 'Entrevista',
        applied_at: new Date('2026-01-01T00:00:00.000Z'),
        consent_to_recruiter: true,
        consent_to_cv: false,
        consent_to_contact: true,
      }),
    ).toEqual({
      id: 'app',
      jobOfferId: 'job',
      state: 'interview',
      appliedAt: new Date('2026-01-01T00:00:00.000Z'),
      consent: true,
      consentCv: false,
      consentContact: true,
    });
  });
});
