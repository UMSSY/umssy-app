import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CompanyNotFoundException,
  JobOfferCatalogNotFoundException,
  JobOfferNotFoundException,
} from '../exceptions/index.js';
import { JobOfferMapper } from '../mappers/job-offer.mapper.js';
import type { JobOffersRepository } from '../repositories/job-offers.repository.js';
import type { CreateJobOfferRequest } from '../requests/create-job-offer.request.js';
import type { JobOfferSkillsService } from '../services/job-offer-skills.service.js';
import { JobOffersService } from '../services/job-offers.service.js';
import { JobOfferContractType, JobOfferModality } from '../types/job-offer.enum.js';
import type { JobOfferRecord } from '../types/job-offer-record.type.js';

const CREATED_AT = new Date('2026-10-12T15:00:00.000Z');

const REQUEST: CreateJobOfferRequest = {
  title: 'DevOps Senior',
  description: 'Descripción',
  modality: JobOfferModality.HYBRID,
  contractType: JobOfferContractType.FULL_TIME,
  category: 'Tecnología',
  positionsAvailable: 2,
  salaryMin: 6500,
  salaryMax: 8000,
  languages: 'Español',
  locationUrl: 'https://maps.google.com/?q=x',
  skillIds: ['skill-1'],
};

const RECORD: JobOfferRecord = {
  id: 'offer-1',
  title: 'DevOps Senior',
  description: 'Descripción',
  category: 'Tecnología',
  positionsAvailable: 2,
  salaryRange: 'Bs 6.500 - 8.000',
  languages: 'Español',
  locationUrl: 'https://maps.google.com/?q=x',
  expiresAt: null,
  createdAt: CREATED_AT,
  company: { id: 'company-1', title: 'TechBolivia S.R.L.' },
  modality: { title: 'Híbrido' },
  contractType: { title: 'Tiempo completo' },
  status: { title: 'Publicada' },
  skills: [{ skill: { id: 'skill-1', name: 'Docker' } }],
};

function createRepository() {
  return {
    companyExists: vi.fn().mockResolvedValue(true),
    findCatalogIds: vi.fn().mockResolvedValue({
      modalityId: 'modality-1',
      contractTypeId: 'contract-1',
      statusId: 'status-1',
    }),
    create: vi.fn().mockResolvedValue({
      id: 'offer-1',
      createdAt: CREATED_AT,
    }),
    findPublished: vi.fn().mockResolvedValue([RECORD]),
    findByCompany: vi.fn().mockResolvedValue([RECORD]),
    findByCompanyAndId: vi.fn().mockResolvedValue(RECORD),
    findHistoryByCompanyAndId: vi.fn().mockResolvedValue(RECORD),
    update: vi.fn().mockResolvedValue(RECORD),
  };
}

