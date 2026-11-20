import { Injectable } from '@nestjs/common';
import { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { PROFILE_COMPLETENESS_SECTIONS } from '../constants/profile-completeness.constants.js';
import { ProfileNotFoundException } from '../exceptions/profile-not-found.exception.js';
import { ProfileRepository } from '../repositories/profile.repository.js';
import { updatePersonalInfoSchema } from '../requests/update-personal-info.request.js';
import { updatePresentationSchema } from '../requests/update-presentation.request.js';
import type { ProfileCompletenessResponse } from '../responses/profile-completeness.response.js';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.type.js';

@Injectable()
export class ProfileCompletenessService {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly educations: EducationSourcesService,
    private readonly experiences: WorkExperienceSourcesService,
    private readonly skills: SkillAnalysisService,
    private readonly certifications: CertificationSourcesService,
    private readonly cvs: CvSourcesService,
  ) {}

  async getCompleteness(userId: string): Promise<ProfileCompletenessResponse> {
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) throw new ProfileNotFoundException();

    const [education, workExperience, skills, certifications, cv] =
      await Promise.all([
        this.educations.hasByUserId(userId),
        this.experiences.hasByUserId(userId),
        this.skills.hasProfileSkills(userId),
        this.certifications.hasByUserId(userId),
        this.cvs.hasByUserId(userId),
      ]);

    const completed: Record<ProfileCompletenessSectionId, boolean> = {
      contact: updatePersonalInfoSchema.safeParse({
        firstName: profile.firstName,
        lastName: profile.lastName,
        cityId: profile.city?.id,
        phone: profile.phone,
        personalEmail: profile.personalEmail,
      }).success,
      presentation: updatePresentationSchema.safeParse({
        headline: profile.headline,
        aboutMe: profile.aboutMe,
      }).success,
      education,
      'work-experience': workExperience,
      skills,
      certifications,
      cv,
    };

    const sections = PROFILE_COMPLETENESS_SECTIONS.map((section) => ({
      ...section,
      isCompleted: completed[section.id],
    }));

    return {
      percentage: sections.reduce(
        (total, section) => total + (section.isCompleted ? section.weight : 0),
        0,
      ),
      sections,
    };
  }
}
