import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RadarRecruitmentService } from '../radar-recruitment.service.js';
import type { RadarAccessRepository } from '../repositories/radar-access.repository.js';
import type { RadarApplicationsRepository } from '../repositories/radar-applications.repository.js';
import type { RadarRecruitmentRepository } from '../repositories/radar-recruitment.repository.js';
import { emptyScores } from '../radar-scoring.js';

function makeAccess() {
  return {
    hasRole: vi.fn(),
    hasAnyRole: vi.fn(),
    recordAudit: vi.fn(),
  };
}

function makeRecruitment() {
  return {
    companyExists: vi.fn(),
    grantCompany: vi.fn(),
    allowedCompany: vi.fn(),
    linkedCompanies: vi.fn(),
    activeVacancies: vi.fn(),
    recruiterVacancies: vi.fn(),
    publishedJob: vi.fn(),
    catalogSkills: vi.fn(),
    candidate: vi.fn(),
    latestSnapshot: vi.fn(),
    approvedSkillReferences: vi.fn(),
    ownedEducation: vi.fn(),
    ownedCertifications: vi.fn(),
    ownedExperiences: vi.fn(),
    approvedCv: vi.fn(),
  };
}

function makeApplications() {
  return {
    isOfferOpen: vi.fn(),
    statusByTitle: vi.fn(),
    findMine: vi.fn(),
    create: vi.fn(),
    setConsents: vi.fn(),
    myApplications: vi.fn(),
    updateConsents: vi.fn(),
    withdraw: vi.fn(),
    applicants: vi.fn(),
    companyForEvidence: vi.fn(),
    companyForCv: vi.fn(),
    companyForDecision: vi.fn(),
    recordRecruiterDecision: vi.fn(),
  };
}

function setup() {
  const access = makeAccess();
  const repository = makeRecruitment();
  const applications = makeApplications();
  const service = new RadarRecruitmentService(
    repository as unknown as RadarRecruitmentRepository,
    access as unknown as RadarAccessRepository,
    applications as unknown as RadarApplicationsRepository,
  );
  return { access, repository, applications, service };
}

const applicationRow = (overrides: Record<string, unknown> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  job_offer_id: '22222222-2222-4222-8222-222222222222',
  user_id: '33333333-3333-4333-8333-333333333333',
  status_title: 'En revisión',
  applied_at: new Date('2026-01-01T00:00:00.000Z'),
  consent_to_recruiter: true,
  consent_to_cv: true,
  consent_to_contact: true,
  ...overrides,
});

const snapshot = (scores: ReturnType<typeof emptyScores>) => ({
  user_id: '33333333-3333-4333-8333-333333333333',
  version: 1,
  scores,
  evidence: {
    desarrollo: [{ id: 'skill-react', name: 'React' }],
    'cloud-devops': [],
    'data-ai': [{ id: 'skill-python', name: 'Python' }],
    qa: [],
    ciberseguridad: [],
    'gobernanza-ti': [],
  },
  average_score: '1.67',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
});

