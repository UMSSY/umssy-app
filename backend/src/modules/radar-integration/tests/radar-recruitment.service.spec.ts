import type { ApplicationsService } from '../../applications/services/applications.service.js';
import type { RadarRecruitmentSourcesService } from '../services/radar-recruitment-sources.service.js';
import { ApplicationNotWithdrawableException } from '../../applications/exceptions/application-not-withdrawable.exception.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { DuplicateJobApplicationException } from '../../matching/exceptions/duplicate-job-application.exception.js';
import { JobOfferUnavailableException } from '../../matching/exceptions/job-offer-unavailable.exception.js';
import type { JobApplicationsService } from '../../matching/services/job-applications.service.js';
import { RadarApplicationConflictException } from '../exceptions/radar-application-conflict.exception.js';
import { RadarApplicationNotFoundException } from '../exceptions/radar-application-not-found.exception.js';
import { RadarAreaUnknownException } from '../exceptions/radar-area-unknown.exception.js';
import { RadarCompanyNotFoundException } from '../exceptions/radar-company-not-found.exception.js';
import { RadarCompanyNotLinkedException } from '../exceptions/radar-company-not-linked.exception.js';
import { RadarCvNotSharedException } from '../exceptions/radar-cv-not-shared.exception.js';
import { RadarRecruiterDecisionInvalidException } from '../exceptions/radar-recruiter-decision-invalid.exception.js';
import { RadarVacancyUnavailableException } from '../exceptions/radar-vacancy-unavailable.exception.js';
import { RadarRecruitmentService } from '../services/radar-recruitment.service.js';
import type { RadarAccessRepository } from '../repositories/radar-access.repository.js';
import type { RadarApplicationsService } from '../services/radar-applications.service.js';
import type { RadarRecruitmentRepository } from '../repositories/radar-recruitment.repository.js';
import { emptyScores } from '../utils/radar-scoring.js';

function makeAccess() {
  return {
    hasRole: vi.fn(),
    hasAnyRole: vi.fn(),
    recordAudit: vi.fn(),
  };
}

function makeSources() {
  return {
    companyExists: vi.fn(),
    recruiterCompanyId: vi.fn(),
    assignCompany: vi.fn(),
    activeVacancies: vi.fn(),
    recruiterVacancies: vi.fn(),
    publishedJob: vi.fn(),
    catalogSkills: vi.fn(),
    candidate: vi.fn(),
    approvedSkillReferences: vi.fn(),
    ownedEducation: vi.fn(),
    ownedCertifications: vi.fn(),
    ownedExperiences: vi.fn(),
    currentCv: vi.fn(),
  };
}

function makeApplications() {
  return {
    setConsents: vi.fn(),
    myApplications: vi.fn(),
    updateConsents: vi.fn(),
    revokeConsents: vi.fn(),
    applicants: vi.fn(),
    companyForEvidence: vi.fn(),
    companyForCv: vi.fn(),
    companyForDecision: vi.fn(),
    recordRecruiterDecision: vi.fn(),
  };
}

function makeJobApplications() {
  return {
    apply: vi.fn(),
    findMine: vi.fn(),
  };
}

function setup() {
  const access = makeAccess();
  const sources = makeSources();
  const repository = {
    grantCompany: vi.fn(),
    allowedCompany: vi.fn(),
    linkedCompanies: vi.fn(),
    latestSnapshot: vi.fn(),
  };
  const applicationActions = { withdrawApplication: vi.fn() };
  const applications = makeApplications();
  const jobApplications = makeJobApplications();
  const service = new RadarRecruitmentService(
    repository as unknown as RadarRecruitmentRepository,
    access as unknown as RadarAccessRepository,
    applications as unknown as RadarApplicationsService,
    jobApplications as unknown as JobApplicationsService,
    sources as unknown as RadarRecruitmentSourcesService,
    applicationActions as unknown as ApplicationsService,
  );
  return {
    access,
    repository,
    sources,
    applications,
    jobApplications,
    applicationActions,
    service,
  };
}

