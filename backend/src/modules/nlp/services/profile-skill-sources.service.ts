import { Injectable } from '@nestjs/common';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { ProfileService } from '../../profile/services/profile.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import { RadarEvidenceSourcesService } from '../../radar-integration/services/radar-evidence-sources.service.js';
import type { NlpTextSource } from '../types/nlp-text-source.type.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';

const joinText = (title: string, description: string | null) =>
  [title, description].filter((part) => Boolean(part?.trim())).join('.\n');

@Injectable()
export class ProfileSkillSourcesService {
  constructor(
    private readonly educations: EducationSourcesService,
    private readonly workExperience: WorkExperienceSourcesService,
    private readonly profile: ProfileService,
    private readonly skills: SkillAnalysisService,
    private readonly certifications: CertificationSourcesService,
    private readonly radarEvidence: RadarEvidenceSourcesService,
  ) {}

  ensureProfileExists(userId: string): Promise<void> {
    return this.profile.ensureProfileExists(userId);
  }

  async findTextSources(userId: string): Promise<NlpTextSource[]> {
    const [
      workExperiences,
      educations,
      certifications,
      cvTexts,
      certificateSkills,
      presentation,
    ] = await Promise.all([
      this.workExperience.findAnalysisSources(userId),
      this.educations.findAnalysisSources(userId),
      this.certifications.findManyByUserId(userId),
      this.radarEvidence.findCurrentCvText(userId),
      this.radarEvidence.findCertificateSkills(userId),
      this.profile.getProfile(userId),
    ]);

    const introduction = joinText(
      presentation.headline ?? '',
      presentation.aboutMe,
    );
    return [
      ...(introduction
        ? [{ id: userId, type: 'presentation' as const, text: introduction }]
        : []),
      ...workExperiences.map((record): NlpTextSource => ({
        id: record.id,
        type: 'work-experience',
        text: joinText(record.position, record.description),
      })),
      ...educations.map((record): NlpTextSource => ({
        id: record.id,
        type: 'education',
        text: joinText(record.degree, record.description),
      })),
      ...certifications.map((record): NlpTextSource => ({
        id: record.id,
        type: 'certification',
        text: [record.name, record.issuingOrganization]
          .filter(Boolean)
          .join('. '),
      })),
      ...cvTexts,
      ...certificateSkills,
    ];
  }

  findCatalog(): Promise<NlpCatalogSkill[]> {
    return this.skills.findCatalog();
  }
}
