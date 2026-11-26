import { JobOfferStatus } from '../types/job-offer.enum.js';

export function buildPublishedJobOfferWhere(now: Date) {
  return {
    status: { title: JobOfferStatus.PUBLISHED },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}
