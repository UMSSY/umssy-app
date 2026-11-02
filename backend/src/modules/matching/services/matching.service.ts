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
import { WorkExperienceNotFoundException } from '../../work-experience/exceptions/work-experience-not-found.exception.js';
import { ExperienceSkillsRepository } from '../repositories/experience-skills.repository.js';
import { SkillsClassifierService } from './skills-classifier.service.js';
import { NlpService } from './nlp.service.js';

@Injectable()
export class MatchingService {
  constructor(
    private readonly skillDictionaryService: SkillDictionaryService,
    private readonly skillsClassifierService: SkillsClassifierService,
    private readonly skillCatalogService: SkillCatalogService,
    private readonly nlpService: NlpService,
    private readonly experienceSkillsRepository: ExperienceSkillsRepository,
  ) {}

  async analyzeExperience(
    userId: string,
    input: AnalyzeExperienceInput,
  ): Promise<AnalyzeExperienceResponse> {
    if (
      !(await this.experienceSkillsRepository.belongsToUser(
        input.experienceId,
        userId,
      ))
    ) {
      throw new WorkExperienceNotFoundException();
    }

    const startedAt = performance.now();
    const skills = await this.detectSkills(input.text ?? '');
    const processingTimeMs = Math.round(performance.now() - startedAt);

    await this.experienceSkillsRepository.replaceDetected(
      userId,
      input.experienceId,
      skills.map(({ id }) => id),
    );

    return { experienceId: input.experienceId, skills, processingTimeMs };
  }

  private async detectSkills(text: string): Promise<DetectedSkillResponse[]> {
    if (text.trim().length === 0) return [];

    const candidates = [
      ...this.skillDictionaryService.extract(text).skills,
      ...this.nlpService.extractRequirementTerms(text),
    ];
    return candidates.length > 0 ? this.detectCatalogSkills(candidates) : [];
  }

  private async detectCatalogSkills(
    candidates: string[],
  ): Promise<DetectedSkillResponse[]> {
    const catalog = (await this.skillCatalogService.listCatalog({})).map(
      ({ id, name }) => ({ id, name }),
    );
    return this.skillsClassifierService.classify(candidates, catalog);
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