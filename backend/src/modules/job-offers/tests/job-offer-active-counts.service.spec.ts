import { describe, expect, it, vi } from 'vitest';
import type { JobOfferMapper } from '../mappers/job-offer.mapper.js';
import type { JobOfferMatchRepository } from '../repositories/job-offer-match.repository.js';
import type { JobOffersRepository } from '../repositories/job-offers.repository.js';
import type { JobOfferNotificationsService } from '../services/job-offer-notifications.service.js';
import type { JobOfferSkillsService } from '../services/job-offer-skills.service.js';
import { JobOffersService } from '../services/job-offers.service.js';

describe('JobOffersService.countActiveOffersByCompany', () => {
  it('cuenta las vacantes publicadas y vigentes de cada empresa', async () => {
    const now = new Date('2026-11-25T12:00:00.000Z');
    const repository = {
      countActiveByCompany: vi.fn().mockResolvedValue([
        { companyId: 'company-1', _count: { _all: 3 } },
        { companyId: 'company-2', _count: { _all: 1 } },
      ]),
    };
    const service = new JobOffersService(
      repository as unknown as JobOffersRepository,
      {} as JobOfferSkillsService,
      {} as JobOfferMapper,
      {} as JobOfferMatchRepository,
      {} as JobOfferNotificationsService,
    );

    await expect(service.countActiveOffersByCompany(now)).resolves.toEqual([
      { companyId: 'company-1', activeOffers: 3 },
      { companyId: 'company-2', activeOffers: 1 },
    ]);
    expect(repository.countActiveByCompany).toHaveBeenCalledWith(now);
  });
});
