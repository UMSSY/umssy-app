import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { UsersRepository } from '../repositories/users.repository.js';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  const prismaMock = { user: { findMany: vi.fn() } };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaMock.user.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  describe('findActiveRecruitersByCompany', () => {
    it('trae solo los usuarios activos de la empresa con rol empresa vigente, en orden estable', async () => {
      const recruiters = [{ id: 'rec-1', firstName: 'Ana', lastName: 'Rojas' }];
      prismaMock.user.findMany.mockResolvedValue(recruiters);

      const result =
        await repository.findActiveRecruitersByCompany('company-1');

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'company-1',
          isActive: true,
          roles: {
            some: {
              deletedAt: null,
              startAt: { lte: expect.any(Date) },
              role: { name: 'empresa' },
            },
          },
        },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
      });
      expect(result).toEqual(recruiters);
    });
  });
});