describe('JobOffersService', () => {
  let repository: ReturnType<typeof createRepository>;
  let skillsService: { validateSkillIds: ReturnType<typeof vi.fn>; listCatalog: ReturnType<typeof vi.fn> };
  let service: JobOffersService;

  beforeEach(() => {
    repository = createRepository();
    skillsService = {
      validateSkillIds: vi.fn().mockResolvedValue(undefined),
      listCatalog: vi.fn().mockResolvedValue([{ id: 'skill-1', name: 'Docker' }]),
    };
    service = new JobOffersService(
      repository as unknown as JobOffersRepository,
      skillsService as unknown as JobOfferSkillsService,
      new JobOfferMapper(),
    );
  });

  describe('create', () => {
    it('publica la vacante con el estado Publicada y el salario formateado', async () => {
      const result = await service.create('company-1', REQUEST);

      expect(repository.findCatalogIds).toHaveBeenCalledWith('Híbrido', 'Tiempo completo', 'Publicada');
      expect(repository.create).toHaveBeenCalledWith({
        companyId: 'company-1',
        modalityId: 'modality-1',
        contractTypeId: 'contract-1',
        statusId: 'status-1',
        title: 'DevOps Senior',
        description: 'Descripción',
        category: 'Tecnología',
        positionsAvailable: 2,
        salaryRange: 'Bs 6.500 - 8.000',
        languages: 'Español',
        locationUrl: 'https://maps.google.com/?q=x',
        skillIds: ['skill-1'],
      });
      expect(result).toEqual({ id: 'offer-1', createdAt: CREATED_AT.toISOString() });
    });

    it('valida las tecnologías antes de guardar', async () => {
      skillsService.validateSkillIds.mockRejectedValue(new Error('habilidad inválida'));

      await expect(service.create('company-1', REQUEST)).rejects.toThrow('habilidad inválida');
      expect(skillsService.validateSkillIds).toHaveBeenCalledWith(['skill-1']);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rechaza una empresa que no existe', async () => {
      repository.companyExists.mockResolvedValue(false);

      await expect(service.create('missing', REQUEST)).rejects.toBeInstanceOf(CompanyNotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it.each([
      ['modalityId', 'modalidad'],
      ['contractTypeId', 'tipo de contrato'],
      ['statusId', 'estado'],
    ])('rechaza la vacante si falta el catálogo %s', async (key, label) => {
      repository.findCatalogIds.mockResolvedValue({
        modalityId: 'modality-1',
        contractTypeId: 'contract-1',
        statusId: 'status-1',
        [key]: null,
      });

      await expect(service.create('company-1', REQUEST)).rejects.toEqual(
        new JobOfferCatalogNotFoundException(label),
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  it('lista las vacantes publicadas con la fecha actual', async () => {
    const result = await service.listPublished();

    expect(repository.findPublished).toHaveBeenCalledWith(expect.any(Date));
    expect(result[0]).toMatchObject({ id: 'offer-1', company: { name: 'TechBolivia S.R.L.' } });
  });

  it('lista las vacantes de una empresa existente sin filtros', async () => {
    const result = await service.listByCompany('company-1');

    expect(repository.findByCompany).toHaveBeenCalledWith('company-1', {
      sortBy: 'createdAt',
      order: 'desc',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'offer-1', company: { name: 'TechBolivia S.R.L.' } });
  });

  it('pasa los filtros al repositorio al listar las vacantes de una empresa', async () => {
    const filters = {
      modality: JobOfferModality.REMOTE,
      dateFrom: '2026-10-01',
      sortBy: 'createdAt' as const,
      order: 'asc' as const,
    };

    await service.listByCompany('company-1', filters);

    expect(repository.findByCompany).toHaveBeenCalledWith('company-1', filters);
  });

  it('devuelve una lista vacía si ninguna vacante coincide con los filtros', async () => {
    repository.findByCompany.mockResolvedValue([]);

    expect(
      await service.listByCompany('company-1', {
        contractType: JobOfferContractType.INTERNSHIP,
        sortBy: 'createdAt',
        order: 'desc',
      }),
    ).toEqual([]);
  });

  it('rechaza listar vacantes de una empresa que no existe', async () => {
    repository.companyExists.mockResolvedValue(false);

    await expect(service.listByCompany('missing')).rejects.toBeInstanceOf(CompanyNotFoundException);
    expect(repository.findByCompany).not.toHaveBeenCalled();
  });

  it('obtiene los detalles de una vacante perteneciente a la empresa', async () => {
    const result = await service.getByCompanyAndId('company-1', 'offer-1');

    expect(repository.findHistoryByCompanyAndId).toHaveBeenCalledWith('company-1', 'offer-1');
    expect(result).toMatchObject({
      id: 'offer-1',
      languages: 'Español',
      skills: [{ id: 'skill-1', name: 'Docker' }],
    });
  });

  it('responde 404 si la vacante no existe o no pertenece a la empresa', async () => {
    repository.findHistoryByCompanyAndId.mockResolvedValue(null);

    await expect(service.getByCompanyAndId('company-1', 'missing')).rejects.toBeInstanceOf(
      JobOfferNotFoundException,
    );
  });

  it('propaga los errores del repositorio al consultar los detalles', async () => {
    repository.findHistoryByCompanyAndId.mockRejectedValue(new Error('Error de base de datos'));

    await expect(service.getByCompanyAndId('company-1', 'offer-1')).rejects.toThrow(
      'Error de base de datos',
    );
  });

  it('no busca vacantes cuando la empresa no existe', async () => {
    repository.companyExists.mockResolvedValue(false);

    await expect(service.getByCompanyAndId('missing', 'offer-1')).rejects.toBeInstanceOf(
      CompanyNotFoundException,
    );
    expect(repository.findHistoryByCompanyAndId).not.toHaveBeenCalled();
  });

  it('devuelve el catálogo de tecnologías', async () => {
    expect(await service.listSkillCatalog()).toEqual([{ id: 'skill-1', name: 'Docker' }]);
  });

  describe('update', () => {
    it('actualiza la vacante de la empresa con los catálogos y habilidades validados', async () => {
      const response = await service.update('company-1', 'offer-1', REQUEST);

      expect(repository.findByCompanyAndId).toHaveBeenCalledWith('company-1', 'offer-1');
      expect(skillsService.validateSkillIds).toHaveBeenCalledWith(['skill-1']);
      expect(repository.update).toHaveBeenCalledWith('offer-1', {
        modalityId: 'modality-1',
        contractTypeId: 'contract-1',
        title: 'DevOps Senior',
        description: 'Descripción',
        category: 'Tecnología',
        positionsAvailable: 2,
        salaryRange: 'Bs 6.500 - 8.000',
        languages: 'Español',
        locationUrl: 'https://maps.google.com/?q=x',
        skillIds: ['skill-1'],
      });
      expect(response.id).toBe('offer-1');
    });

    it('rechaza una empresa inexistente sin tocar la vacante', async () => {
      repository.companyExists.mockResolvedValue(false);

      await expect(service.update('company-1', 'offer-1', REQUEST)).rejects.toBeInstanceOf(
        CompanyNotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rechaza una vacante inexistente, eliminada o de otra empresa', async () => {
      repository.findByCompanyAndId.mockResolvedValue(null);

      await expect(service.update('company-1', 'offer-1', REQUEST)).rejects.toBeInstanceOf(
        JobOfferNotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rechaza una modalidad o un tipo de contrato que no están en el catálogo', async () => {
      repository.findCatalogIds.mockResolvedValue({
        modalityId: null,
        contractTypeId: 'contract-1',
        statusId: 'status-1',
      });
      await expect(service.update('company-1', 'offer-1', REQUEST)).rejects.toBeInstanceOf(
        JobOfferCatalogNotFoundException,
      );

      repository.findCatalogIds.mockResolvedValue({
        modalityId: 'modality-1',
        contractTypeId: null,
        statusId: 'status-1',
      });
      await expect(service.update('company-1', 'offer-1', REQUEST)).rejects.toBeInstanceOf(
        JobOfferCatalogNotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('permite consultar los detalles de una vacante eliminada en el historial', async () => {
      const deletedRecord: JobOfferRecord = {
      ...RECORD,
      status: { title: 'Eliminada' },
      };

      repository.findHistoryByCompanyAndId.mockResolvedValue(deletedRecord);

      const result = await service.getByCompanyAndId('company-1', 'offer-1');

      expect(repository.findHistoryByCompanyAndId).toHaveBeenCalledWith(
        'company-1',
        'offer-1',
      );
      expect(result.status).toBe('Eliminada');
      expect(repository.update).not.toHaveBeenCalled();
    });

  });
});
