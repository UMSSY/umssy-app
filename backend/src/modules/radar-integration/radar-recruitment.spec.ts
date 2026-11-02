import { RadarApplicationsRepository } from './repositories/radar-applications.repository.js';
import { RadarRecruitmentRepository } from './repositories/radar-recruitment.repository.js';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../common/prisma/prisma.service.js';
import type { JobApplicationsService } from '../matching/services/job-applications.service.js';
import { RadarRecruitmentService } from './radar-recruitment.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const jobId = '22222222-2222-4222-8222-222222222222';
const appId = '33333333-3333-4333-8333-333333333333';

function setup() {
  const prisma = {
    userRole: { findFirst: vi.fn().mockResolvedValue({ id: 'role-1' }) },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn().mockResolvedValue(1),
    jobOffer: { findFirst: vi.fn() },
    skill: { findMany: vi.fn().mockResolvedValue([]) },
    user: { findUnique: vi.fn() },
  };
  const jobApplications = {
    findMine: vi.fn(),
    apply: vi.fn(),
  };
  const service = new RadarRecruitmentService(
    new RadarRecruitmentRepository(prisma as unknown as PrismaService),
    new RadarAccessRepository(prisma as unknown as PrismaService),
    jobApplications as unknown as JobApplicationsService,
    new RadarApplicationsRepository(prisma as unknown as PrismaService),
  );
  return { prisma, jobApplications, service };
}

describe('Postulación unificada con Matching de Épica 5', () => {
  it('reutiliza la postulación previa de recomendaciones sin crear otra', async () => {
    const { prisma, jobApplications, service } = setup();
    jobApplications.findMine.mockResolvedValue({
      hasApplied: true,
      application: { id: appId, jobOfferId: jobId, status: 'En revisión' },
    });
    prisma.$queryRaw.mockResolvedValue([{ id: appId }]);
    const result = await service.apply(userId, jobId, true, false, false);
    expect(result.id).toBe(appId);
    expect(jobApplications.apply).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it('permite postularse sin consentir la publicación de datos del Radar', async () => {
    const { prisma, jobApplications, service } = setup();
    jobApplications.findMine.mockResolvedValue({ hasApplied: false, application: null });
    jobApplications.apply.mockResolvedValue({ id: appId, jobOfferId: jobId, status: 'En revisión' });
    prisma.$queryRaw.mockResolvedValue([{ id: appId }]);
    const result = await service.apply(userId, jobId, false, false, false);
    expect(result).toMatchObject({ id: appId, consent: false, consentCv: false, consentContact: false });
    expect(jobApplications.apply).toHaveBeenCalledWith(userId, jobId);
  });

  it('no devuelve una puntuación inventada sin consentimiento ni radar publicado', async () => {
    const { prisma, service } = setup();
    prisma.jobOffer.findFirst.mockResolvedValue({
      id: jobId, title: 'Vacante de prueba', companyId: jobId, skills: [], description: '',
    });
    prisma.$queryRaw
      .mockResolvedValueOnce([{ company_id: jobId }])
      .mockResolvedValueOnce([{
        id: appId, job_offer_id: jobId, user_id: userId,
        status_title: 'En revisión', applied_at: new Date('2026-10-28T00:00:00Z'),
        consent_to_recruiter: false, consent_to_cv: false, consent_to_contact: false,
      }]);
    prisma.user.findUnique.mockResolvedValue({
      firstName: 'Persona', lastName: 'Privada', headline: 'Experiencia',
      email: 'privado@example.com', phone: '555-1234',
    });
    const result = await service.recruiterApplicants(userId, jobId);
    expect(result.applicants).toHaveLength(1);
    expect(result.applicants[0]).toMatchObject({
      applicationId: appId, name: 'Postulante', email: null, phone: null,
      scores: null, comparison: null, canViewCv: false,
    });
  });

  it('retira por ID canónico y revoca permisos en una única operación SQL', async () => {
    const { prisma, service } = setup();
    prisma.$queryRaw.mockResolvedValue([{ id: appId }]);
    const result = await service.withdrawMyApplication(userId, appId);
    expect(result).toEqual({ id: appId, state: 'withdrawn' });
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it('rechaza consentimientos del Radar tras una decisión terminal', async () => {
    const { jobApplications, service } = setup();
    jobApplications.findMine.mockResolvedValue({
      hasApplied: true,
      application: { id: appId, jobOfferId: jobId, status: 'No seleccionado' },
    });
    await expect(service.apply(userId, jobId, true, false, false)).rejects.toThrow('decisión');
  });
});
