import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ApplicationStatus } from '../types/applications.types.js';

describe('ApplicationsRepository', () => {
  let repository: ApplicationsRepository;
  const transaction = {
    jobApplicationStatus: { findUniqueOrThrow: vi.fn() },
    jobApplication: { updateMany: vi.fn() },
  };
  const prismaMock = {
    jobApplication: { findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(
      async (operation: (tx: typeof transaction) => Promise<unknown>) =>
        operation(transaction),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaMock.jobApplication.findMany.mockResolvedValue([]);
    transaction.jobApplicationStatus.findUniqueOrThrow.mockResolvedValue({
      id: 'withdrawn-status-id',
    });
    transaction.jobApplication.updateMany.mockResolvedValue({ count: 1 });

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
    it('debe consultar con filtros por defecto y sort por appliedAt', async () => {
      prismaMock.jobApplication.findMany.mockResolvedValue([]);

      await repository.findByUserId('user-1', { sortOrder: 'desc' });

      expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          jobOfferId: true,
          appliedAt: true,
          status: { select: { title: true } },
          jobOffer: {
            select: { title: true, company: { select: { title: true } } },
          },
        },
      });
    });

    it('debe aplicar filtros por status y sort por vacancy', async () => {
      prismaMock.jobApplication.findMany.mockResolvedValue([]);

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
        orderBy: [{ jobOffer: { title: 'asc' } }, { id: 'asc' }],
        select: {
          id: true,
          jobOfferId: true,
          appliedAt: true,
          status: { select: { title: true } },
          jobOffer: {
            select: { title: true, company: { select: { title: true } } },
          },
        },
      });
    });

    it('debe aplicar sort por company, affinity y status', async () => {
      prismaMock.jobApplication.findMany.mockResolvedValue([]);

      await repository.findByUserId('user-1', {
        sortBy: 'company',
        sortOrder: 'asc',
      });
      await repository.findByUserId('user-1', {
        sortBy: 'affinity',
        sortOrder: 'desc',
      });
      await repository.findByUserId('user-1', {
        sortBy: 'status',
        sortOrder: 'asc',
      });

      expect(prismaMock.jobApplication.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          orderBy: [{ jobOffer: { company: { title: 'asc' } } }, { id: 'asc' }],
        }),
      );
      expect(prismaMock.jobApplication.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
        }),
      );
      expect(prismaMock.jobApplication.findMany).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          orderBy: [{ status: { title: 'asc' } }, { id: 'asc' }],
        }),
      );
    });
  });

  describe('findById', () => {
    it('debe buscar por id', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue({ id: 'app-1' });

      const result = await repository.findById('app-1');

      expect(prismaMock.jobApplication.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        select: { id: true, userId: true, status: { select: { title: true } } },
      });
      expect(result).toEqual({ id: 'app-1' });
    });
  });

  describe('withdraw', () => {
    it('resuelve el UUID del catálogo y condiciona el retiro al usuario y al estado actual', async () => {
      const statuses = [
        ApplicationStatus.IN_REVIEW,
        ApplicationStatus.INTERVIEW,
      ];
      const result = await repository.withdraw(
        'app-1',
        'user-1',
        statuses,
        ApplicationStatus.WITHDRAWN,
      );

      expect(prismaMock.$transaction).toHaveBeenCalledOnce();
      expect(
        transaction.jobApplicationStatus.findUniqueOrThrow,
      ).toHaveBeenCalledWith({
        where: { title: ApplicationStatus.WITHDRAWN },
        select: { id: true },
      });
      expect(transaction.jobApplication.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'app-1',
          userId: 'user-1',
          status: { title: { in: statuses } },
        },
        data: { statusId: 'withdrawn-status-id' },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
