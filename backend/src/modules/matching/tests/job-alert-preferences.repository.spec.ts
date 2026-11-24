import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobAlertMode } from '../enums/job-alert-mode.enum.js';
import { JobAlertPreferencesRepository } from '../repositories/job-alert-preferences.repository.js';

describe('JobAlertPreferencesRepository', () => {
  const prisma = {
    jobOfferNotificationPreference: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  };
  let repository: JobAlertPreferencesRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repository = new JobAlertPreferencesRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('devuelve el modo guardado de la persona', async () => {
    prisma.jobOfferNotificationPreference.findUnique.mockResolvedValue({
      mode: { title: 'MATCHING' },
    });

    await expect(repository.findMode('user-1')).resolves.toBe('MATCHING');
    expect(prisma.jobOfferNotificationPreference.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { mode: { select: { title: true } } },
    });
  });

  it('devuelve null cuando la persona nunca eligió', async () => {
    prisma.jobOfferNotificationPreference.findUnique.mockResolvedValue(null);

    await expect(repository.findMode('user-1')).resolves.toBeNull();
  });

  it('crea o actualiza una sola fila por persona apuntando al modo del catálogo', async () => {
    await repository.upsertMode('user-1', JobAlertMode.HIGH_AFFINITY);

    expect(prisma.jobOfferNotificationPreference.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: { mode: { connect: { title: 'HIGH_AFFINITY' } } },
      create: {
        user: { connect: { id: 'user-1' } },
        mode: { connect: { title: 'HIGH_AFFINITY' } },
      },
    });
  });

  it('trae solo a quienes eligieron un filtro, nunca a quienes eligieron "ALL"', async () => {
    prisma.jobOfferNotificationPreference.findMany.mockResolvedValue([
      { userId: 'user-1', mode: { title: 'MATCHING' } },
      { userId: 'user-2', mode: { title: 'HIGH_AFFINITY' } },
    ]);

    await expect(repository.findFilteredModes()).resolves.toEqual(
      new Map([
        ['user-1', 'MATCHING'],
        ['user-2', 'HIGH_AFFINITY'],
      ]),
    );
    expect(prisma.jobOfferNotificationPreference.findMany).toHaveBeenCalledWith({
      where: { mode: { title: { in: ['MATCHING', 'HIGH_AFFINITY'] } } },
      select: { userId: true, mode: { select: { title: true } } },
    });
  });
});
