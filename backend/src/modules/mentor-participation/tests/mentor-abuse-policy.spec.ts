import { describe, expect, it } from 'vitest';
import { mentorAbusePolicy, sanctionRetryAfter } from '../services/mentor-abuse-policy.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';

describe('control de abuso HU7', () => {
  it('usa cinco intentos en 24 horas y suspensión de 72 horas por defecto', () => {
    expect(mentorAbusePolicy({})).toEqual({ threshold: 5, windowHours: 24, sanctionHours: 72 });
  });

  it('valida configuración positiva entera y exige clave de idempotencia UUID', () => {
    expect(() => mentorAbusePolicy({ MENTOR_ABUSE_THRESHOLD: '0' })).toThrow();
    expect(() => mentorAbusePolicy({ MENTOR_SANCTION_HOURS: '1.5' })).toThrow();
    expect(() => MentorParticipationService.requireIdempotencyKey(undefined)).toThrow();
    expect(MentorParticipationService.requireIdempotencyKey('550E8400-E29B-41D4-A716-446655440000'))
      .toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('calcula Retry-After hasta el vencimiento exacto', () => {
    expect(sanctionRetryAfter(new Date('2026-10-27T16:00:00.001Z'), new Date('2026-10-24T16:00:00Z')))
      .toBe(259201);
  });
});
