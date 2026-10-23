import { Injectable } from '@nestjs/common';
import type {
  AnalyzeExperienceInput,
  AnalyzeExperienceResponse,
  DetectedSkillResponse,
  MatchingInput,
  MatchingResult,
} from '../types/matching.types.js';
import { SkillDictionaryService } from '../../job-connect/services/skill-dictionary.service.js';
import { SkillCatalogService } from '../../skills/services/skill-catalog.service.js';
import { SkillsClassifierService } from './skills-classifier.service.js';
import { NlpService } from './nlp.service.js';

@Injectable()
export class MatchingService {
  constructor(
    private readonly skillDictionaryService: SkillDictionaryService,
    private readonly skillsClassifierService: SkillsClassifierService,
    private readonly skillCatalogService: SkillCatalogService,
    private readonly nlpService: NlpService,
  ) {}

  async analyzeExperience(input: AnalyzeExperienceInput): Promise<AnalyzeExperienceResponse> {
    const startedAt = performance.now();
    const textToProcess = input.text || '';

    const normalizedText = this.nlpService.normalizeText(textToProcess);
    const tokens = this.nlpService.tokenizeAndFilter(textToProcess);

    const { skills: rawSkills } = this.skillDictionaryService.extract(textToProcess);
    const skills = rawSkills.length > 0 ? await this.detectCatalogSkills(rawSkills) : [];

    const processingTimeMs = Math.round(performance.now() - startedAt);

    return {
      experienceId: input.experienceId,
      skills,
      processingTimeMs,
    };
  }

  private async detectCatalogSkills(rawSkills: string[]): Promise<DetectedSkillResponse[]> {
    const catalog = await this.skillCatalogService.listCatalog({});
    const detectable = catalog.map(({ id, name }) => ({ id, name }));
    return this.skillsClassifierService.classify(rawSkills, detectable);
  }

  
  async linkDetectedSkillsToExperience(
    experienceId: string,
    skillIds: string[]
  ): Promise<void> {
    if (!skillIds || skillIds.length === 0) {
      return;
    }
  }

  intersectRequirements(input: MatchingInput): MatchingResult {
    const normalize = (value: string): string =>
      value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const careerMatch =
      !input.requiredCareer ||
      normalize(input.userCareer) === normalize(input.requiredCareer);

    const experienceMatch =
      input.userExperienceYears >= input.minimumExperienceYears;

    const userSkills = new Set(
      input.userSkills.map((skill) => normalize(skill)),
    );

    const matchedSkills = input.requiredSkills.filter((skill) =>
      userSkills.has(normalize(skill)),
    );

    const allRequiredSkillsMatch =
      matchedSkills.length === input.requiredSkills.length;

    return {
      careerMatch,
      experienceMatch,
      matchedSkills,
      allRequiredSkillsMatch,
    };
  }
}