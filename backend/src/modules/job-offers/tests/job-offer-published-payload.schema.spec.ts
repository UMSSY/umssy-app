import { describe, expect, it } from 'vitest';
import { jobOfferPublishedPayloadSchema } from '../notification/job-offer-published-payload.schema.js';

describe('jobOfferPublishedPayloadSchema', () => {
  it('acepta un título de vacante y un nombre de empresa', () => {
    const result = jobOfferPublishedPayloadSchema.safeParse({
      jobTitle: 'Backend Developer',
      companyName: 'Tech Corp',
    });

    expect(result.success).toBe(true);
  });

  it.each([
    ['jobTitle vacío', { jobTitle: '', companyName: 'Tech Corp' }],
    ['companyName vacío', { jobTitle: 'Backend Developer', companyName: '' }],
    ['jobTitle ausente', { companyName: 'Tech Corp' }],
    [
      'campos adicionales',
      { jobTitle: 'Backend Developer', companyName: 'Tech Corp', extra: 1 },
    ],
  ])('rechaza %s', (_label, payload) => {
    expect(jobOfferPublishedPayloadSchema.safeParse(payload).success).toBe(
      false,
    );
  });
});
