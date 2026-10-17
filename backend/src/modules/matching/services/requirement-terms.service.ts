import { Injectable } from '@nestjs/common';
import { SkillDictionaryService } from '../../job-connect/services/skill-dictionary.service.js';
import type { RequirementTermsResponse } from '../types/matching.types.js';
import { findInstitutionTerms } from '../utils/find-institution-terms.js';
import { NlpService } from './nlp.service.js';

@Injectable()
export class RequirementTermsService {
  constructor(
    private readonly nlpService: NlpService,
    private readonly skillDictionaryService: SkillDictionaryService,
  ) {}

  extract(text: string): RequirementTermsResponse {
    const tokens = this.nlpService.tokenizeAndFilter(text);
    const terms = [
      ...new Set([...this.nlpService.extractRequirementTerms(text), ...findInstitutionTerms(text)]),
    ];
    const { skills, institutions } = this.skillDictionaryService.extract(text);

    return { tokens, terms, skills, institutions };
  }
}
