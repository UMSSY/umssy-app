import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ApplicationMapper } from '../mappers/application.mapper.js';
import { JobRecommendationsService } from '../../matching/services/job-recommendations.service.js';
import { ApplicationsService } from '../services/applications.service.js';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import { ApplicationStatus } from '../types/applications.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';

describe('ApplicationsService (T5.1 & T5.2)', () => {
  let service: ApplicationsService;
  let repositoryMock: {
    findByUserId: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    withdraw: ReturnType<typeof vi.fn>;
    reactivateApplication: ReturnType<typeof vi.fn>;
  };
  const matching = { scoresForOffers: vi.fn() };

  beforeEach(async () => {
    matching.scoresForOffers.mockReset().mockResolvedValue(new Map());
    repositoryMock = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      withdraw: vi.fn().mockResolvedValue({ count: 1 }),
      reactivateApplication: vi.fn().mockResolvedValue({ count: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        ApplicationMapper,
        { provide: JobRecommendationsService, useValue: matching },
        {
          provide: ApplicationsRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('findMyApplications (AC-05.1, AC-05.2, AC-05.7)', () => {
    it('debe retornar lista vacia si no hay postulaciones', async () => {
      repositoryMock.findByUserId.mockResolvedValue([]);

      const result = await service.findMyApplications('user-1', {
        sortOrder: 'desc',
      });

      expect(result).toEqual([]);
      expect(matching.scoresForOffers).not.toHaveBeenCalled();
    });

    it('debe devolver el contrato del cliente con fechas ISO y afinidad calculada', async () => {
      const mockApps = [
        {
          id: 'app-1',
          jobOfferId: 'offer-1',
          status: { title: ApplicationStatus.IN_REVIEW },
          appliedAt: new Date('2026-10-29T12:00:00.000Z'),
          jobOffer: { title: 'Dev', company: { title: 'Empresa A' } },
        },
        {
          id: 'app-2',
          jobOfferId: 'offer-2',
          status: { title: ApplicationStatus.ACCEPTED },
          appliedAt: new Date('2026-10-29T12:00:00.000Z'),
          jobOffer: { title: 'Dev 2', company: { title: 'Empresa B' } },
        },
      ];

      repositoryMock.findByUserId.mockResolvedValue(mockApps);
      matching.scoresForOffers.mockResolvedValue(
        new Map([
          ['offer-1', 85],
          ['offer-2', 40],
        ]),
      );

      const result = await service.findMyApplications('user-1', {
        sortOrder: 'desc',
      });

      expect(matching.scoresForOffers).toHaveBeenCalledWith('user-1', [
        'offer-1',
        'offer-2',
      ]);
      expect(result).toEqual([
        {
          id: 'app-1',
          jobOfferId: 'offer-1',
          vacancyTitle: 'Dev',
          companyName: 'Empresa A',
          status: ApplicationStatus.IN_REVIEW,
          affinityPercentage: 85,
          appliedDate: '2026-10-29T12:00:00.000Z',
        },
        {
          id: 'app-2',
          jobOfferId: 'offer-2',
          vacancyTitle: 'Dev 2',
          companyName: 'Empresa B',
          status: ApplicationStatus.ACCEPTED,
          affinityPercentage: 40,
          appliedDate: '2026-10-29T12:00:00.000Z',
        },
      ]);
      const sorted = await service.findMyApplications('user-1', {
        sortBy: 'affinity',
        sortOrder: 'asc',
      });
      expect(sorted.map(({ id }) => id)).toEqual(['app-2', 'app-1']);
    });
  });

  describe('ordenamiento por estado (AC-13.5 y AC-13.6)', () => {
    it('respeta la prioridad de estados y su sentido inverso', async () => {
      const statuses = [
        ApplicationStatus.REJECTED,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.IN_REVIEW,
        ApplicationStatus.INTERVIEW,
      ];

      repositoryMock.findByUserId.mockResolvedValue(
        statuses.map((status, index) => ({
          id: `app-${index}`,
          jobOfferId: `offer-${index}`,
          status: { title: status },
          appliedAt: new Date('2026-11-10T12:00:00.000Z'),
          jobOffer: {
            title: `Vacante ${index}`,
            company: { title: 'Empresa' },
          },
        })),
      );

      const ascending = await service.findMyApplications('user-1', {
        sortBy: 'status',
        sortOrder: 'asc',
      });

      expect(ascending.map((item) => item.status)).toEqual([
        ApplicationStatus.IN_REVIEW,
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.REJECTED,
      ]);

      const descending = await service.findMyApplications('user-1', {
        sortBy: 'status',
        sortOrder: 'desc',
      });

      expect(descending.map((item) => item.status)).toEqual([
        ApplicationStatus.REJECTED,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.IN_REVIEW,
      ]);
    });
  });

  describe('desempates de HU-13', () => {
    const applications = [
      {
        id: 'app-3',
        jobOfferId: 'offer-3',
        status: { title: ApplicationStatus.IN_REVIEW },
        appliedAt: new Date('2026-11-10T10:00:00.000Z'),
        jobOffer: {
          title: 'Python Developer',
          company: { title: 'Empresa C' },
        },
      },
      {
        id: 'app-2',
        jobOfferId: 'offer-2',
        status: { title: ApplicationStatus.IN_REVIEW },
        appliedAt: new Date('2026-11-12T10:00:00.000Z'),
        jobOffer: {
          title: 'Zoología',
          company: { title: 'Empresa B' },
        },
      },
      {
        id: 'app-1',
        jobOfferId: 'offer-1',
        status: { title: ApplicationStatus.IN_REVIEW },
        appliedAt: new Date('2026-11-12T10:00:00.000Z'),
        jobOffer: {
          title: 'Analista',
          company: { title: 'Empresa A' },
        },
      },
    ];

    it('muestra fechas recientes primero y desempata por título', async () => {
      repositoryMock.findByUserId.mockResolvedValue(applications);

      const result = await service.findMyApplications('user-1', {
        sortOrder: 'desc',
      });

      expect(result.map((item) => item.id)).toEqual([
        'app-1',
        'app-2',
        'app-3',
      ]);
    });

    it('desempata afinidades iguales por fecha y título', async () => {
      repositoryMock.findByUserId.mockResolvedValue(applications);
      matching.scoresForOffers.mockResolvedValue(
        new Map([
          ['offer-1', 50],
          ['offer-2', 50],
          ['offer-3', 50],
        ]),
      );

      const result = await service.findMyApplications('user-1', {
        sortBy: 'affinity',
        sortOrder: 'desc',
      });

      expect(result.map((item) => item.id)).toEqual([
        'app-1',
        'app-2',
        'app-3',
      ]);
    });
  });

  describe('withdrawApplication (AC-05.4)', () => {
    it('debe cambiar estado a Retirada', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: { title: ApplicationStatus.IN_REVIEW },
      });

      const result = await service.withdrawApplication('app-1', 'user-1');

      expect(repositoryMock.withdraw).toHaveBeenCalledWith(
        'app-1',
        'user-1',
        [ApplicationStatus.IN_REVIEW, ApplicationStatus.INTERVIEW],
        ApplicationStatus.WITHDRAWN,
      );
      expect(result).toBeUndefined();
    });

    it('lanza ApplicationNotFoundException si no existe', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.withdrawApplication('app-99', 'user-1'),
      ).rejects.toThrow(ApplicationNotFoundException);
      expect(repositoryMock.withdraw).not.toHaveBeenCalled();
    });

    it('lanza ApplicationForbiddenException si es de otro usuario', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-2',
        status: { title: ApplicationStatus.IN_REVIEW },
      });

      await expect(
        service.withdrawApplication('app-1', 'user-1'),
      ).rejects.toThrow(ApplicationForbiddenException);
      expect(repositoryMock.withdraw).not.toHaveBeenCalled();
    });

    it('lanza ApplicationNotWithdrawableException si esta Aceptada', async () => {
      repositoryMock.withdraw.mockResolvedValue({ count: 0 });
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: { title: ApplicationStatus.ACCEPTED },
      });

      await expect(
        service.withdrawApplication('app-1', 'user-1'),
      ).rejects.toThrow(ApplicationNotWithdrawableException);
    });
    it('rechaza el retiro si el estado cambió después de consultar la postulación', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: { title: ApplicationStatus.IN_REVIEW },
      });
      repositoryMock.withdraw.mockResolvedValue({ count: 0 });
      await expect(
        service.withdrawApplication('app-1', 'user-1'),
      ).rejects.toThrow(ApplicationNotWithdrawableException);
    });
  });

  describe('reactivateApplication', () => {
    it('reactiva una postulación propia conservando el identificador', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: { title: ApplicationStatus.WITHDRAWN },
      });

      await expect(
        service.reactivateApplication('app-1', 'user-1'),
      ).resolves.toBeUndefined();

      expect(repositoryMock.reactivateApplication).toHaveBeenCalledWith(
        'app-1',
        'user-1',
        expect.any(Date),
      );
    });

    it('rechaza una postulación inexistente', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.reactivateApplication('app-1', 'user-1'),
      ).rejects.toBeInstanceOf(ApplicationNotFoundException);

      expect(repositoryMock.reactivateApplication).not.toHaveBeenCalled();
    });

    it('rechaza la reactivación de una postulación ajena', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-2',
        status: { title: ApplicationStatus.WITHDRAWN },
      });

      await expect(
        service.reactivateApplication('app-1', 'user-1'),
      ).rejects.toBeInstanceOf(ApplicationForbiddenException);

      expect(repositoryMock.reactivateApplication).not.toHaveBeenCalled();
    });

    it('rechaza una reactivación cuando ninguna fila puede actualizarse', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: { title: ApplicationStatus.WITHDRAWN },
      });
      repositoryMock.reactivateApplication.mockResolvedValue({ count: 0 });

      await expect(
        service.reactivateApplication('app-1', 'user-1'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repositoryMock.reactivateApplication).toHaveBeenCalledOnce();
    });
  });

});
