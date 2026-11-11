import { StreamableFile } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RadarRecruitmentController } from '../controllers/radar-recruitment.controller.js';
import type { RadarRecruitmentService } from '../radar-recruitment.service.js';

function setup() {
  const recruitment = {
    grantCompany: vi.fn(),
    activeVacancies: vi.fn(),
    apply: vi.fn(),
    myApplications: vi.fn(),
    updateMyApplicationConsents: vi.fn(),
    withdrawMyApplication: vi.fn(),
    recruiterVacancies: vi.fn(),
    recruiterApplicants: vi.fn(),
    recruiterAreaEvidence: vi.fn(),
    recruiterCv: vi.fn(),
    decideApplication: vi.fn(),
  };
  const controller = new RadarRecruitmentController(
    recruitment as unknown as RadarRecruitmentService,
  );
  return { recruitment, controller };
}

describe('RadarRecruitmentController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delega los endpoints de postulación al servicio de reclutamiento', async () => {
    const { recruitment, controller } = setup();

    await controller.grantCompany('admin', {
      userId: 'company-user',
      companyId: 'company',
    });
    await controller.vacancies();
    await controller.apply('user', {
      jobOfferId: 'job',
      consent: true,
      consentCv: false,
      consentContact: true,
    });
    await controller.myApplications('user');
    await controller.updateConsents('user', 'app', {
      consent: true,
      consentCv: true,
      consentContact: false,
    });
    await controller.withdraw('user', 'app');

    expect(recruitment.grantCompany).toHaveBeenCalledWith(
      'admin',
      'company-user',
      'company',
    );
    expect(recruitment.activeVacancies).toHaveBeenCalled();
    expect(recruitment.apply).toHaveBeenCalledWith(
      'user',
      'job',
      true,
      false,
      true,
    );
    expect(recruitment.myApplications).toHaveBeenCalledWith('user');
    expect(recruitment.updateMyApplicationConsents).toHaveBeenCalledWith(
      'user',
      'app',
      true,
      true,
      false,
    );
    expect(recruitment.withdrawMyApplication).toHaveBeenCalledWith(
      'user',
      'app',
    );
  });

  it('delega los endpoints del reclutador y entrega el CV autorizado', async () => {
    const { recruitment, controller } = setup();
    recruitment.recruiterCv.mockResolvedValue(Buffer.from('pdf'));

    await controller.recruiterVacancies('recruiter');
    await controller.applicants('recruiter', 'job');
    await controller.recruiterEvidence('recruiter', 'app', 'desarrollo');
    const file = await controller.recruiterCv('recruiter', 'app');
    await controller.decide('recruiter', 'app', { decision: 'hired' });

    expect(recruitment.recruiterVacancies).toHaveBeenCalledWith('recruiter');
    expect(recruitment.recruiterApplicants).toHaveBeenCalledWith(
      'recruiter',
      'job',
    );
    expect(recruitment.recruiterAreaEvidence).toHaveBeenCalledWith(
      'recruiter',
      'app',
      'desarrollo',
    );
    expect(recruitment.recruiterCv).toHaveBeenCalledWith('recruiter', 'app');
    expect(file).toBeInstanceOf(StreamableFile);
    expect(recruitment.decideApplication).toHaveBeenCalledWith(
      'recruiter',
      'app',
      'hired',
    );
  });
});
