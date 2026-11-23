import { describe, expect, it } from 'vitest';
import {
  buildJobOfferActionUrl,
  JobOfferPublishedPayloadSchema,
} from '../requests/job-offer-published.payload.js';

describe('JobOfferPublishedPayloadSchema & buildJobOfferActionUrl', () => {
  it('valida correctamente un payload con jobTitle y companyName no vacíos', () => {
    const result = JobOfferPublishedPayloadSchema.safeParse({
      jobTitle: 'Backend Developer',
      companyName: 'Tech Corp',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        jobTitle: 'Backend Developer',
        companyName: 'Tech Corp',
      });
    }
  });

  it('rechaza jobTitle vacío', () => {
    const result = JobOfferPublishedPayloadSchema.safeParse({
      jobTitle: '',
      companyName: 'Tech Corp',
    });

    expect(result.success).toBe(false);
  });

  it('rechaza companyName vacío', () => {
    const result = JobOfferPublishedPayloadSchema.safeParse({
      jobTitle: 'Backend Developer',
      companyName: '',
    });

    expect(result.success).toBe(false);
  });

  it('construye la URL de acción con el formato /vacancies/:id', () => {
    expect(buildJobOfferActionUrl('offer-42')).toBe('/vacancies/offer-42');
  });
});