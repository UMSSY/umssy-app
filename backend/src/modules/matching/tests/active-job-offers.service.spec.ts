import { describe, expect, it, vi } from 'vitest';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { ActiveJobOffersService } from '../services/active-job-offers.service.js';

describe('ActiveJobOffersService', () => {
  it('returns published and active job offers from JobOffersService', async () => {
    const activeOffers = [
      {
        id: 'offer-1',
        title: 'Backend Developer',
        status: 'Publicada',
        skills: [{ id: 'skill-1', name: 'TypeScript' }],
      },
    ];

    const listPublished = vi.fn().mockResolvedValue(activeOffers);

    const jobOffersService = {
      listPublished,
    } as unknown as JobOffersService;

    const service = new ActiveJobOffersService(jobOffersService);

    const result = await service.findAll();

    expect(listPublished).toHaveBeenCalledOnce();
    expect(result).toEqual(activeOffers);
  });

  it('returns an empty list when there are no active offers', async () => {
    const listPublished = vi.fn().mockResolvedValue([]);

    const jobOffersService = {
      listPublished,
    } as unknown as JobOffersService;

    const service = new ActiveJobOffersService(jobOffersService);

    const result = await service.findAll();

    expect(result).toEqual([]);
    expect(listPublished).toHaveBeenCalledOnce();
  });
});