describe('RadarRecruitmentService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asigna una empresa a un usuario empresa siendo administrador', async () => {
    const { access, repository, service } = setup();
    access.hasRole.mockResolvedValue(true);
    repository.companyExists.mockResolvedValue({ id: 'company' });
    repository.grantCompany.mockResolvedValue(undefined);

    await expect(service.grantCompany('admin', 'company-user', 'company')).resolves.toEqual({
      userId: 'company-user',
      companyId: 'company',
    });
    expect(repository.grantCompany).toHaveBeenCalledWith('company-user', 'company');
  });

  it('rechaza asignar empresa si el solicitante no es administrador', async () => {
    const { access, service } = setup();
    access.hasRole.mockResolvedValue(false);

    await expect(service.grantCompany('admin', 'user', 'company')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('registra una postulación y sus consentimientos', async () => {
    const { access, applications, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    applications.isOfferOpen.mockResolvedValue({ id: 'job' });
    applications.findMine.mockResolvedValue(null);
    applications.statusByTitle.mockResolvedValue({ id: 'status' });
    applications.create.mockResolvedValue({ id: 'app', status: { title: 'En revisión' } });
    applications.setConsents.mockResolvedValue([{ id: 'app' }]);

    await expect(service.apply('user', 'job', true, true, true)).resolves.toMatchObject({
      id: 'app',
      jobOfferId: 'job',
      state: 'applied',
      consent: true,
      consentCv: true,
      consentContact: true,
    });
    expect(applications.setConsents).toHaveBeenCalledWith('app', true, true, true);
  });

  it('reutiliza una postulación existente y evita duplicados concurrentes', async () => {
    const { access, applications, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    applications.isOfferOpen.mockResolvedValue({ id: 'job' });
    applications.findMine
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'app', status: { title: 'En revisión' } });
    applications.statusByTitle.mockResolvedValue({ id: 'status' });
    applications.create.mockRejectedValue(
      Object.assign(new Error('duplicate'), { code: 'P2002' }),
    );
    applications.setConsents.mockResolvedValue([{ id: 'app' }]);

    await expect(service.apply('user', 'job', true, false)).resolves.toMatchObject({
      id: 'app',
      consentCv: false,
      consentContact: false,
    });
  });

  it('rechaza postularse a una vacante cerrada o sin rol', async () => {
    const closed = setup();
    closed.access.hasAnyRole.mockResolvedValue(true);
    closed.applications.isOfferOpen.mockResolvedValue(null);
    await expect(closed.service.apply('user', 'job', true, false)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const withoutRole = setup();
    withoutRole.access.hasAnyRole.mockResolvedValue(false);
    await expect(
      withoutRole.service.apply('user', 'job', true, false),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza una postulación ya decidida', async () => {
    const { access, applications, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    applications.isOfferOpen.mockResolvedValue({ id: 'job' });
    applications.findMine.mockResolvedValue({
      id: 'app',
      status: { title: 'Aceptada' },
    });

    await expect(service.apply('user', 'job', true, false)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lista y actualiza postulaciones propias', async () => {
    const { access, applications, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    applications.myApplications.mockResolvedValue([
      applicationRow({ status_title: 'Entrevista', consent_to_cv: false }),
    ]);

    await expect(service.myApplications('user')).resolves.toEqual([
      expect.objectContaining({ state: 'interview', consentCv: false }),
    ]);

    applications.updateConsents.mockResolvedValue([
      { id: 'app', status_title: 'Entrevista' },
    ]);
    await expect(
      service.updateMyApplicationConsents('user', 'app', true, false, true),
    ).resolves.toMatchObject({ state: 'interview', consentContact: true });

    applications.updateConsents.mockResolvedValue([]);
    await expect(
      service.updateMyApplicationConsents('user', 'app', true, true, true),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('permite retirar sólo postulaciones abiertas', async () => {
    const { access, applications, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    applications.withdraw.mockResolvedValue([{ id: 'app' }]);

    await expect(service.withdrawMyApplication('user', 'app')).resolves.toEqual({
      id: 'app',
      state: 'withdrawn',
    });

    applications.withdraw.mockResolvedValue([]);
    await expect(service.withdrawMyApplication('user', 'app')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lista sólo vacantes de las empresas vinculadas al reclutador', async () => {
    const { access, repository, service } = setup();
    access.hasRole.mockResolvedValue(true);
    repository.linkedCompanies.mockResolvedValue([{ company_id: 'company' }]);
    repository.recruiterVacancies.mockResolvedValue([
      { id: 'job', title: 'Vacante', companyId: 'company' },
    ]);

    await expect(service.recruiterVacancies('user')).resolves.toEqual([
      { id: 'job', title: 'Vacante', companyId: 'company' },
    ]);

    repository.linkedCompanies.mockResolvedValue([]);
    await expect(service.recruiterVacancies('user')).resolves.toEqual([]);
  });

  it('compara la vacante con radares publicados y oculta postulantes sin consentimiento o sin radar', async () => {
    const { access, repository, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    repository.publishedJob.mockResolvedValue({
      id: 'job',
      title: 'Full Stack',
      companyId: 'company',
      description: 'Buscamos Python y React',
      skills: [{ skill: { areaId: 'desarrollo', name: 'React' } }],
    });
    repository.allowedCompany.mockResolvedValue([{ company_id: 'company' }]);
    repository.catalogSkills.mockResolvedValue([
      { name: 'React', areaId: 'desarrollo' },
      { name: 'Python', areaId: 'data-ai' },
      { name: 'xx', areaId: null },
    ]);

    const applicantA = applicationRow({ id: 'app-a', user_id: 'user-a' });
    const applicantB = applicationRow({ id: 'app-b', user_id: 'user-b' });
    const applicantNoRadar = applicationRow({ id: 'app-c', user_id: 'user-c' });
    const applicantNoConsent = applicationRow({
      id: 'app-d',
      user_id: 'user-d',
      consent_to_recruiter: false,
    });
    applications.applicants.mockResolvedValue([
      applicantA,
      applicantB,
      applicantNoRadar,
      applicantNoConsent,
    ]);

    const scoresA = emptyScores();
    scoresA.desarrollo = 5;
    scoresA['data-ai'] = 5;
    const scoresB = emptyScores();
    scoresB.desarrollo = 10;
    scoresB['data-ai'] = 10;
    const empty = emptyScores();

    repository.candidate.mockImplementation(async (id: string) => ({
      firstName: id,
      lastName: 'Pérez',
      headline: 'Perfil',
      email: `${id}@test`,
      phone: '70000000',
    }));
    repository.latestSnapshot.mockImplementation(async (id: string) => {
      if (id === 'user-a') return [snapshot(scoresA)];
      if (id === 'user-b') return [snapshot(scoresB)];
      if (id === 'user-c') return [];
      return [snapshot(empty)];
    });

    const result = await service.recruiterApplicants('recruiter', 'job');

    expect(result.vacancy.target.desarrollo).toBe(2.5);
    expect(result.vacancy.target['data-ai']).toBe(2.5);
    expect(result.applicants).toHaveLength(2);
    expect(result.applicants.map((item) => item.applicationId)).toEqual([
      'app-a',
      'app-b',
    ]);
    expect(result.applicants[0].comparison?.match).toBeGreaterThan(
      result.applicants[1].comparison?.match ?? 0,
    );
    expect(result.applicants[0]).toMatchObject({
      name: 'user-a Pérez',
      email: 'user-a@test',
      phone: '70000000',
      canViewCv: true,
    });
  });

  it('oculta el contacto cuando no fue autorizado', async () => {
    const { access, repository, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    repository.publishedJob.mockResolvedValue({
      id: 'job',
      title: 'Vacante',
      companyId: 'company',
      description: '',
      skills: [],
    });
    repository.allowedCompany.mockResolvedValue([{ company_id: 'company' }]);
    repository.catalogSkills.mockResolvedValue([]);
    applications.applicants.mockResolvedValue([
      applicationRow({ consent_to_contact: false }),
    ]);
    repository.candidate.mockResolvedValue({
      firstName: 'Ana',
      lastName: 'Quispe',
      headline: null,
      email: 'ana@test',
      phone: '70000000',
    });
    const scores = emptyScores();
    scores.desarrollo = 5;
    repository.latestSnapshot.mockResolvedValue([snapshot(scores)]);

    const result = await service.recruiterApplicants('recruiter', 'job');

    expect(result.applicants[0]).toMatchObject({
      email: null,
      phone: null,
      headline: '',
    });
  });

  it('rechaza consultar postulantes de una empresa no vinculada', async () => {
    const { access, repository, service } = setup();
    access.hasRole.mockResolvedValue(true);
    repository.publishedJob.mockResolvedValue({
      id: 'job',
      companyId: 'company',
      description: '',
      skills: [],
    });
    repository.allowedCompany.mockResolvedValue([]);

    await expect(service.recruiterApplicants('recruiter', 'job')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rechaza una vacante inexistente', async () => {
    const { service } = setup();
    const { repository } = setup();
    repository.publishedJob.mockResolvedValue(null);
    const local = new RadarRecruitmentService(
      repository as never,
      { hasRole: vi.fn() } as never,
      {} as never,
    );
    await expect(local.recruiterApplicants('recruiter', 'job')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(service).toBeDefined();
  });

  it('autoriza evidencias sólo por área válida y postulación consentida', async () => {
    const { access, repository, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    applications.companyForEvidence.mockResolvedValue([
      { user_id: 'user', company_id: 'company' },
    ]);
    repository.allowedCompany.mockResolvedValue([{ company_id: 'company' }]);
    repository.latestSnapshot.mockResolvedValue([
      snapshot(emptyScores()),
    ]);
    repository.approvedSkillReferences.mockResolvedValue([
      {
        skillId: 'skill-react',
        evidenceRefs: [
          { type: 'education', id: 'edu' },
          { type: 'work-experience', id: 'exp' },
          { type: 'certification', id: 'cert' },
        ],
      },
    ]);
    repository.ownedEducation.mockResolvedValue([
      {
        id: 'edu',
        degree: 'Ingeniería',
        institution: 'UMSS',
        startDate: new Date('2018-01-01'),
        description: 'Formación',
      },
    ]);
    repository.ownedCertifications.mockResolvedValue([
      {
        id: 'cert',
        name: 'Certificación',
        issuingOrganization: 'Instituto',
        issueDate: new Date('2024-01-01'),
      },
    ]);
    repository.ownedExperiences.mockResolvedValue([
      {
        id: 'exp',
        position: 'Desarrolladora',
        startDate: new Date('2022-01-01'),
        endDate: null,
        description: 'Trabajo',
        company: { title: 'TechBolivia' },
      },
    ]);

    await expect(
      service.recruiterAreaEvidence('recruiter', 'app', 'desarrollo'),
    ).resolves.toMatchObject({
      education: [expect.objectContaining({ degree: 'Ingeniería', year: 2018 })],
      certifications: [expect.objectContaining({ name: 'Certificación', year: 2024 })],
      experiences: [expect.objectContaining({ position: 'Desarrolladora' })],
      tags: ['React'],
    });

    await expect(
      service.recruiterAreaEvidence('recruiter', 'app', 'desconocida'),
    ).rejects.toBeInstanceOf(BadRequestException);

    applications.companyForEvidence.mockResolvedValue([]);
    await expect(
      service.recruiterAreaEvidence('recruiter', 'app', 'desarrollo'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('devuelve evidencias vacías cuando el área no tiene habilidades publicadas', async () => {
    const { access, repository, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    applications.companyForEvidence.mockResolvedValue([
      { user_id: 'user', company_id: 'company' },
    ]);
    repository.allowedCompany.mockResolvedValue([{ company_id: 'company' }]);
    repository.latestSnapshot.mockResolvedValue([]);

    await expect(
      service.recruiterAreaEvidence('recruiter', 'app', 'qa'),
    ).resolves.toEqual({ education: [], certifications: [], experiences: [], tags: [] });
  });

  it('entrega el CV sólo con consentimiento y archivo disponible', async () => {
    const { access, repository, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    applications.companyForCv.mockResolvedValue([
      { user_id: 'user', company_id: 'company', consent_to_cv: true },
    ]);
    repository.allowedCompany.mockResolvedValue([{ company_id: 'company' }]);
    repository.approvedCv.mockResolvedValue({ cvPdfUrl: new Uint8Array([37, 80, 68, 70]) });

    await expect(service.recruiterCv('recruiter', 'app')).resolves.toEqual(
      Buffer.from([37, 80, 68, 70]),
    );
    expect(access.recordAudit).toHaveBeenCalledWith(
      'user',
      'recruiter',
      'cv.recruiter_viewed',
      'app',
      { applicationId: 'app' },
    );

    applications.companyForCv.mockResolvedValue([
      { user_id: 'user', company_id: 'company', consent_to_cv: false },
    ]);
    await expect(service.recruiterCv('recruiter', 'app')).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    applications.companyForCv.mockResolvedValue([]);
    await expect(service.recruiterCv('recruiter', 'app')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('registra decisiones de contratación o rechazo', async () => {
    const { access, repository, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    repository.allowedCompany.mockResolvedValue([{ company_id: 'company' }]);
    applications.companyForDecision.mockResolvedValue([
      { user_id: 'user', company_id: 'company' },
    ]);
    applications.recordRecruiterDecision.mockResolvedValue([{ id: 'app' }]);

    await expect(service.decideApplication('recruiter', 'app', 'hired')).resolves.toEqual({
      id: 'app',
      state: 'hired',
    });
    await expect(service.decideApplication('recruiter', 'app', 'rejected')).resolves.toEqual({
      id: 'app',
      state: 'rejected',
    });
    await expect(
      service.decideApplication('recruiter', 'app', 'withdrawn'),
    ).rejects.toBeInstanceOf(BadRequestException);

    applications.recordRecruiterDecision.mockResolvedValue([]);
    await expect(
      service.decideApplication('recruiter', 'app', 'hired'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lista vacantes activas para el egresado', async () => {
    const { repository, service } = setup();
    repository.activeVacancies.mockResolvedValue([
      {
        id: 'job',
        companyId: 'company',
        title: 'Vacante',
        description: 'Descripción',
      },
    ]);

    await expect(service.activeVacancies()).resolves.toEqual([
      { id: 'job', companyId: 'company', title: 'Vacante', description: 'Descripción' },
    ]);
  });
});
