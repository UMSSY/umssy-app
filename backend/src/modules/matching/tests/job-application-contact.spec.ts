import { describe, expect, it } from 'vitest';
import { JobApplicationMapper } from '../mappers/job-application.mapper.js';
import type { JobApplicantRecord } from '../types/company-job-applicants.types.js';

const record: JobApplicantRecord = {
  id: 'application',
  appliedAt: new Date(),
  status: { title: 'En revisión' },
  user: {
    id: 'user',
    firstName: 'Ana',
    lastName: 'Pérez',
    email: 'ana@test',
    phone: '70000000',
    headline: null,
  },
};

describe('Contacto autorizado en Postulaciones', () => {
  const mapper = new JobApplicationMapper();
  it.each([undefined, null, { consentToContact: false }])(
    'oculta contacto sin autorización vigente: %s',
    (radarConsent) => {
      expect(
        mapper.toApplicantResponse({ ...record, radarConsent }),
      ).toMatchObject({ email: null, phone: null });
    },
  );
  it('expone únicamente contacto autorizado y lo oculta después de revocar', () => {
    expect(
      mapper.toApplicantResponse({
        ...record,
        radarConsent: { consentToContact: true },
      }),
    ).toMatchObject({ email: 'ana@test', phone: '70000000' });
    expect(
      mapper.toApplicantResponse({
        ...record,
        radarConsent: { consentToContact: false },
      }),
    ).toMatchObject({ email: null, phone: null });
  });
  it('una postulación retirada no autoriza contacto aunque conserve permisos antiguos', () => {
    expect(
      mapper.toApplicantResponse({
        ...record,
        status: { title: 'Retirada' },
        radarConsent: { consentToContact: true },
      }),
    ).toMatchObject({ email: null, phone: null });
  });
});
