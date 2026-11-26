import { describe, expect, it } from 'vitest';
import {
  reviewKindSchema,
  reviewDecisionSchema,
} from '../requests/radar-review.request.js';

describe('Contratos Zod de revisión del Radar', () => {
  it('admite únicamente los tipos de evidencia del flujo HU1-HU3', () => {
    expect(reviewKindSchema.safeParse('cv').success).toBe(true);
    expect(reviewKindSchema.safeParse('skill').success).toBe(true);
    expect(reviewKindSchema.safeParse('application').success).toBe(false);
  });
  it('admite aprobar, rechazar y revocar', () => {
    for (const decision of ['approved', 'rejected', 'revoked']) {
      expect(
        reviewDecisionSchema.safeParse({
          operationId: '33333333-3333-4333-8333-333333333333',
          decision,
        }).success,
      ).toBe(true);
    }
  });
  it('rechaza decisiones inválidas, cuerpos incompletos y campos adicionales', () => {
    expect(
      reviewDecisionSchema.safeParse({
        operationId: '33333333-3333-4333-8333-333333333333',
        decision: 'hired',
      }).success,
    ).toBe(false);
    expect(reviewDecisionSchema.safeParse({}).success).toBe(false);
    expect(
      reviewDecisionSchema.safeParse({ decision: 'approved' }).success,
    ).toBe(false);
    expect(reviewDecisionSchema.safeParse(null).success).toBe(false);
    expect(
      reviewDecisionSchema.safeParse({
        operationId: '33333333-3333-4333-8333-333333333333',
        decision: 'approved',
        companyId: 'x',
      }).success,
    ).toBe(false);
  });
});
