import { Injectable } from '@nestjs/common';
import { SKILL_DICTIONARY } from '../constants/skill-dictionary.constants.js';
import { SkillDictionaryService } from './skill-dictionary.service.js';
import { NlpService } from './nlp.service.js';
import type {
  AnalyzeExperienceInput,
  AnalyzeExperienceResponse,
  DetectedSkillResponse,
  MatchingInput,
  MatchingResult,
} from '../types/matching.types.js';
import { SkillDictionaryService as ExternalSkillDictionaryService } from '../../job-connect/services/skill-dictionary.service.js';
import { SkillsClassifierService } from './skills-classifier.service.js';

@Injectable()
export class MatchingService {
  private readonly dictionary = new SkillDictionaryService();
  private readonly nlp = new NlpService();
  constructor(
    private readonly skillDictionaryService: ExternalSkillDictionaryService = new ExternalSkillDictionaryService(),
    private readonly skillsClassifierService: SkillsClassifierService = new SkillsClassifierService(new NlpService()),
  ) {}
  analyzeExperience(input: AnalyzeExperienceInput): AnalyzeExperienceResponse {
    const startedAt = performance.now();
    const textToProcess = input.text || '';
    const { skills: rawSkills } = this.skillDictionaryService.extract(textToProcess);

    const text = this.dictionary.normalizeTerm(input.text ?? '');
    const tokens = this.nlp.tokenizeAndFilter(this.nlp.normalizeText(text));
    const candidates = new Set([
      ...tokens,
      ...this.nlp.generateNGrams(tokens),
      ...this.dictionary.protectedTokens(text),
    ]);
    const skills: DetectedSkillResponse[] = SKILL_DICTIONARY.filter(
      ({ aliases }) =>
        aliases.some(
          (alias) =>
            candidates.has(alias.replaceAll(' ', '_')) ||
            this.dictionary.contains(text, alias),
        ),
    ).map(({ name }) => ({ id: this.dictionary.canonicalize(name), name }));

    return {
      experienceId: input.experienceId,
      skills: [...new Map([...skills, ...this.skillsClassifierService.classify(rawSkills, skills)].map((skill) => [skill.id, skill])).values()],
      processingTimeMs: Math.round(performance.now() - startedAt),
    };
  }

  intersectRequirements(input: MatchingInput): MatchingResult {
    const careerMatch =
      !input.requiredCareer ||
      input.userCareer.toLowerCase() === input.requiredCareer.toLowerCase();

    const experienceMatch =
      input.userExperienceYears >= input.minimumExperienceYears;

    const userSkills = new Set(
      input.userSkills.map((skill) => skill.toLowerCase()),
    );

    const matchedSkills = input.requiredSkills.filter((skill) =>
      userSkills.has(skill.toLowerCase()),
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
