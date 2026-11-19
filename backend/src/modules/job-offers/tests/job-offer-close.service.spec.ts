import { describe, expect, it, vi } from 'vitest';
import {
  CompanyNotFoundException,
  JobOfferNotFoundException,
} from '../exceptions/index.js';
import type { JobOfferMapper } from '../mappers/job-offer.mapper.js';
import type { JobOfferMatchRepository } from '../repositories/job-offer-match.repository.js';
import type { JobOffersRepository } from '../repositories/job-offers.repository.js';
import type { JobOfferSkillsService } from '../services/job-offer-skills.service.js';
import { JobOffersService } from '../services/job-offers.service.js';
import { JobOfferStatus } from '../types/job-offer.enum.js';

function setup() {
  const repository = {
    companyExists: vi.fn().mockResolvedValue(true),
    findByCompanyAndId: vi.fn().mockResolvedValue({
      id: 'offer-1',
      status: { title: JobOfferStatus.PUBLISHED },
    }),
    findStatusId: vi.fn().mockResolvedValue('status-closed'),
    closePublished: vi.fn().mockResolvedValue({
      id: 'offer-1',
      status: { title: JobOfferStatus.CLOSED },
    }),
  };

  const mapper = {
    toResponse: vi.fn().mockImplementation((record) => ({
      id: record.id,
      status: record.status.title,
    })),
  };

  const service = new JobOffersService(
    repository as unknown as JobOffersRepository,
    {} as JobOfferSkillsService,
    mapper as unknown as JobOfferMapper,
    {} as JobOfferMatchRepository,
  );

  return { repository, service };
}

describe('JobOffersService.close', () => {
  it('cierra una vacante publicada de la empresa', async () => {
    const { repository, service } = setup();

    const result = await service.close('company-1', 'offer-1');

    expect(result).toMatchObject({
      id: 'offer-1',
      status: JobOfferStatus.CLOSED,
    });

    expect(repository.findStatusId).toHaveBeenCalledWith(
      JobOfferStatus.CLOSED,
    );
    expect(repository.closePublished).toHaveBeenCalledOnce();
  });

  it('rechaza una empresa inexistente', async () => {
    const { repository, service } = setup();
    repository.companyExists.mockResolvedValue(false);

    await expect(
      service.close('company-1', 'offer-1'),
    ).rejects.toBeInstanceOf(CompanyNotFoundException);

    expect(repository.closePublished).not.toHaveBeenCalled();
  });

  it('rechaza una vacante inexistente o ajena', async () => {
    const { repository, service } = setup();
    repository.findByCompanyAndId.mockResolvedValue(null);

    await expect(
      service.close('company-1', 'offer-1'),
    ).rejects.toBeInstanceOf(JobOfferNotFoundException);

    expect(repository.closePublished).not.toHaveBeenCalled();
  });

  it('rechaza cerrar una vacante ya cerrada', async () => {
    const { repository, service } = setup();

    repository.findByCompanyAndId.mockResolvedValue({
      id: 'offer-1',
      status: { title: JobOfferStatus.CLOSED },
    });

    await expect(
      service.close('company-1', 'offer-1'),
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(repository.closePublished).not.toHaveBeenCalled();
  });
});