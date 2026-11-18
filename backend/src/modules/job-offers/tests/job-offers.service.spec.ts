import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CompanyNotFoundException,
  JobOfferCatalogNotFoundException,
  JobOfferExpiryInPastException,
  JobOfferNotFoundException,
  JobOfferNotReopenableException,
} from '../exceptions/index.js';
import { JobOfferMapper } from '../mappers/job-offer.mapper.js';
import type { JobOffersRepository } from '../repositories/job-offers.repository.js';
import type { CreateJobOfferRequest } from '../requests/create-job-offer.request.js';
import type { UpdateJobOfferRequest } from '../requests/update-job-offer.request.js';
import type { JobOfferSkillsService } from '../services/job-offer-skills.service.js';
import type { JobOfferMatchRepository } from '../repositories/job-offer-match.repository.js';
import { JobOffersService } from '../services/job-offers.service.js';
import {
  JobOfferContractType,
  JobOfferModality,
} from '../types/job-offer.enum.js';
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
  requiredCareers: ['Ingeniería de Sistemas'],
  minExperienceYears: 2,
  otherRequirements: ['Carta de motivación'],
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
  publishedAt: CREATED_AT,
  createdAt: CREATED_AT,
  company: { id: 'company-1', title: 'TechBolivia S.R.L.' },
  modality: { title: 'Híbrido' },
  contractType: { title: 'Tiempo completo' },
  status: { title: 'Publicada' },
  skills: [{ skill: { id: 'skill-1', name: 'Docker' } }],
  _count: { applications: 0 },
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
    findStatusId: vi.fn().mockResolvedValue('status-deleted'),
    updateStatus: vi.fn().mockResolvedValue(RECORD),
    reopen: vi.fn().mockResolvedValue(RECORD),
    closeExpired: vi.fn().mockResolvedValue(0),
    findOfferSummary: vi.fn(),
  };
}

