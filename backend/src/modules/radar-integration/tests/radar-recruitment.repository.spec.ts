import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarRecruitmentRepository } from '../repositories/radar-recruitment.repository.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '33333333-3333-4333-8333-333333333333';

function setup() {
  const prisma = {
    company: { findUnique: vi.fn() },
    jobOffer: { findMany: vi.fn(), findFirst: vi.fn() },
    skill: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    userSkill: { findMany: vi.fn() },
    education: { findMany: vi.fn() },
    certification: { findMany: vi.fn() },
    workExperience: { findMany: vi.fn() },
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRaw: vi.fn(),
  };
  const repository = new RadarRecruitmentRepository(
    prisma as unknown as PrismaService,
  );
  return { prisma, repository };
}

describe('RadarRecruitmentRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta empresas, accesos y vacantes publicadas', async () => {
    const { prisma, repository } = setup();
    prisma.company.findUnique.mockResolvedValueOnce({ id: COMPANY_ID });
    prisma.jobOffer.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prisma.jobOffer.findFirst.mockResolvedValueOnce(null);

    await expect(repository.companyExists(COMPANY_ID)).resolves.toEqual({
      id: COMPANY_ID,
    });
    await repository.grantCompany(USER_ID, COMPANY_ID);
    await repository.allowedCompany(USER_ID, COMPANY_ID);
    await repository.linkedCompanies(USER_ID);
    await repository.activeVacancies();
    await repository.recruiterVacancies([COMPANY_ID]);
    await repository.publishedJob(JOB_ID);

    expect(prisma.company.findUnique).toHaveBeenCalledWith({
      where: { id: COMPANY_ID },
      select: { id: true },
    });
    expect(prisma.jobOffer.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: { title: 'Publicada' },
        }),
      }),
    );
    expect(prisma.jobOffer.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ companyId: { in: [COMPANY_ID] } }),
      }),
    );
    expect(prisma.jobOffer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: JOB_ID }),
      }),
    );
  });

  it('consulta catálogo, candidato y última instantánea del radar', async () => {
    const { prisma, repository } = setup();
    prisma.skill.findMany.mockResolvedValueOnce([]);
    prisma.user.findUnique.mockResolvedValueOnce({ firstName: 'Ana' });
    prisma.$queryRaw.mockResolvedValueOnce([]);

    await repository.catalogSkills();
    await repository.candidate(USER_ID);
    await repository.latestSnapshot(USER_ID);

    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      where: { isCustom: false, areaId: { not: null } },
      select: { name: true, areaId: true },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: {
        firstName: true,
        lastName: true,
        headline: true,
        email: true,
        phone: true,
      },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('consulta evidencias aprobadas y el CV del titular', async () => {
    const { prisma, repository } = setup();
    prisma.userSkill.findMany.mockResolvedValueOnce([]);
    prisma.education.findMany.mockResolvedValueOnce([]);
    prisma.certification.findMany.mockResolvedValueOnce([]);
    prisma.workExperience.findMany.mockResolvedValueOnce([]);
    prisma.user.findUnique.mockResolvedValueOnce({ cvPdfUrl: null });

    await repository.approvedSkillReferences(USER_ID, ['skill-1']);
    await repository.ownedEducation(USER_ID, ['edu-1']);
    await repository.ownedCertifications(USER_ID, ['cert-1']);
    await repository.ownedExperiences(USER_ID, ['exp-1']);
    await repository.approvedCv(USER_ID);

    expect(prisma.userSkill.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        verificationStatus: 'approved',
        skillId: { in: ['skill-1'] },
      },
      select: { skillId: true, evidenceRefs: true },
    });
    expect(prisma.education.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, id: { in: ['edu-1'] } } }),
    );
    expect(prisma.certification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, id: { in: ['cert-1'] } },
      }),
    );
    expect(prisma.workExperience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, id: { in: ['exp-1'] } } }),
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { cvPdfUrl: true },
    });
  });
});
