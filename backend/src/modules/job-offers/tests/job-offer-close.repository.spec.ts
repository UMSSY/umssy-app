import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { Prisma } from '../../../prisma/client.js';
import { JOB_OFFER_SELECT } from '../constants/job-offer.constants.js';
import { JobOfferNotClosableException } from '../exceptions/index.js';
import { JobOffersRepository } from '../repositories/job-offers.repository.js';
import { JobOfferStatus } from '../types/job-offer.enum.js';

function setup() {
  const update = vi.fn();

  const repository = new JobOffersRepository({
    jobOffer: { update },
  } as unknown as PrismaService);

  return { update, repository };
}

describe('JobOffersRepository.closePublished', () => {
  it('cierra únicamente una vacante publicada de la empresa', async () => {
    const { update, repository } = setup();

    const record = {
      id: 'offer-1',
      status: { title: JobOfferStatus.CLOSED },
    };

    update.mockResolvedValue(record);

    const result = await repository.closePublished(
      'company-1',
      'offer-1',
      'status-closed',
    );

    expect(update).toHaveBeenCalledOnce();

    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'offer-1',
        companyId: 'company-1',
        status: {
          title: JobOfferStatus.PUBLISHED,
        },
      },
      data: {
        statusId: 'status-closed',
      },
      select: JOB_OFFER_SELECT,
    });

    expect(result).toBe(record);
  });

  it('rechaza el cierre si la vacante cambió de estado', async () => {
    const { update, repository } = setup();

    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Record to update not found',
        {
          code: 'P2025',
          clientVersion: '7.10.0',
        },
      ),
    );

    await expect(
      repository.closePublished(
        'company-1',
        'offer-1',
        'status-closed',
      ),
    ).rejects.toBeInstanceOf(JobOfferNotClosableException);
  });

  it('no oculta errores inesperados de la base de datos', async () => {
    const { update, repository } = setup();

    update.mockRejectedValue(new Error('Database unavailable'));

    await expect(
      repository.closePublished(
        'company-1',
        'offer-1',
        'status-closed',
      ),
    ).rejects.toThrow('Database unavailable');
  });
});