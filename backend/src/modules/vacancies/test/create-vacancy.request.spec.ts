import { describe, it, expect } from 'vitest';
import { createVacancySchema } from '../request/create-vacancy.request.js';

const validPayload = {
  title: 'Desarrollador Júnior',
  modality: 'REMOTE',
  contractType: 'INTERNSHIP',
  category: 'TI',
  positionsAvailable: 3,
  salaryRange: 'Bs 6.500 - 8.000',
  languages: 'Español, Inglés',
  locationUrl: 'https://maps.google.com/?q=cochabamba',
};

const isValid = (payload: unknown): boolean => createVacancySchema.safeParse(payload).success;

describe('createVacancySchema', () => {
  it('accepts a valid payload', () => {
    expect(isValid(validPayload)).toBe(true);
  });

  it('accepts a goo.gl/maps link', () => {
    expect(isValid({ ...validPayload, locationUrl: 'https://goo.gl/maps/abc123' })).toBe(true);
  });

  it('accepts a fixed salary', () => {
    expect(isValid({ ...validPayload, salaryRange: 'Bs 5.000' })).toBe(true);
  });

  it('rejects a title longer than 60 characters', () => {
    expect(isValid({ ...validPayload, title: 'a'.repeat(61) })).toBe(false);
  });

  it('rejects a title with special characters', () => {
    expect(isValid({ ...validPayload, title: 'Dev @' })).toBe(false);
  });

  it('rejects a title with only spaces', () => {
    expect(isValid({ ...validPayload, title: '   ' })).toBe(false);
  });

  it('rejects a modality outside the enum', () => {
    expect(isValid({ ...validPayload, modality: 'OTHER' })).toBe(false);
  });

  it('rejects a contract type outside the enum', () => {
    expect(isValid({ ...validPayload, contractType: 'OTHER' })).toBe(false);
  });

  it('rejects positions outside 1-500 or decimals', () => {
    expect(isValid({ ...validPayload, positionsAvailable: 0 })).toBe(false);
    expect(isValid({ ...validPayload, positionsAvailable: 501 })).toBe(false);
    expect(isValid({ ...validPayload, positionsAvailable: 1.5 })).toBe(false);
  });

  it('rejects a salary with invalid format', () => {
    expect(isValid({ ...validPayload, salaryRange: '6500' })).toBe(false);
  });

  it('rejects a salary where min is greater than max', () => {
    expect(isValid({ ...validPayload, salaryRange: 'Bs 9.000 - 8.000' })).toBe(false);
  });

  it('rejects languages longer than 100 characters', () => {
    expect(isValid({ ...validPayload, languages: 'a'.repeat(101) })).toBe(false);
  });

  it('rejects a URL that is not from Google Maps', () => {
    expect(isValid({ ...validPayload, locationUrl: 'https://google.com' })).toBe(false);
  });

  it('rejects unknown fields', () => {
    expect(isValid({ ...validPayload, extra: 1 })).toBe(false);
  });
});
