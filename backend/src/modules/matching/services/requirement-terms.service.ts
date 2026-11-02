import { Injectable } from '@nestjs/common';
import { NlpService } from './nlp.service.js';
import { SkillsClassifierService } from './skills-classifier.service.js';
import { SkillCatalogService } from '../../skills/services/skill-catalog.service.js';
import type { DetectedSkillResponse } from '../types/matching.types.js';

@Injectable()
export class RequirementTermsService {
  constructor(
    private readonly nlpService: NlpService,
    private readonly skillsClassifier: SkillsClassifierService,
    private readonly skillCatalogService: SkillCatalogService,
  ) {}

  async extractAndMatchRequirements(
    requirementsText: string,
  ): Promise<DetectedSkillResponse[]> {
    if (!requirementsText || requirementsText.trim() === '') {
      return [];
    }

    const terms = this.nlpService.extractRequirementTerms(requirementsText);

    if (terms.length === 0) {
      return [];
    }

    const catalogResponse = await this.skillCatalogService.listCatalog({});

    const catalog: DetectedSkillResponse[] = catalogResponse.map((skill) => ({
      id: skill.id,
      name: skill.name,
    }));

    const matchedSkills = this.skillsClassifier.classify(terms, catalog);

    return matchedSkills;
  }
}