import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JOB_OFFER_CREATED_SELECT, JOB_OFFER_SELECT } from '../constants/job-offer.constants.js';
import { JobOffersRepository } from '../repositories/job-offers.repository.js';
import { JobOfferContractType, JobOfferModality, JobOfferStatus } from '../types/job-offer.enum.js';

function createPrisma() {
  return {
    company: { findUnique: vi.fn() },
    jobOfferModality: { findUnique: vi.fn() },
    jobOfferContractType: { findUnique: vi.fn() },
    jobOfferStatus: { findUnique: vi.fn() },
    jobOffer: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  };
}

describe('JobOffersRepository', () => {
  let prisma: ReturnType<typeof createPrisma>;
  let repository: JobOffersRepository;

  beforeEach(() => {
    prisma = createPrisma();
    repository = new JobOffersRepository(prisma as unknown as PrismaService);
  });

  it('indica si la empresa existe', async () => {
    prisma.company.findUnique.mockResolvedValueOnce({ id: 'company-1' }).mockResolvedValueOnce(null);

    expect(await repository.companyExists('company-1')).toBe(true);
    expect(await repository.companyExists('missing')).toBe(false);
    expect(prisma.company.findUnique).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      select: { id: true },
    });
  });

  it('busca los ids de los catálogos por título y devuelve null si falta alguno', async () => {
    prisma.jobOfferModality.findUnique.mockResolvedValue({ id: 'modality-1' });
    prisma.jobOfferContractType.findUnique.mockResolvedValue(null);
    prisma.jobOfferStatus.findUnique.mockResolvedValue({ id: 'status-1' });

    const ids = await repository.findCatalogIds('Híbrido', 'Otro', 'Publicada');

    expect(ids).toEqual({ modalityId: 'modality-1', contractTypeId: null, statusId: 'status-1' });
    expect(prisma.jobOfferModality.findUnique).toHaveBeenCalledWith({
      where: { title: 'Híbrido' },
      select: { id: true },
    });
  });

  it('al reabrir cambia el estado y renueva la fecha de publicación', async () => {
    const publishedAt = new Date('2026-10-28T14:00:00.000Z');
    prisma.jobOffer.update.mockResolvedValue({ id: 'offer-1' });

    await repository.reopen('offer-1', 'status-published', publishedAt);

    expect(prisma.jobOffer.update).toHaveBeenCalledWith({
      where: { id: 'offer-1' },
      data: { statusId: 'status-published', createdAt: publishedAt },
      select: JOB_OFFER_SELECT,
    });
  });

  it('busca el id de un estado por su título', async () => {
    prisma.jobOfferStatus.findUnique.mockResolvedValueOnce({ id: 'status-1' }).mockResolvedValueOnce(null);

    expect(await repository.findStatusId(JobOfferStatus.DELETED)).toBe('status-1');
    expect(await repository.findStatusId(JobOfferStatus.CLOSED)).toBeNull();
    expect(prisma.jobOfferStatus.findUnique).toHaveBeenCalledWith({
      where: { title: 'Eliminada' },
      select: { id: true },
    });
  });

  it('devuelve todos los ids en null si los catálogos no están sembrados', async () => {
    prisma.jobOfferModality.findUnique.mockResolvedValue(null);
    prisma.jobOfferContractType.findUnique.mockResolvedValue({ id: 'contract-1' });
    prisma.jobOfferStatus.findUnique.mockResolvedValue(null);

    expect(await repository.findCatalogIds('Remoto', 'Pasantía', 'Publicada')).toEqual({
      modalityId: null,
      contractTypeId: 'contract-1',
      statusId: null,
    });
  });

  it('crea la vacante junto con sus tecnologías', async () => {
    prisma.jobOffer.create.mockResolvedValue({ id: 'offer-1', createdAt: new Date() });

    await repository.create({
      companyId: 'company-1',
      modalityId: 'modality-1',
      contractTypeId: 'contract-1',
      statusId: 'status-1',
      title: 'DevOps',
      description: 'Descripción',
      category: 'Tecnología',
      positionsAvailable: 1,
      salaryRange: 'Bs 5.000',
      languages: 'Español',
      locationUrl: 'https://goo.gl/maps/a',
      requiredCareers: [],
      minExperienceYears: null,
      otherRequirements: [],
      skillIds: ['skill-1', 'skill-2'],
    });

    expect(prisma.jobOffer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 'company-1',
        title: 'DevOps',
        skills: { create: [{ skillId: 'skill-1' }, { skillId: 'skill-2' }] },
      }),
      select: JOB_OFFER_CREATED_SELECT,
    });
    expect(prisma.jobOffer.create.mock.calls[0][0].data).not.toHaveProperty('skillIds');
  });

  it('lista solo las vacantes publicadas y vigentes', async () => {
    const now = new Date('2026-10-12T00:00:00.000Z');
    prisma.jobOffer.findMany.mockResolvedValue([]);

    await repository.findPublished(now);

    expect(prisma.jobOffer.findMany).toHaveBeenCalledWith({
      where: {
        status: { title: 'Publicada' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      select: JOB_OFFER_SELECT,
    });
  });
    it('lista las vacantes de una empresa sin filtros, de la más reciente a la más antigua', async () => {
    prisma.jobOffer.findMany.mockResolvedValue([]);

    await repository.findByCompany('company-1', { sortBy: 'createdAt', order: 'desc' });

    expect(prisma.jobOffer.findMany).toHaveBeenCalledWith({
      where: { companyId: 'company-1'  },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: JOB_OFFER_SELECT,
    });
  });

  it('aplica los filtros al listar las vacantes de una empresa', async () => {
    prisma.jobOffer.findMany.mockResolvedValue([]);

    await repository.findByCompany('company-1', {
      modality: JobOfferModality.REMOTE,
      contractType: JobOfferContractType.PART_TIME,
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      search: 'react',
      sortBy: 'createdAt',
      order: 'asc',
    });

    expect(prisma.jobOffer.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        modality: { title: 'Remoto' },
        contractType: { title: 'Medio tiempo' },
        createdAt: {
          gte: new Date('2026-10-01T04:00:00.000Z'),
          lt: new Date('2026-11-01T04:00:00.000Z'),
        },
        title: { contains: 'react', mode: 'insensitive' },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: JOB_OFFER_SELECT,
    });
  });

  it('consulta una vacante por empresa e id con sus relaciones detalladas', async () => {
    const record = { id: 'offer-1' };
    prisma.jobOffer.findFirst.mockResolvedValue(record);

    await expect(repository.findByCompanyAndId('company-1', 'offer-1')).resolves.toBe(record);

    expect(prisma.jobOffer.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'offer-1',
        companyId: 'company-1',
        status: { title: { not: JobOfferStatus.DELETED } },
      },
      select: JOB_OFFER_SELECT,
    });
  });

  it('actualiza la vacante reemplazando sus habilidades en una sola operación', async () => {
    prisma.jobOffer.update.mockResolvedValue({ id: 'offer-1' });

    await repository.update('offer-1', {
      modalityId: 'modality-1',
      contractTypeId: 'contract-1',
      title: 'DevOps',
      description: 'Descripción',
      category: 'Tecnología',
      positionsAvailable: 2,
      salaryRange: 'Bs 6.500',
      languages: 'Español',
      locationUrl: 'https://maps.google.com/?q=x',
      skillIds: ['skill-1', 'skill-2'],
    });

    expect(prisma.jobOffer.update).toHaveBeenCalledWith({
      where: { id: 'offer-1' },
      data: expect.objectContaining({
        title: 'DevOps',
        modalityId: 'modality-1',
        skills: {
          deleteMany: {},
          create: [{ skillId: 'skill-1' }, { skillId: 'skill-2' }],
        },
      }),
      select: JOB_OFFER_SELECT,
    });
  });

  it('permite consultar los detalles de una vacante eliminada en el historial', async () => {
    const record = { id: 'offer-1' };
    prisma.jobOffer.findFirst.mockResolvedValue(record);

    await expect(
      repository.findHistoryByCompanyAndId('company-1', 'offer-1'),
    ).resolves.toBe(record);

    expect(prisma.jobOffer.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'offer-1',
        companyId: 'company-1',
      },
      select: JOB_OFFER_SELECT,
    });
  });

});
