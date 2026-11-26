import { describe, expect, it } from 'vitest';
import { JobOfferStatus } from '../types/job-offer.enum.js';
import { buildPublishedJobOfferWhere } from '../utils/build-published-job-offer-where.js';

describe('buildPublishedJobOfferWhere', () => {
  it('filtra vacantes publicadas sin cierre o con cierre futuro', () => {
    const now = new Date('2026-11-25T12:00:00.000Z');

    expect(buildPublishedJobOfferWhere(now)).toEqual({
      status: { title: JobOfferStatus.PUBLISHED },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    });
  });
});
