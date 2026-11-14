import { Injectable } from '@nestjs/common';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { UsersService } from '../../users/services/users.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import type { CurrentCvRow } from '../types/current-cv-row.type.js';

/** Lecturas entre dominios mediante las APIs de sus servicios propietarios. */
@Injectable()
export class RadarRecruitmentSourcesService {
  constructor(
    private readonly jobs: JobOffersService,
    private readonly users: UsersService,
    private readonly skills: SkillAnalysisService,
    private readonly education: EducationSourcesService,
    private readonly certifications: CertificationSourcesService,
    private readonly experience: WorkExperienceSourcesService,
    private readonly cvs: CvSourcesService,
  ) {}

  companyExists(companyId: string) {
    return this.jobs.companyExists(companyId);
  }
  activeVacancies() {
    return this.jobs.activeRecruitmentVacancies();
  }
  recruiterVacancies(companyIds: string[]) {
    return this.jobs.recruiterVacancies(companyIds);
  }
  publishedJob(jobId: string) {
    return this.jobs.publishedRecruitmentJob(jobId);
  }
  candidate(userId: string) {
    return this.users.findRecruitmentProfile(userId);
  }
  async catalogSkills() {
    return (await this.skills.findCatalog()).filter(
      (skill) => skill.areaId !== null,
    );
  }
  approvedSkillReferences(userId: string, ids: string[]) {
    return this.skills.findApprovedRecruitmentReferences(userId, ids);
  }
  ownedEducation(userId: string, ids: string[]) {
    return this.education.findRecruitmentEvidence(userId, ids);
  }
  ownedCertifications(userId: string, ids: string[]) {
    return this.certifications.findRecruitmentEvidence(userId, ids);
  }
  ownedExperiences(userId: string, ids: string[]) {
    return this.experience.findRecruitmentEvidence(userId, ids);
  }

  async currentCv(userId: string): Promise<CurrentCvRow[]> {
    const cv = await this.cvs.currentCv(userId);
    return cv?.cvPdfData ? [{ cv_pdf_data: cv.cvPdfData }] : [];
  }
  async recruiterCompanyId(userId: string) {
    return (await this.users.findCompany(userId))?.companyId ?? null;
  }
  assignCompany(userId: string, companyId: string) {
    return this.users.assignCompany(userId, companyId);
  }
}
