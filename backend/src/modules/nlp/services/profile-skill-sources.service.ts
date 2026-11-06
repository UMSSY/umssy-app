import { Injectable } from '@nestjs/common';
import { CvService } from '../../cv/services/cv.service.js';
import { CertificationDocumentsService } from '../../certification-documents/services/certification-documents.service.js';
import { DocumentSkillTextExtractorService } from './document-skill-text-extractor.service.js';
import { NlpDocumentReadException } from '../exceptions/nlp-document-read.exception.js';
import { NLP_DOCUMENT_LIMITS } from '../constants/nlp-document.constants.js';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { ProfileService } from '../../profile/services/profile.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
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
    private readonly cvs: CvService,
    private readonly certifications: CertificationDocumentsService,
    private readonly extractor: DocumentSkillTextExtractorService,
  ) {}

  ensureProfileExists(userId: string): Promise<void> {
    return this.profile.ensureProfileExists(userId);
  }

  async findTextSources(userId: string): Promise<NlpTextSource[]> {
    const [workExperiences, educations] = await Promise.all([
      this.workExperience.findAnalysisSources(userId),
      this.educations.findAnalysisSources(userId),
    ]);
    return [
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
      ...await this.findDocumentSources(userId),
    ];
  }

  private async findDocumentSources(userId: string): Promise<NlpTextSource[]> {
    const startedAt = Date.now();
    const [cvs, ids] = await Promise.all([
      this.cvs.list(userId, { page: 1, limit: 1 }),
      this.certifications.findDocumentIds(userId),
    ]);
    const current = cvs.items.find((cv) => cv.isCurrent);
    const sources: NlpTextSource[] = [];
    const read = async (id: string, type: 'cv' | 'certification') => {
      try {
        if (Date.now() - startedAt >= NLP_DOCUMENT_LIMITS.profileTimeoutMs || sources.length >= NLP_DOCUMENT_LIMITS.maxDocuments) {
          throw new Error('Document analysis limit reached');
        }
        const file = type === 'cv'
          ? await this.cvs.getFileById(userId, id)
          : await this.certifications.getFile(userId, id);
        const text = await this.extractor.extract(file.content, file.mimeType);
        sources.push({ id, type, text });
      } catch { throw new NlpDocumentReadException(id, type); }
    };
    if (current) await read(current.id, 'cv');
    for (const id of ids) await read(id, 'certification');
    return sources;
  }

  findCatalog(): Promise<NlpCatalogSkill[]> {
    return this.skills.findCatalog();
  }
}
