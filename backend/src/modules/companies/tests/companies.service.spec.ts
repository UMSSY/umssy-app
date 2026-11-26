import { describe, expect, it, vi } from 'vitest';
import type { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception.js';
import type { CompaniesRepository } from '../repositories/companies.repository.js';
import { CompaniesService } from '../services/companies.service.js';

function setup({
  profile = null,
  counts = [],
  candidates = [],
}: {
  profile?: unknown;
  counts?: { companyId: string; activeOffers: number }[];
  candidates?: unknown[];
} = {}) {
  const repository = {
    findProfile: vi.fn().mockResolvedValue(profile),
    findFeaturedCandidates: vi.fn().mockResolvedValue(candidates),
  };
  const jobOffersService = {
    countActiveOffersByCompany: vi.fn().mockResolvedValue(counts),
  };
  const service = new CompaniesService(
    repository as unknown as CompaniesRepository,
    jobOffersService as unknown as JobOffersService,
  );
  return { repository, jobOffersService, service };
}

describe('CompaniesService.getProfile', () => {
  it('devuelve el perfil de la empresa', async () => {
    const { repository, service } = setup({
      profile: {
        id: 'company-1',
        title: 'Tech Andina',
        description: 'Software a medida',
        profile: null,
        logo: null,
      },
    });

    await expect(service.getProfile('company-1')).resolves.toMatchObject({
      id: 'company-1',
      name: 'Tech Andina',
    });
    expect(repository.findProfile).toHaveBeenCalledWith('company-1');
  });

  it('lanza COMPANY_NOT_FOUND si la empresa no existe', async () => {
    const { service } = setup();

    await expect(service.getProfile('company-1')).rejects.toBeInstanceOf(
      CompanyNotFoundException,
    );
  });
});

describe('CompaniesService.listFeatured', () => {
  it('busca solo las empresas que tienen vacantes vigentes', async () => {
    const { repository, jobOffersService, service } = setup({
      counts: [{ companyId: 'company-1', activeOffers: 2 }],
      candidates: [
        {
          id: 'company-1',
          title: 'Tech Andina',
          description: null,
          profile: null,
          logo: null,
        },
      ],
    });

    await expect(service.listFeatured()).resolves.toEqual([
      {
        id: 'company-1',
        name: 'Tech Andina',
        sector: null,
        description: null,
        logoUrl: null,
        activeVacanciesCount: 2,
      },
    ]);
    expect(jobOffersService.countActiveOffersByCompany).toHaveBeenCalledWith(
      expect.any(Date),
    );
    expect(repository.findFeaturedCandidates).toHaveBeenCalledWith([
      'company-1',
    ]);
  });

  it('no consulta empresas cuando nadie tiene vacantes vigentes', async () => {
    const { repository, service } = setup();

    await expect(service.listFeatured()).resolves.toEqual([]);
    expect(repository.findFeaturedCandidates).not.toHaveBeenCalled();
  });
});
