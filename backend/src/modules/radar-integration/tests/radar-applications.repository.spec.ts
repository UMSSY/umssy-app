import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarApplicationsRepository } from '../repositories/radar-applications.repository.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const APPLICATION_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '33333333-3333-4333-8333-333333333333';

function setup() {
  const prisma = {
    $queryRaw: vi.fn().mockResolvedValue([]),
  };
  const repository = new RadarApplicationsRepository(
    prisma as unknown as PrismaService,
  );
  return { prisma, repository };
}

describe('RadarApplicationsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste consentimientos independientes y deriva CV/contacto del radar', async () => {
    const { prisma, repository } = setup();
    prisma.$queryRaw.mockResolvedValueOnce([{ id: APPLICATION_ID }]);

    await expect(
      repository.setConsents(APPLICATION_ID, true, true, false),
    ).resolves.toEqual([{ id: APPLICATION_ID }]);
    await repository.setConsents(APPLICATION_ID, false, true, true);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('consulta postulaciones propias, postulantes y actualizaciones', async () => {
    const { prisma, repository } = setup();

    await repository.myApplications(USER_ID);
    await repository.updateConsents(USER_ID, APPLICATION_ID, true, false, true);
    await repository.withdraw(USER_ID, APPLICATION_ID);
    await repository.applicants(JOB_ID);
    await repository.companyForEvidence(APPLICATION_ID);
    await repository.companyForCv(APPLICATION_ID);
    await repository.companyForDecision(APPLICATION_ID);
    await repository.recordRecruiterDecision(APPLICATION_ID, 'Aceptada');

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(8);
  });
});