const mine = (application: unknown) => ({
  hasApplied: application !== null,
  application,
});

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
    const { access, repository, sources, service } = setup();
    access.hasRole.mockResolvedValue(true);
    sources.companyExists.mockResolvedValue({ id: 'company' });
    repository.grantCompany.mockResolvedValue(undefined);

    await expect(
      service.grantCompany('admin', 'company-user', 'company'),
    ).resolves.toEqual({
      userId: 'company-user',
      companyId: 'company',
    });
    expect(repository.grantCompany).toHaveBeenCalledWith(
      'company-user',
      'company',
    );
  });

  it('rechaza asignar empresa si el solicitante no es administrador', async () => {
    const { access, service } = setup();
    access.hasRole.mockResolvedValue(false);

    await expect(
      service.grantCompany('admin', 'user', 'company'),
    ).rejects.toBeInstanceOf(ForbiddenRoleException);
  });

  it('rechaza asignar una empresa inexistente', async () => {
    const { access, sources, service } = setup();
    access.hasRole.mockResolvedValue(true);
    sources.companyExists.mockResolvedValue(null);

    await expect(
      service.grantCompany('admin', 'company-user', 'company'),
    ).rejects.toBeInstanceOf(RadarCompanyNotFoundException);
  });

  it('registra una postulación reutilizando las reglas del Epic', async () => {
    const { access, applications, jobApplications, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    jobApplications.findMine.mockResolvedValue(mine(null));
    jobApplications.apply.mockResolvedValue({
      id: 'app',
      jobOfferId: 'job',
      jobTitle: 'Vacante',
      companyName: 'Empresa',
      appliedAt: '2026-01-01T00:00:00.000Z',
      status: 'En revisión',
    });
    applications.setConsents.mockResolvedValue([{ id: 'app' }]);

    await expect(
      service.apply('user', 'job', true, true, true),
    ).resolves.toMatchObject({
      id: 'app',
      jobOfferId: 'job',
      state: 'applied',
      consent: true,
      consentCv: true,
      consentContact: true,
    });
    expect(jobApplications.apply).toHaveBeenCalledWith('user', 'job', {
      consent: true,
      consentCv: true,
      consentContact: true,
    });
    expect(applications.setConsents).toHaveBeenCalledWith(
      'app',
      true,
      true,
      true,
    );
  });

  it('reutiliza una postulación existente y evita duplicados concurrentes', async () => {
    const { access, applications, jobApplications, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    jobApplications.findMine
      .mockResolvedValueOnce(mine(null))
      .mockResolvedValueOnce(mine({ id: 'app', status: 'En revisión' }));
    jobApplications.apply.mockRejectedValue(
      new DuplicateJobApplicationException(),
    );
    applications.setConsents.mockResolvedValue([{ id: 'app' }]);

    await expect(
      service.apply('user', 'job', true, true, true),
    ).resolves.toMatchObject({
      id: 'app',
      consentCv: true,
      consentContact: true,
    });
    expect(jobApplications.apply).toHaveBeenCalledTimes(1);
  });

  it('rechaza postularse a una vacante cerrada o sin rol', async () => {
    const closed = setup();
    closed.access.hasAnyRole.mockResolvedValue(true);
    closed.jobApplications.findMine.mockResolvedValue(mine(null));
    closed.jobApplications.apply.mockRejectedValue(
      new JobOfferUnavailableException(),
    );
    await expect(
      closed.service.apply('user', 'job', true, true, true),
    ).rejects.toBeInstanceOf(JobOfferUnavailableException);

    const withoutRole = setup();
    withoutRole.access.hasAnyRole.mockResolvedValue(false);
    await expect(
      withoutRole.service.apply('user', 'job', true, true, true),
    ).rejects.toBeInstanceOf(ForbiddenRoleException);
  });

  it('rechaza una postulación ya decidida', async () => {
    const { access, jobApplications, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    jobApplications.findMine.mockResolvedValue(
      mine({ id: 'app', status: 'Aceptada' }),
    );

    await expect(
      service.apply('user', 'job', true, true, true),
    ).rejects.toBeInstanceOf(RadarApplicationConflictException);
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
    ).rejects.toBeInstanceOf(RadarApplicationNotFoundException);
  });

  it('permite retirar sólo postulaciones abiertas', async () => {
    const { access, applications, applicationActions, service } = setup();
    access.hasAnyRole.mockResolvedValue(true);
    applicationActions.withdrawApplication.mockResolvedValue(undefined);

    await expect(service.withdrawMyApplication('user', 'app')).resolves.toEqual(
      {
        id: 'app',
        state: 'withdrawn',
      },
    );

    expect(applicationActions.withdrawApplication).toHaveBeenCalledWith(
      'app',
      'user',
    );
    expect(applications.revokeConsents).toHaveBeenCalledWith('app');
    applicationActions.withdrawApplication.mockRejectedValue(
      new ApplicationNotWithdrawableException(),
    );
    await expect(
      service.withdrawMyApplication('user', 'app'),
    ).rejects.toBeInstanceOf(ApplicationNotWithdrawableException);
  });

  it('lista sólo vacantes de las empresas vinculadas al reclutador', async () => {
    const { access, sources, service } = setup();
    access.hasRole.mockResolvedValue(true);
    sources.recruiterCompanyId.mockResolvedValue('company');
    sources.recruiterVacancies.mockResolvedValue([
      { id: 'job', title: 'Vacante', companyId: 'company' },
    ]);

    await expect(service.recruiterVacancies('user')).resolves.toEqual([
      { id: 'job', title: 'Vacante', companyId: 'company' },
    ]);

    sources.recruiterCompanyId.mockResolvedValue(null);
    await expect(service.recruiterVacancies('user')).resolves.toEqual([]);
  });

  it('compara la vacante con radares publicados y oculta postulantes sin consentimiento o sin radar', async () => {
    const { access, repository, sources, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    sources.publishedJob.mockResolvedValue({
      id: 'job',
      title: 'Full Stack',
      companyId: 'company',
      description: 'Buscamos Python y React',
      skills: [{ skill: { areaId: 'desarrollo', name: 'React' } }],
    });
    sources.recruiterCompanyId.mockResolvedValue('company');
    sources.catalogSkills.mockResolvedValue([
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

    sources.candidate.mockImplementation(async (id: string) => ({
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
    const { access, repository, sources, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    sources.publishedJob.mockResolvedValue({
      id: 'job',
      title: 'Vacante',
      companyId: 'company',
      description: '',
      skills: [],
    });
    sources.recruiterCompanyId.mockResolvedValue('company');
    sources.catalogSkills.mockResolvedValue([]);
    applications.applicants.mockResolvedValue([
      applicationRow({ consent_to_contact: false }),
    ]);
    sources.candidate.mockResolvedValue({
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
    const { access, sources, service } = setup();
    access.hasRole.mockResolvedValue(true);
    sources.publishedJob.mockResolvedValue({
      id: 'job',
      companyId: 'company',
      description: '',
      skills: [],
    });
    sources.recruiterCompanyId.mockResolvedValue(null);

    await expect(
      service.recruiterApplicants('recruiter', 'job'),
    ).rejects.toBeInstanceOf(RadarCompanyNotLinkedException);
  });

  it('rechaza una vacante inexistente', async () => {
    const { sources, service } = setup();
    sources.publishedJob.mockResolvedValue(null);

    await expect(
      service.recruiterApplicants('recruiter', 'job'),
    ).rejects.toBeInstanceOf(RadarVacancyUnavailableException);
  });

  it('rechaza vacantes ajenas aunque exista un acceso antiguo del radar', async () => {
    const { access, repository, sources, service, applications } = setup();
    access.hasRole.mockResolvedValue(true);
    sources.recruiterCompanyId.mockResolvedValue('own-company');
    repository.allowedCompany.mockResolvedValue([
      { company_id: 'other-company' },
    ]);
    sources.publishedJob.mockResolvedValue({
      id: 'job',
      companyId: 'other-company',
    });
    await expect(
      service.recruiterApplicants('recruiter', 'job'),
    ).rejects.toBeInstanceOf(RadarCompanyNotLinkedException);
    expect(applications.applicants).not.toHaveBeenCalled();
  });

  it('autoriza evidencias sólo por área válida y postulación consentida', async () => {
    const { access, repository, sources, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    applications.companyForEvidence.mockResolvedValue([
      { user_id: 'user', company_id: 'company' },
    ]);
    sources.recruiterCompanyId.mockResolvedValue('company');
    repository.latestSnapshot.mockResolvedValue([snapshot(emptyScores())]);
    sources.approvedSkillReferences.mockResolvedValue([
      {
        skillId: 'skill-react',
        evidenceRefs: [
          { type: 'education', id: 'edu' },
          { type: 'work-experience', id: 'exp' },
          { type: 'certification', id: 'cert' },
          { type: 'unknown', id: 'x' },
        ],
      },
    ]);
    sources.ownedEducation.mockResolvedValue([
      {
        id: 'edu',
        degree: 'Ingeniería',
        institution: 'UMSS',
        startDate: new Date('2018-01-01'),
        description: 'Formación',
      },
    ]);
    sources.ownedCertifications.mockResolvedValue([
      {
        id: 'cert',
        name: 'Certificación',
        issuingOrganization: 'Instituto',
        issueDate: new Date('2024-01-01'),
      },
    ]);
    sources.ownedExperiences.mockResolvedValue([
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
      education: [
        expect.objectContaining({ degree: 'Ingeniería', year: 2018 }),
      ],
      certifications: [
        expect.objectContaining({ name: 'Certificación', year: 2024 }),
      ],
      experiences: [expect.objectContaining({ position: 'Desarrolladora' })],
      tags: ['React'],
    });

    await expect(
      service.recruiterAreaEvidence('recruiter', 'app', 'desconocida'),
    ).rejects.toBeInstanceOf(RadarAreaUnknownException);

    applications.companyForEvidence.mockResolvedValue([]);
    await expect(
      service.recruiterAreaEvidence('recruiter', 'app', 'desarrollo'),
    ).rejects.toBeInstanceOf(RadarApplicationNotFoundException);
  });

  it('devuelve evidencias vacías cuando el área no tiene habilidades publicadas', async () => {
    const { access, repository, applications, service, sources } = setup();
    access.hasRole.mockResolvedValue(true);
    applications.companyForEvidence.mockResolvedValue([
      { user_id: 'user', company_id: 'company' },
    ]);
    sources.recruiterCompanyId.mockResolvedValue('company');
    repository.latestSnapshot.mockResolvedValue([]);

    await expect(
      service.recruiterAreaEvidence('recruiter', 'app', 'qa'),
    ).resolves.toEqual({
      education: [],
      certifications: [],
      experiences: [],
      tags: [],
    });
  });

  it('entrega el CV aprobado sólo con consentimiento y archivo disponible', async () => {
    const { access, sources, applications, service } = setup();
    access.hasRole.mockResolvedValue(true);
    applications.companyForCv.mockResolvedValue([
      { user_id: 'user', company_id: 'company', consent_to_cv: true },
    ]);
    sources.recruiterCompanyId.mockResolvedValue('company');
    sources.currentCv.mockResolvedValue([
      { cv_pdf_data: Buffer.from([37, 80, 68, 70]).toString('base64') },
    ]);

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

    sources.currentCv.mockResolvedValue([]);
    await expect(
      service.recruiterCv('recruiter', 'app'),
    ).rejects.toBeInstanceOf(RadarCvNotSharedException);

    applications.companyForCv.mockResolvedValue([
      { user_id: 'user', company_id: 'company', consent_to_cv: false },
    ]);
    await expect(
      service.recruiterCv('recruiter', 'app'),
    ).rejects.toBeInstanceOf(RadarCvNotSharedException);

    applications.companyForCv.mockResolvedValue([]);
    await expect(
      service.recruiterCv('recruiter', 'app'),
    ).rejects.toBeInstanceOf(RadarApplicationNotFoundException);
  });

  it('registra decisiones de contratación o rechazo', async () => {
    const { access, applications, service, sources } = setup();
    access.hasRole.mockResolvedValue(true);
    sources.recruiterCompanyId.mockResolvedValue('company');
    applications.companyForDecision.mockResolvedValue([
      { user_id: 'user', company_id: 'company' },
    ]);
    applications.recordRecruiterDecision.mockResolvedValue([{ id: 'app' }]);

    await expect(
      service.decideApplication('recruiter', 'app', 'hired'),
    ).resolves.toEqual({
      id: 'app',
      state: 'hired',
    });
    await expect(
      service.decideApplication('recruiter', 'app', 'rejected'),
    ).resolves.toEqual({
      id: 'app',
      state: 'rejected',
    });
    await expect(
      service.decideApplication('recruiter', 'app', 'withdrawn'),
    ).rejects.toBeInstanceOf(RadarRecruiterDecisionInvalidException);

    applications.recordRecruiterDecision.mockResolvedValue([]);
    await expect(
      service.decideApplication('recruiter', 'app', 'hired'),
    ).rejects.toBeInstanceOf(RadarApplicationConflictException);

    applications.companyForDecision.mockResolvedValue([]);
    await expect(
      service.decideApplication('recruiter', 'app', 'hired'),
    ).rejects.toBeInstanceOf(RadarApplicationNotFoundException);
  });

  it('lista vacantes activas para el egresado', async () => {
    const { sources, service } = setup();
    sources.activeVacancies.mockResolvedValue([
      {
        id: 'job',
        companyId: 'company',
        title: 'Vacante',
        description: 'Descripción',
      },
    ]);

    await expect(service.activeVacancies()).resolves.toEqual([
      {
        id: 'job',
        companyId: 'company',
        title: 'Vacante',
        description: 'Descripción',
      },
    ]);
  });
});
