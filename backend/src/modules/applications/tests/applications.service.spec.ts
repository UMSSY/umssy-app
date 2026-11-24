import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ApplicationMapper } from '../mappers/application.mapper.js';
import { JobRecommendationsService } from '../../matching/services/job-recommendations.service.js';
import { ApplicationsService } from '../services/applications.service.js';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { UsersService } from '../../users/services/users.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { ApplicationStatus } from '../types/applications.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';
import { ApplicationNotReactivableException } from '../exceptions/application-not-reactivable.exception.js';
import { ApplicationContactRestrictedException } from '../exceptions/application-contact-restricted.exception.js';

describe('ApplicationsService (T5.1 & T5.2 & HU-15)', () => {
  let service: ApplicationsService;
  let repositoryMock: {
    findByUserId: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    withdraw: ReturnType<typeof vi.fn>;
    reactivateApplication: ReturnType<typeof vi.fn>;
    findApplicationDecisionContext: ReturnType<typeof vi.fn>;
  };
  let jobOffersMock: { findOfferSummary: ReturnType<typeof vi.fn> };
  let usersMock: { findActiveRecruitersByCompany: ReturnType<typeof vi.fn> };
  let notificationsMock: { notify: ReturnType<typeof vi.fn> };
  let configMock: { getOrThrow: ReturnType<typeof vi.fn> };
  const matching = { scoresForOffers: vi.fn() };

  beforeEach(async () => {
    matching.scoresForOffers.mockReset().mockResolvedValue(new Map());
    repositoryMock = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      withdraw: vi.fn().mockResolvedValue({ count: 1 }),
      reactivateApplication: vi.fn().mockResolvedValue({ count: 1 }),
      findApplicationDecisionContext: vi.fn(),
    };

    jobOffersMock = { findOfferSummary: vi.fn() };

    usersMock = { findActiveRecruitersByCompany: vi.fn() };

    notificationsMock = {
      notify: vi.fn().mockResolvedValue({
        inAppCount: 1,
        pushStatus: 'skipped',
        emailStatus: 'sent',
      }),
    };

    configMock = {
      getOrThrow: vi.fn().mockReturnValue('https://umssy.edu.bo'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        ApplicationMapper,
        { provide: JobRecommendationsService, useValue: matching },
        { provide: ApplicationsRepository, useValue: repositoryMock },
        { provide: NotificationsService, useValue: notificationsMock },
        { provide: ConfigService, useValue: configMock },
        { provide: JobOffersService, useValue: jobOffersMock },
        { provide: UsersService, useValue: usersMock },
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

    it('no oculta errores inesperados del servicio de afinidad', async () => {
      repositoryMock.findByUserId.mockResolvedValue([
        { id: 'app-1', jobOfferId: 'offer-1' },
      ]);
      matching.scoresForOffers.mockRejectedValue(new Error('fallo en el calculo'));
      await expect(service.findMyApplications('user-1', { sortOrder: 'desc' }))
        .rejects.toThrow('fallo en el calculo');
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
    it('reactiva la postulación de su dueño', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
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

    it('lanza ApplicationNotFoundException si no existe', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.reactivateApplication('app-99', 'user-1'),
      ).rejects.toThrow(ApplicationNotFoundException);
      expect(repositoryMock.reactivateApplication).not.toHaveBeenCalled();
    });

    it('lanza ApplicationForbiddenException si es de otro usuario', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-2',
      });

      await expect(
        service.reactivateApplication('app-1', 'user-1'),
      ).rejects.toThrow(ApplicationForbiddenException);
      expect(repositoryMock.reactivateApplication).not.toHaveBeenCalled();
    });

    it('lanza ApplicationNotReactivableException con estado 409 si ya no se puede reactivar', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
      });
      repositoryMock.reactivateApplication.mockResolvedValue({ count: 0 });

      const error: unknown = await service
        .reactivateApplication('app-1', 'user-1')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ApplicationNotReactivableException);
      expect(error).toMatchObject({
        statusCode: 409,
        code: 'APPLICATION_NOT_REACTIVABLE',
      });
      expect(error).toHaveProperty(
        'message',
        'La postulación no puede reactivarse en su estado actual o la vacante ya no está disponible.',
      );
    });
  });

  describe('notifyStateChanged (HU-15)', () => {
    const base = {
      recipientId: 'user-1',
      applicationId: 'app-1',
      jobTitle: 'Dev',
      companyName: 'Empresa A',
    };

    it('AC-15.1: debe enviar la notificación APPLICATION_STATUS_CHANGED cuando el reclutador cambia el estado', async () => {
      await service.notifyStateChanged({
        ...base,
        previousStatus: ApplicationStatus.IN_REVIEW,
        newStatus: ApplicationStatus.INTERVIEW,
      });

      expect(notificationsMock.notify).toHaveBeenCalledTimes(1);
      expect(notificationsMock.notify).toHaveBeenCalledWith({
        recipientIds: ['user-1'],
        type: NotificationType.APPLICATION_STATUS_CHANGED,
        payload: {
          vacancyTitle: 'Dev',
          companyName: 'Empresa A',
          newStatus: 'INTERVIEW',
        },
        actionUrl: 'https://umssy.edu.bo/vacancies/my-applications',
      });
    });

    it.each([
      [ApplicationStatus.ACCEPTED, 'ACCEPTED'],
      [ApplicationStatus.REJECTED, 'REJECTED'],
    ])(
      'mapea el estado de BD "%s" al código del enum %s',
      async (newStatus, code) => {
        await service.notifyStateChanged({
          ...base,
          previousStatus: ApplicationStatus.INTERVIEW,
          newStatus,
        });

        expect(notificationsMock.notify).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ newStatus: code }),
          }),
        );
      },
    );

    it('AC-15.4: withdrawApplication NO genera ninguna notificación de cambio de estado', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: { title: ApplicationStatus.IN_REVIEW },
      });

      await service.withdrawApplication('app-1', 'user-1');

      expect(repositoryMock.withdraw).toHaveBeenCalled();
      expect(notificationsMock.notify).not.toHaveBeenCalled();
    });

    it('AC-15.4: no notifica cuando el nuevo estado es Retirada', async () => {
      await service.notifyStateChanged({
        ...base,
        previousStatus: ApplicationStatus.IN_REVIEW,
        newStatus: ApplicationStatus.WITHDRAWN,
      });

      expect(notificationsMock.notify).not.toHaveBeenCalled();
    });

    it('D-14: no notifica si el estado nuevo es idéntico al anterior', async () => {
      await service.notifyStateChanged({
        ...base,
        previousStatus: ApplicationStatus.IN_REVIEW,
        newStatus: ApplicationStatus.IN_REVIEW,
      });

      expect(notificationsMock.notify).not.toHaveBeenCalled();
    });

    it('no propaga el error si el envío de la notificación falla', async () => {
      notificationsMock.notify.mockRejectedValueOnce(new Error('push down'));

      await expect(
        service.notifyStateChanged({
          ...base,
          previousStatus: ApplicationStatus.IN_REVIEW,
          newStatus: ApplicationStatus.ACCEPTED,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('findApplicationDecisionContext', () => {
    it('compone el contexto con datos de la vacante obtenidos de JobOffersService', async () => {
      repositoryMock.findApplicationDecisionContext.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        jobOfferId: 'job-1',
        status: { title: ApplicationStatus.INTERVIEW },
      });
      jobOffersMock.findOfferSummary.mockResolvedValue({
        id: 'job-1',
        title: 'Dev Backend',
        companyId: 'company-1',
        companyName: 'Empresa A',
      });

      await expect(
        service.findApplicationDecisionContext('app-1'),
      ).resolves.toEqual({
        id: 'app-1',
        userId: 'user-1',
        statusTitle: ApplicationStatus.INTERVIEW,
        jobOfferId: 'job-1',
        companyId: 'company-1',
        jobTitle: 'Dev Backend',
        companyName: 'Empresa A',
      });
      expect(jobOffersMock.findOfferSummary).toHaveBeenCalledWith('job-1');
    });

    it('retorna null si la postulación no existe sin consultar la vacante', async () => {
      repositoryMock.findApplicationDecisionContext.mockResolvedValue(null);

      await expect(
        service.findApplicationDecisionContext('missing'),
      ).resolves.toBeNull();
      expect(jobOffersMock.findOfferSummary).not.toHaveBeenCalled();
    });

    it('retorna null si la vacante ya no existe', async () => {
      repositoryMock.findApplicationDecisionContext.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        jobOfferId: 'job-1',
        status: { title: ApplicationStatus.INTERVIEW },
      });
      jobOffersMock.findOfferSummary.mockResolvedValue(null);

      await expect(
        service.findApplicationDecisionContext('app-1'),
      ).resolves.toBeNull();
    });
  });

  describe('getApplicationContact', () => {
    const offer = {
      id: 'job-1',
      title: 'Dev Backend',
      companyId: 'company-1',
      companyName: 'Empresa A',
    };

    function mockApplication(statusTitle: string, userId = 'user-1') {
      repositoryMock.findApplicationDecisionContext.mockResolvedValue({
        id: 'app-1',
        userId,
        jobOfferId: 'job-1',
        status: { title: statusTitle },
      });
      jobOffersMock.findOfferSummary.mockResolvedValue(offer);
    }

    it('compone la respuesta con la vacante y los reclutadores del dominio de usuarios', async () => {
      mockApplication(ApplicationStatus.IN_REVIEW);
      usersMock.findActiveRecruitersByCompany.mockResolvedValue([
        { id: 'rec-1', firstName: 'Ana', lastName: 'Rojas' },
        { id: 'rec-2', firstName: 'Luis', lastName: 'Vera' },
      ]);

      const result = await service.getApplicationContact('app-1', 'user-1');

      expect(usersMock.findActiveRecruitersByCompany).toHaveBeenCalledWith(
        'company-1',
      );
      expect(result).toEqual({
        applicationId: 'app-1',
        jobOfferId: 'job-1',
        vacancyTitle: 'Dev Backend',
        companyId: 'company-1',
        companyName: 'Empresa A',
        recruiters: [
          { id: 'rec-1', fullName: 'Ana Rojas' },
          { id: 'rec-2', fullName: 'Luis Vera' },
        ],
      });
    });

    it('responde con lista vacía de reclutadores cuando la empresa no tiene ninguno activo', async () => {
      mockApplication(ApplicationStatus.ACCEPTED);
      usersMock.findActiveRecruitersByCompany.mockResolvedValue([]);

      const result = await service.getApplicationContact('app-1', 'user-1');

      expect(result.recruiters).toEqual([]);
    });

    it('lanza not found si la postulación no existe', async () => {
      repositoryMock.findApplicationDecisionContext.mockResolvedValue(null);

      await expect(
        service.getApplicationContact('missing', 'user-1'),
      ).rejects.toBeInstanceOf(ApplicationNotFoundException);
      expect(usersMock.findActiveRecruitersByCompany).not.toHaveBeenCalled();
    });

    it('lanza not found si la postulación pertenece a otro usuario', async () => {
      mockApplication(ApplicationStatus.IN_REVIEW, 'user-2');

      await expect(
        service.getApplicationContact('app-1', 'user-1'),
      ).rejects.toBeInstanceOf(ApplicationNotFoundException);
      expect(usersMock.findActiveRecruitersByCompany).not.toHaveBeenCalled();
    });

    it('restringe el contacto cuando la postulación está retirada o rechazada', async () => {
      mockApplication(ApplicationStatus.WITHDRAWN);
      await expect(
        service.getApplicationContact('app-1', 'user-1'),
      ).rejects.toBeInstanceOf(ApplicationContactRestrictedException);

      mockApplication(ApplicationStatus.REJECTED);
      await expect(
        service.getApplicationContact('app-1', 'user-1'),
      ).rejects.toBeInstanceOf(ApplicationContactRestrictedException);
      expect(usersMock.findActiveRecruitersByCompany).not.toHaveBeenCalled();
    });
  });
});
