import { describe, expect, it, vi } from 'vitest';
import type { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import type { UsersService } from '../../users/services/users.service.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import type { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import type { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import type { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import type { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { RadarRecruitmentSourcesService } from '../services/radar-recruitment-sources.service.js';

function setup() {
  const jobs = {
    publishedRecruitmentJob: vi.fn(),
    recruiterVacancies: vi.fn(),
  };
  const users = { findRecruitmentProfile: vi.fn() };
  const skills = { findApprovedRecruitmentReferences: vi.fn() };
  const education = { findRecruitmentEvidence: vi.fn() };
  const certifications = { findRecruitmentEvidence: vi.fn() };
  const experience = { findRecruitmentEvidence: vi.fn() };
  const cvs = { currentCv: vi.fn() };
  const service = new RadarRecruitmentSourcesService(
    jobs as unknown as JobOffersService,
    users as unknown as UsersService,
    skills as unknown as SkillAnalysisService,
    education as unknown as EducationSourcesService,
    certifications as unknown as CertificationSourcesService,
    experience as unknown as WorkExperienceSourcesService,
    cvs as unknown as CvSourcesService,
  );
  return {
    service,
    jobs,
    users,
    skills,
    education,
    certifications,
    experience,
    cvs,
  };
}

describe('RadarRecruitmentSourcesService', () => {
  it('delegates scoped reads to the owning domain services', async () => {
    const {
      service,
      jobs,
      users,
      skills,
      education,
      certifications,
      experience,
    } = setup();
    await service.publishedJob('job');
    await service.recruiterVacancies(['company']);
    await service.candidate('user');
    await service.approvedSkillReferences('user', ['skill']);
    await service.ownedEducation('user', ['education']);
    await service.ownedCertifications('user', ['certification']);
    await service.ownedExperiences('user', ['experience']);
    expect(jobs.publishedRecruitmentJob).toHaveBeenCalledWith('job');
    expect(jobs.recruiterVacancies).toHaveBeenCalledWith(['company']);
    expect(users.findRecruitmentProfile).toHaveBeenCalledWith('user');
    expect(skills.findApprovedRecruitmentReferences).toHaveBeenCalledWith(
      'user',
      ['skill'],
    );
    expect(education.findRecruitmentEvidence).toHaveBeenCalledWith('user', [
      'education',
    ]);
    expect(certifications.findRecruitmentEvidence).toHaveBeenCalledWith(
      'user',
      ['certification'],
    );
    expect(experience.findRecruitmentEvidence).toHaveBeenCalledWith('user', [
      'experience',
    ]);
  });

  it('reads the current CV of the authorized owner rather than an older approved snapshot', async () => {
    const { service, cvs } = setup();
    cvs.currentCv.mockResolvedValue({
      id: 'latest-cv',
      cvPdfData: 'new-content',
    });
    await expect(service.currentCv('user')).resolves.toEqual([
      { cv_pdf_data: 'new-content' },
    ]);
    expect(cvs.currentCv).toHaveBeenCalledWith('user');
    cvs.currentCv.mockResolvedValue(null);
    await expect(service.currentCv('user')).resolves.toEqual([]);
  });
});
