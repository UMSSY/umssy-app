import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ApplicationStatus } from '../types/applications.types.js';

describe('ApplicationsRepository', () => {
  let repository: ApplicationsRepository;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      jobApplication: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<ApplicationsRepository>(ApplicationsRepository);
  });

  describe('findByUserId', () => {
    it('debe consultar con filtros por defecto y sort por createdAt', async () => {
      prismaMock.jobApplication.findMany.mockResolvedValue([]);

      // 1. Pasar un objeto de query válido con sortOrder
      await repository.findByUserId('user-1', { sortOrder: 'desc' });

      expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        include: {
          status: true,
          jobOffer: {
            include: { company: true },
          },
        },
      });
    });

    it('debe aplicar filtros por status y sort por vacancy', async () => {
      prismaMock.jobApplication.findMany.mockResolvedValue([]);

      // 2. Usar la constante del enum ApplicationStatus.IN_REVIEW
      await repository.findByUserId('user-1', {
        status: ApplicationStatus.IN_REVIEW,
        sortBy: 'vacancy',
        sortOrder: 'asc',
      });

      expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: { title: ApplicationStatus.IN_REVIEW },
        },
        orderBy: { jobOffer: { title: 'asc' } },
        include: {
          status: true,
          jobOffer: {
            include: { company: true },
          },
        },
      });
    });

    it('debe aplicar sort por company, affinity y status', async () => {
      prismaMock.jobApplication.findMany.mockResolvedValue([]);

      await repository.findByUserId('user-1', { sortBy: 'company', sortOrder: 'asc' });
      await repository.findByUserId('user-1', { sortBy: 'affinity', sortOrder: 'desc' });
      await repository.findByUserId('user-1', { sortBy: 'status', sortOrder: 'asc' });

      expect(prismaMock.jobApplication.findMany).toHaveBeenCalledTimes(3);
    });
  });

  describe('findById', () => {
    it('debe buscar por id', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue({ id: 'app-1' });

      const result = await repository.findById('app-1');

      expect(prismaMock.jobApplication.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        include: {
          status: true,
          jobOffer: {
            include: { company: true },
          },
        },
      });
      expect(result).toEqual({ id: 'app-1' });
    });
  });

  describe('updateStatus', () => {
    it('debe actualizar el estado', async () => {
      prismaMock.jobApplication.update.mockResolvedValue({ id: 'app-1', statusId: ApplicationStatus.WITHDRAWN });

      const result = await repository.updateStatus('app-1', ApplicationStatus.WITHDRAWN);

      expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: { statusId: ApplicationStatus.WITHDRAWN },
      });
      expect(result).toEqual({ id: 'app-1', statusId: ApplicationStatus.WITHDRAWN });
    });
  });
});