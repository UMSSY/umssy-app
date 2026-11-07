import { describe, expect, it } from 'vitest';
import {
  applicationConsentsSchema,
  applicationRequestSchema,
  companyAccessSchema,
  recruiterDecisionSchema,
} from '../requests/radar-integration.requests.js';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('Contratos Zod de reclutamiento del Radar', () => {
  it('valida el vínculo empresa-reclutador', () => {
    expect(
      companyAccessSchema.safeParse({ userId: UUID, companyId: UUID }).success,
    ).toBe(true);
    expect(companyAccessSchema.safeParse({ userId: UUID }).success).toBe(false);
    expect(
      companyAccessSchema.safeParse({ userId: UUID, companyId: UUID, extra: 1 })
        .success,
    ).toBe(false);
  });

  it('aplica consentimientos independientes con valor por defecto falso', () => {
    expect(applicationRequestSchema.parse({ jobOfferId: UUID })).toEqual({
      jobOfferId: UUID,
      consent: false,
      consentCv: false,
      consentContact: false,
    });
    expect(
      applicationRequestSchema.safeParse({
        jobOfferId: 'no-uuid',
        consent: true,
      }).success,
    ).toBe(false);
  });

  it('exige los tres consentimientos al actualizarlos', () => {
    expect(
      applicationConsentsSchema.safeParse({
        consent: true,
        consentCv: false,
        consentContact: true,
      }).success,
    ).toBe(true);
    expect(
      applicationConsentsSchema.safeParse({ consent: true }).success,
    ).toBe(false);
  });

  it('admite sólo contratación o rechazo como decisión del reclutador', () => {
    expect(recruiterDecisionSchema.safeParse({ decision: 'hired' }).success).toBe(
      true,
    );
    expect(
      recruiterDecisionSchema.safeParse({ decision: 'rejected' }).success,
    ).toBe(true);
    expect(
      recruiterDecisionSchema.safeParse({ decision: 'withdrawn' }).success,
    ).toBe(false);
  });
});
