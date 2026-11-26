import { Injectable } from '@nestjs/common';
import type { ProfileResponse } from '../../profile/responses/profile.response.js';
import type { EducationResponse } from '../../educations/responses/education.response.js';
import type { WorkExperienceResponse } from '../../work-experience/responses/work-experience.response.js';
import type { SkillResponse } from '../../skills/responses/skill.response.js';
import type { CertificationRecord } from '../../certifications/types/certification-record.type.js';
import type { CvDocumentData } from '../types/cv-document-data.type.js';
import { formatCvDate } from '../utils/format-cv-date.util.js';

@Injectable()
export class CvGenerationMapper {
  toDocumentData(params: {
    profile: ProfileResponse;
    educations: readonly EducationResponse[];
    experiences: readonly WorkExperienceResponse[];
    skills: readonly SkillResponse[];
    certifications: readonly CertificationRecord[];
  }): CvDocumentData {
    const { profile, educations, experiences, skills, certifications } = params;

    return {
      personalInfo: {
        fullName: `${profile.firstName} ${profile.lastName}`.trim(),
        headline: profile.headline ?? undefined,
        email: profile.personalEmail ?? profile.institutionalEmail,
        phone: profile.phone ?? undefined,
        location: profile.city?.title ?? undefined,
      },
      summary: profile.aboutMe ?? undefined,
      workExperiences: experiences.map((exp) => ({
        jobTitle: exp.position,
        company: exp.companyName,
        startDate: formatCvDate(exp.startDate) ?? exp.startDate,
        endDate: formatCvDate(exp.endDate),
        isCurrent: exp.isCurrent,
        description: exp.description ?? undefined,
      })),
      educations: educations.map((edu) => ({
        degree: edu.degree,
        institution: edu.institution,
        startDate: formatCvDate(edu.startDate) ?? edu.startDate,
        endDate: formatCvDate(edu.endDate),
        description: edu.description ?? undefined,
      })),
      skills: skills.map((s) => ({
        name: s.name,
      })),
      certifications: certifications.map((c) => ({
        title: c.name,
        issuingOrganization: c.issuingOrganization,
        issueDate: formatCvDate(c.issueDate) ?? undefined,
      })),
    };
  }
}