describe('JobOffersService', () => {
  let repository: ReturnType<typeof createRepository>;
  let skillsService: {
    validateSkillIds: ReturnType<typeof vi.fn>;
    listCatalog: ReturnType<typeof vi.fn>;
  };
  let service: JobOffersService;

  beforeEach(() => {
    repository = createRepository();
    skillsService = {
      validateSkillIds: vi.fn().mockResolvedValue(undefined),
      listCatalog: vi
        .fn()
        .mockResolvedValue([{ id: 'skill-1', name: 'Docker' }]),
    };
    service = new JobOffersService(
      repository as unknown as JobOffersRepository,
      skillsService as unknown as JobOfferSkillsService,
      new JobOfferMapper(),
      {
        findPublishedById: vi.fn(),
        findPublished: vi.fn(),
      } as unknown as JobOfferMatchRepository,
    );
  });

  describe('create', () => {
    it('publica la vacante con el estado Publicada y el salario formateado', async () => {
      const result = await service.create('company-1', REQUEST);

      expect(repository.findCatalogIds).toHaveBeenCalledWith(
        'Híbrido',
        'Tiempo completo',
        'Publicada',
      );
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
        requiredCareers: ['Ingeniería de Sistemas'],
        minExperienceYears: 2,
        otherRequirements: ['Carta de motivación'],
        expiresAt: null,
        skillIds: ['skill-1'],
      });
      expect(result).toEqual({
        id: 'offer-1',
        createdAt: CREATED_AT.toISOString(),
      });
    });

    describe('fecha de cierre', () => {
      const NOW = new Date('2026-11-12T15:00:00.000Z');

      beforeEach(() => {
        vi.useFakeTimers({ now: NOW });
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('guarda la fecha de cierre cuando es futura', async () => {
        await service.create('company-1', {
          ...REQUEST,
          expiresAt: '2026-12-16T03:59:00.000Z',
        });

        expect(repository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            expiresAt: new Date('2026-12-16T03:59:00.000Z'),
          }),
        );
      });

      it.each([undefined, null])(
        'publica sin fecha de cierre cuando expiresAt es %s',
        async (expiresAt) => {
          await service.create('company-1', { ...REQUEST, expiresAt });

          expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({ expiresAt: null }),
          );
        },
      );

      it.each([
        ['una fecha pasada', '2026-11-11T03:59:00.000Z'],
        ['este mismo instante', '2026-11-12T15:00:00.000Z'],
      ])('responde 422 con %s', async (_label, expiresAt) => {
        const error = await service
          .create('company-1', { ...REQUEST, expiresAt })
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(JobOfferExpiryInPastException);
        expect(error).toMatchObject({
          statusCode: 422,
          code: 'JOB_OFFER_EXPIRY_IN_PAST',
        });
        expect(repository.create).not.toHaveBeenCalled();
      });
    });

    it('guarda los requisitos vacíos y sin años mínimos cuando la vacante no los pide', async () => {
      await service.create('company-1', {
        ...REQUEST,
        requiredCareers: [],
        minExperienceYears: undefined,
        otherRequirements: [],
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredCareers: [],
          minExperienceYears: null,
          otherRequirements: [],
        }),
      );
    });

    it('valida las tecnologías antes de guardar', async () => {
      skillsService.validateSkillIds.mockRejectedValue(
        new Error('habilidad inválida'),
      );

      await expect(service.create('company-1', REQUEST)).rejects.toThrow(
        'habilidad inválida',
      );
      expect(skillsService.validateSkillIds).toHaveBeenCalledWith(['skill-1']);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rechaza una empresa que no existe', async () => {
      repository.companyExists.mockResolvedValue(false);

      await expect(service.create('missing', REQUEST)).rejects.toBeInstanceOf(
        CompanyNotFoundException,
      );
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
    expect(result[0]).toMatchObject({
      id: 'offer-1',
      company: { name: 'TechBolivia S.R.L.' },
    });
    expect(result[0]).not.toHaveProperty('applicantsCount');
  });

  it('lista las vacantes de una empresa existente sin filtros', async () => {
    const result = await service.listByCompany('company-1');

    expect(repository.findByCompany).toHaveBeenCalledWith('company-1', {
      sortBy: 'publishedAt',
      order: 'desc',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'offer-1',
      company: { name: 'TechBolivia S.R.L.' },
    });
  });

  it.each([
    ['asc', ['one', 'two-old', 'two-new']],
    ['desc', ['two-old', 'two-new', 'one']],
  ] as const)(
    'ordena por postulantes activos en orden %s conservando la fecha en los empates',
    async (order, expected) => {
      repository.findByCompany.mockResolvedValue([
        { ...RECORD, id: 'two-old', _count: { applications: 2 } },
        { ...RECORD, id: 'one', _count: { applications: 1 } },
        { ...RECORD, id: 'two-new', _count: { applications: 2 } },
      ]);

      const result = await service.listByCompany('company-1', {
        sortBy: 'applicants',
        order,
      });

      expect(result.map(({ id }) => id)).toEqual(expected);
    },
  );

  it('pasa los filtros al repositorio al listar las vacantes de una empresa', async () => {
    const filters = {
      modality: JobOfferModality.REMOTE,
      dateFrom: '2026-10-01',
      sortBy: 'publishedAt' as const,
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
        sortBy: 'publishedAt',
        order: 'desc',
      }),
    ).toEqual([]);
  });

  it('rechaza listar vacantes de una empresa que no existe', async () => {
    repository.companyExists.mockResolvedValue(false);

    await expect(service.listByCompany('missing')).rejects.toBeInstanceOf(
      CompanyNotFoundException,
    );
    expect(repository.findByCompany).not.toHaveBeenCalled();
  });

  it('obtiene los detalles de una vacante perteneciente a la empresa', async () => {
    const result = await service.getByCompanyAndId('company-1', 'offer-1');

    expect(repository.findHistoryByCompanyAndId).toHaveBeenCalledWith(
      'company-1',
      'offer-1',
    );
    expect(result).toMatchObject({
      id: 'offer-1',
      languages: 'Español',
      skills: [{ id: 'skill-1', name: 'Docker' }],
    });
  });

  it('responde 404 si la vacante no existe o no pertenece a la empresa', async () => {
    repository.findHistoryByCompanyAndId.mockResolvedValue(null);

    await expect(
      service.getByCompanyAndId('company-1', 'missing'),
    ).rejects.toBeInstanceOf(JobOfferNotFoundException);
  });

  it('propaga los errores del repositorio al consultar los detalles', async () => {
    repository.findHistoryByCompanyAndId.mockRejectedValue(
      new Error('Error de base de datos'),
    );

    await expect(
      service.getByCompanyAndId('company-1', 'offer-1'),
    ).rejects.toThrow('Error de base de datos');
  });

  it('no busca vacantes cuando la empresa no existe', async () => {
    repository.companyExists.mockResolvedValue(false);

    await expect(
      service.getByCompanyAndId('missing', 'offer-1'),
    ).rejects.toBeInstanceOf(CompanyNotFoundException);
    expect(repository.findHistoryByCompanyAndId).not.toHaveBeenCalled();
  });

  it('devuelve el catálogo de tecnologías', async () => {
    expect(await service.listSkillCatalog()).toEqual([
      { id: 'skill-1', name: 'Docker' },
    ]);
  });

  describe('update', () => {
    it('actualiza la vacante de la empresa con los catálogos y habilidades validados', async () => {
      const response = await service.update('company-1', 'offer-1', REQUEST);

      expect(repository.findByCompanyAndId).toHaveBeenCalledWith(
        'company-1',
        'offer-1',
      );
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
        requiredCareers: ['Ingeniería de Sistemas'],
        minExperienceYears: 2,
        otherRequirements: ['Carta de motivación'],
        skillIds: ['skill-1'],
      });
      expect(response.id).toBe('offer-1');
    });

    it('conserva los requisitos guardados cuando la edición no los envía', async () => {
      const request: UpdateJobOfferRequest = {
        ...REQUEST,
        requiredCareers: undefined,
        minExperienceYears: undefined,
        otherRequirements: undefined,
      };

      await service.update('company-1', 'offer-1', request);

      const data = repository.update.mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(data).not.toHaveProperty('requiredCareers');
      expect(data).not.toHaveProperty('minExperienceYears');
      expect(data).not.toHaveProperty('otherRequirements');
      expect(data.title).toBe('DevOps Senior');
    });

    it('rechaza una empresa inexistente sin tocar la vacante', async () => {
      repository.companyExists.mockResolvedValue(false);

      await expect(
        service.update('company-1', 'offer-1', REQUEST),
      ).rejects.toBeInstanceOf(CompanyNotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rechaza una vacante inexistente, eliminada o de otra empresa', async () => {
      repository.findByCompanyAndId.mockResolvedValue(null);

      await expect(
        service.update('company-1', 'offer-1', REQUEST),
      ).rejects.toBeInstanceOf(JobOfferNotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rechaza una modalidad o un tipo de contrato que no están en el catálogo', async () => {
      repository.findCatalogIds.mockResolvedValue({
        modalityId: null,
        contractTypeId: 'contract-1',
        statusId: 'status-1',
      });
      await expect(
        service.update('company-1', 'offer-1', REQUEST),
      ).rejects.toBeInstanceOf(JobOfferCatalogNotFoundException);

      repository.findCatalogIds.mockResolvedValue({
        modalityId: 'modality-1',
        contractTypeId: null,
        statusId: 'status-1',
      });
      await expect(
        service.update('company-1', 'offer-1', REQUEST),
      ).rejects.toBeInstanceOf(JobOfferCatalogNotFoundException);
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
  describe('softDelete', () => {
    it('marca la vacante como Eliminada sin borrarla', async () => {
      await service.softDelete('company-1', 'offer-1');

      expect(repository.findByCompanyAndId).toHaveBeenCalledWith(
        'company-1',
        'offer-1',
      );
      expect(repository.findStatusId).toHaveBeenCalledWith('Eliminada');
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'offer-1',
        'status-deleted',
      );
    });

    it('rechaza una vacante inexistente, ya eliminada o de otra empresa', async () => {
      repository.findByCompanyAndId.mockResolvedValue(null);

      await expect(
        service.softDelete('company-1', 'offer-1'),
      ).rejects.toBeInstanceOf(JobOfferNotFoundException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('falla si el estado Eliminada no está en el catálogo', async () => {
      repository.findStatusId.mockResolvedValue(null);

      await expect(
        service.softDelete('company-1', 'offer-1'),
      ).rejects.toBeInstanceOf(JobOfferCatalogNotFoundException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });
  });
  describe('reopen', () => {
    const CLOSED_RECORD: JobOfferRecord = {
      ...RECORD,
      status: { title: 'Cerrada' },
    };

    beforeEach(() => {
      repository.findByCompanyAndId.mockResolvedValue(CLOSED_RECORD);
      repository.findStatusId.mockResolvedValue('status-published');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('la publica de nuevo con la fecha de hoy sin tocar sus datos', async () => {
      const today = new Date('2026-10-28T14:00:00.000Z');
      vi.useFakeTimers({ now: today });

      const result = await service.reopen('company-1', 'offer-1');

      expect(repository.findByCompanyAndId).toHaveBeenCalledWith(
        'company-1',
        'offer-1',
      );
      expect(repository.findStatusId).toHaveBeenCalledWith('Publicada');
      expect(repository.reopen).toHaveBeenCalledWith(
        'offer-1',
        'status-published',
        today,
        false,
      );
      expect(repository.update).not.toHaveBeenCalled();
      expect(result.status).toBe('Publicada');
    });

    it('limpia la fecha de cierre si la vacante se cerró por vencimiento', async () => {
      const today = new Date('2026-12-17T14:00:00.000Z');
      vi.useFakeTimers({ now: today });
      repository.findByCompanyAndId.mockResolvedValue({
        ...CLOSED_RECORD,
        expiresAt: new Date('2026-12-16T03:59:00.000Z'),
      });

      await service.reopen('company-1', 'offer-1');

      expect(repository.reopen).toHaveBeenCalledWith(
        'offer-1',
        'status-published',
        today,
        true,
      );
    });

    it('conserva la fecha de cierre si todavía no llegó', async () => {
      const today = new Date('2026-12-01T14:00:00.000Z');
      vi.useFakeTimers({ now: today });
      repository.findByCompanyAndId.mockResolvedValue({
        ...CLOSED_RECORD,
        expiresAt: new Date('2026-12-16T03:59:00.000Z'),
      });

      await service.reopen('company-1', 'offer-1');

      expect(repository.reopen).toHaveBeenCalledWith(
        'offer-1',
        'status-published',
        today,
        false,
      );
    });

    it.each(['Publicada', 'Eliminada', 'Borrador'])(
      'rechaza reabrir una vacante en estado %s',
      async (status) => {
        repository.findByCompanyAndId.mockResolvedValue({
          ...RECORD,
          status: { title: status },
        });

        await expect(
          service.reopen('company-1', 'offer-1'),
        ).rejects.toBeInstanceOf(JobOfferNotReopenableException);
        expect(repository.reopen).not.toHaveBeenCalled();
      },
    );

    it('rechaza una vacante inexistente o de otra empresa', async () => {
      repository.findByCompanyAndId.mockResolvedValue(null);

      await expect(
        service.reopen('company-1', 'offer-1'),
      ).rejects.toBeInstanceOf(JobOfferNotFoundException);
      expect(repository.reopen).not.toHaveBeenCalled();
    });

    it('rechaza una empresa inexistente sin buscar la vacante', async () => {
      repository.companyExists.mockResolvedValue(false);

      await expect(
        service.reopen('company-1', 'offer-1'),
      ).rejects.toBeInstanceOf(CompanyNotFoundException);
      expect(repository.findByCompanyAndId).not.toHaveBeenCalled();
    });

    it('falla si el estado Publicada no está en el catálogo', async () => {
      repository.findStatusId.mockResolvedValue(null);

      await expect(
        service.reopen('company-1', 'offer-1'),
      ).rejects.toBeInstanceOf(JobOfferCatalogNotFoundException);
      expect(repository.reopen).not.toHaveBeenCalled();
    });
  });
  describe('closeExpiredOffers', () => {
    const NOW = new Date('2026-12-16T04:00:00.000Z');

    beforeEach(() => {
      repository.findStatusId.mockImplementation((title: string) =>
        Promise.resolve(
          title === 'Publicada' ? 'status-published' : 'status-closed',
        ),
      );
    });

    it('pasa de Publicada a Cerrada las vencidas y devuelve cuántas cerró', async () => {
      repository.closeExpired.mockResolvedValue(3);

      const closed = await service.closeExpiredOffers(NOW);

      expect(closed).toBe(3);
      expect(repository.closeExpired).toHaveBeenCalledWith(
        'status-published',
        'status-closed',
        NOW,
      );
    });

    it('usa la hora actual si no recibe una', async () => {
      vi.useFakeTimers({ now: NOW });
      try {
        await service.closeExpiredOffers();
        expect(repository.closeExpired).toHaveBeenCalledWith(
          'status-published',
          'status-closed',
          NOW,
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it.each(['Publicada', 'Cerrada'])(
      'falla sin tocar nada si el estado %s no está en el catálogo',
      async (missing) => {
        repository.findStatusId.mockImplementation((title: string) =>
          Promise.resolve(
            title === missing ? null : `status-${title.toLowerCase()}`,
          ),
        );

        await expect(service.closeExpiredOffers(NOW)).rejects.toBeInstanceOf(
          JobOfferCatalogNotFoundException,
        );
        expect(repository.closeExpired).not.toHaveBeenCalled();
      },
    );
  });

  describe('findOfferSummary', () => {
    it('expone título, empresa y nombre de la empresa de la vacante', async () => {
      repository.findOfferSummary.mockResolvedValue({
        id: 'offer-1',
        title: 'Dev Backend',
        companyId: 'company-1',
        company: { title: 'Empresa A' },
      });

      await expect(service.findOfferSummary('offer-1')).resolves.toEqual({
        id: 'offer-1',
        title: 'Dev Backend',
        companyId: 'company-1',
        companyName: 'Empresa A',
      });
    });

    it('retorna null si la vacante no existe', async () => {
      repository.findOfferSummary.mockResolvedValue(null);

      await expect(service.findOfferSummary('missing')).resolves.toBeNull();
    });
  });
});
