import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ApplicationsService } from '../services/applications.service.js';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import { ApplicationStatus } from '../types/applications.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';

describe('ApplicationsService (T5.1 & T5.2)', () => {
  let service: ApplicationsService;
  let repositoryMock: any;

  beforeEach(async () => {
    repositoryMock = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
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

      const result = await service.findMyApplications('user-1', { sortOrder: 'desc' });

      expect(result).toEqual([]);
    });

    it('debe mapear postulaciones y habilitar retiro segun el estado', async () => {
      const mockApps = [
        {
          id: 'app-1',
          userId: 'user-1',
          status: { title: ApplicationStatus.IN_REVIEW },
          createdAt: new Date(),
          jobOffer: { title: 'Dev', company: { title: 'Empresa A' } },
        },
        {
          id: 'app-2',
          userId: 'user-1',
          status: { title: ApplicationStatus.ACCEPTED },
          createdAt: new Date(),
          jobOffer: { title: 'Dev 2', company: { title: 'Empresa B' } },
        },
      ];

      repositoryMock.findByUserId.mockResolvedValue(mockApps);

      const result = await service.findMyApplications('user-1', { sortOrder: 'desc' });

      expect(result).toHaveLength(2);
      expect(result[0].canWithdraw).toBe(true);
      expect(result[1].canWithdraw).toBe(false);
    });
  });

  describe('withdrawApplication (AC-05.4)', () => {
    it('debe cambiar estado a Retirada', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: { title: ApplicationStatus.IN_REVIEW },
      });

      repositoryMock.updateStatus.mockResolvedValue({
        id: 'app-1',
        statusId: ApplicationStatus.WITHDRAWN,
      });

      const result = await service.withdrawApplication('app-1', 'user-1');

      expect(repositoryMock.updateStatus).toHaveBeenCalledWith('app-1', ApplicationStatus.WITHDRAWN);
      expect(result).toEqual({
        id: 'app-1',
        statusId: ApplicationStatus.WITHDRAWN,
      });
    });

    it('lanza ApplicationNotFoundException si no existe', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.withdrawApplication('app-99', 'user-1')).rejects.toThrow(ApplicationNotFoundException);
    });

    it('lanza ApplicationForbiddenException si es de otro usuario', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-2',
        status: { title: ApplicationStatus.IN_REVIEW },
      });

      await expect(service.withdrawApplication('app-1', 'user-1')).rejects.toThrow(ApplicationForbiddenException);
    });

    it('lanza ApplicationNotWithdrawableException si esta Aceptada', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: { title: ApplicationStatus.ACCEPTED },
      });

      await expect(service.withdrawApplication('app-1', 'user-1')).rejects.toThrow(ApplicationNotWithdrawableException);
    });
  });
});