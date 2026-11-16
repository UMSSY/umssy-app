import { describe, expect, it, vi } from 'vitest';
import type { ApplicationsService } from '../../applications/services/applications.service.js';
import type { RadarApplicationsRepository } from '../repositories/radar-applications.repository.js';
import { RadarApplicationsService } from '../services/radar-applications.service.js';

const application = {
  id: 'app',
  userId: 'owner',
  jobOfferId: 'job',
  appliedAt: new Date('2026-01-01'),
  status: { title: 'En revisión' },
  jobOffer: { companyId: 'company' },
};

function setup() {
  const applications = {
    findRecruitmentApplication: vi.fn().mockResolvedValue(application),
    findRecruitmentApplicants: vi.fn().mockResolvedValue([application]),
    recordRecruiterDecision: vi.fn().mockResolvedValue([{ id: 'app' }]),
    findApplicationDecisionContext: vi.fn().mockResolvedValue({
      id: 'app',
      userId: 'owner',
      statusTitle: 'Entrevista',
      jobOfferId: 'job',
      companyId: 'company',
      jobTitle: 'Dev Backend',
      companyName: 'Empresa A',
    }),
  };
  const consents = {
    findConsents: vi.fn().mockResolvedValue([]),
    setConsents: vi.fn(),
  };
  const service = new RadarApplicationsService(
    applications as unknown as ApplicationsService,
    consents as unknown as RadarApplicationsRepository,
  );
  return { applications, consents, service };
}

describe('RadarApplicationsService', () => {
  it('defaults to private when the application has no consent', async () => {
    const { service, consents } = setup();
    await expect(service.applicants('job')).resolves.toEqual([
      expect.objectContaining({
        id: 'app',
        consent_to_recruiter: false,
        consent_to_cv: false,
        consent_to_contact: false,
      }),
    ]);
    expect(consents.findConsents).toHaveBeenCalledWith(['app']);
    await expect(service.companyForCv('app')).resolves.toEqual([]);
    await expect(service.companyForEvidence('app')).resolves.toEqual([]);
  });

  it('requires current radar consent and a non-withdrawn application for evidence and CV', async () => {
    const { service, applications, consents } = setup();
    consents.findConsents.mockResolvedValue([
      {
        application_id: 'app',
        consent_to_recruiter: true,
        consent_to_cv: false,
      },
    ]);
    await expect(service.companyForCv('app')).resolves.toEqual([
      { user_id: 'owner', company_id: 'company', consent_to_cv: false },
    ]);
    applications.findRecruitmentApplication.mockResolvedValue({
      ...application,
      status: { title: 'Retirada' },
    });
    await expect(service.companyForCv('app')).resolves.toEqual([]);
    await expect(service.companyForEvidence('app')).resolves.toEqual([]);
  });

  it('only lets the owner update consent on an active application', async () => {
    const { service, applications, consents } = setup();
    await expect(
      service.updateConsents('another-user', 'app', true, true, true),
    ).resolves.toEqual([]);
    expect(consents.setConsents).not.toHaveBeenCalled();
    await expect(
      service.updateConsents('owner', 'app', true, false, false),
    ).resolves.toEqual([{ id: 'app', status_title: 'En revisión' }]);
    expect(consents.setConsents).toHaveBeenCalledWith(
      'app',
      true,
      false,
      false,
    );
    applications.findRecruitmentApplication.mockResolvedValue({
      ...application,
      status: { title: 'Retirada' },
    });
    await expect(
      service.updateConsents('owner', 'app', true, true, true),
    ).resolves.toEqual([]);
    expect(consents.setConsents).toHaveBeenCalledOnce();
  });

  it('delegates recruiter decisions to the applications domain', async () => {
    const { service, applications } = setup();
    await expect(
      service.recordRecruiterDecision('app', 'Aceptada'),
    ).resolves.toEqual([{ id: 'app' }]);
    expect(applications.recordRecruiterDecision).toHaveBeenCalledWith(
      'app',
      'Aceptada',
    );
  });

  it('companyForDecision expone el contexto para notificar (HU-15)', async () => {
    const { service, applications } = setup();
    await expect(service.companyForDecision('app')).resolves.toEqual([
      {
        user_id: 'owner',
        company_id: 'company',
        status_title: 'Entrevista',
        job_title: 'Dev Backend',
        company_name: 'Empresa A',
      },
    ]);

    applications.findApplicationDecisionContext.mockResolvedValue(null);
    await expect(service.companyForDecision('missing')).resolves.toEqual([]);
  });
});
