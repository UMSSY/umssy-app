import { StreamableFile } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RadarIntegrationController } from '../radar-integration.controller.js';
import type { RadarIntegrationService } from '../radar-integration.service.js';
import type { RadarRecruitmentService } from '../radar-recruitment.service.js';

function setup() {
  const svc = {
    myRadar: vi.fn(),
    rescanCurrentCv: vi.fn(),
    retry: vi.fn(),
    queue: vi.fn(),
    decision: vi.fn(),
    reprocessCv: vi.fn(),
    downloadForAdmin: vi.fn(),
  };
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
  const controller = new RadarIntegrationController(
    svc as unknown as RadarIntegrationService,
    recruitment as unknown as RadarRecruitmentService,
  );
  return { svc, recruitment, controller };
}

describe('RadarIntegrationController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('conserva los endpoints administrativos y de candidato del Epic', async () => {
    const { svc, controller } = setup();
    svc.downloadForAdmin.mockResolvedValue({ buffer: Buffer.from('pdf') });

    await controller.me('user');
    await controller.rescan('user');
    await controller.recalculate('user');
    await controller.queue('admin');
    await controller.decision('admin', 'cv', 'id', { decision: 'approved' });
    await controller.reprocessCv('admin', 'id');
    const file = await controller.download('admin', 'id');

    expect(svc.myRadar).toHaveBeenCalledWith('user');
    expect(svc.rescanCurrentCv).toHaveBeenCalledWith('user');
    expect(svc.retry).toHaveBeenCalledWith('user');
    expect(svc.queue).toHaveBeenCalledWith('admin');
    expect(svc.decision).toHaveBeenCalledWith(
      'admin',
      'cv',
      'id',
      'approved',
    );
    expect(svc.reprocessCv).toHaveBeenCalledWith('admin', 'id');
    expect(file).toBeInstanceOf(StreamableFile);
  });

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
