import { describe, expect, it } from 'vitest';
import { mapRegistration } from '../mappers/registration.mapper.js';
import { registrationRecord, NOW } from '../../../../test/fixtures/registration.fixture.js';

describe('registration state mapping', () => {
  it.each([
    { status: { title: 'Unknown' }, cancelledAt: null },
    { status: { title: 'Confirmada' }, cancelledAt: NOW },
    { status: { title: 'Cancelada' }, cancelledAt: null },
  ])('rejects an unknown or inconsistent state', (record) => {
    expect(() => mapRegistration(registrationRecord(record))).toThrow(expect.objectContaining({ code: 'INTERNAL_ERROR' }));
  });
});
