import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { APPROVED_GRADUATE_CAREER_SELECT } from '../constants/approved-graduate-career-select.constants.js';
import { APPROVED_GRADUATE_USER_SELECT } from '../constants/approved-graduate-user-select.constants.js';
import { ApprovedGraduateCareersRepository } from '../repositories/approved-graduate-careers.repository.js';
import { ApprovedGraduateCareersService } from '../services/approved-graduate-careers.service.js';

function createService(records: unknown[] = []) {
  const findMany = vi.fn().mockResolvedValue(records);
  const repository = new ApprovedGraduateCareersRepository({
    accessRequest: { findMany },
  } as unknown as PrismaService);
  return { findMany, service: new ApprovedGraduateCareersService(repository) };
}

describe('ApprovedGraduateCareersService', () => {
  it('devuelve la carrera aprobada de cada titulado solicitado', async () => {
    const { findMany, service } = createService([
      { approvedUserId: 'user-1', careerId: 'career-1' },
      { approvedUserId: null, careerId: 'career-2' },
    ]);

    await expect(service.findByUserIds(['user-1'])).resolves.toEqual([
      { userId: 'user-1', careerId: 'career-1' },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { approvedUserId: { in: ['user-1'] } },
      select: APPROVED_GRADUATE_CAREER_SELECT,
    });
  });

  it('no consulta cuando no hay titulados', async () => {
    const { findMany, service } = createService();

    await expect(service.findByUserIds([])).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('devuelve los titulados aprobados de la carrera y gestión indicadas', async () => {
    const { findMany, service } = createService([
      { approvedUserId: 'user-1' },
      { approvedUserId: null },
    ]);

    await expect(
      service.findApprovedUserIds({ careerId: 'career-1', graduationYear: 2020 }),
    ).resolves.toEqual(['user-1']);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        approvedUserId: { not: null },
        careerId: 'career-1',
        graduationYear: 2020,
      },
      select: APPROVED_GRADUATE_USER_SELECT,
    });
  });

  it('no filtra por carrera ni gestión cuando no se indican', async () => {
    const { findMany, service } = createService([]);

    await service.findApprovedUserIds({ careerId: null, graduationYear: null });

    expect(findMany).toHaveBeenCalledWith({
      where: { approvedUserId: { not: null } },
      select: APPROVED_GRADUATE_USER_SELECT,
    });
  });
});
