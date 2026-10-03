import { Injectable } from '@nestjs/common';
import {
  normalizeTerm,
  SkillDictionaryService,
} from './skill-dictionary.service.js';

type Requirements = {
  requiredSkills: string[];
  academicRequirements: string[];
  otherRequirements: string[];
};
type Profile = {
  skills: string[];
  academicQualifications: string[];
  submittedRequirements: string[];
};

@Injectable()
export class GapAnalysisService {
  constructor(private readonly dictionary: SkillDictionaryService) {}

  analyze(requirements: Requirements, profile: Profile) {
    const compare = (
      required: string[],
      possessed: string[],
      canonicalize: (value: string) => string,
    ) => {
      const owned = new Set(possessed.map(canonicalize));
      const unique = new Map<string, string>();
      for (const item of required) {
        const key = canonicalize(item);
        if (key && !unique.has(key)) unique.set(key, item.trim());
      }
      return Array.from(unique, ([key, name]) => ({
        name,
        status: owned.has(key) ? ('Cumple' as const) : ('Pendiente' as const),
      }));
    };
    const skills = compare(
      requirements.requiredSkills,
      profile.skills,
      (value) => this.dictionary.canonicalize(value),
    );
    const academicRequirements = compare(
      requirements.academicRequirements,
      profile.academicQualifications,
      normalizeTerm,
    );
    const otherRequirements = compare(
      requirements.otherRequirements,
      profile.submittedRequirements,
      normalizeTerm,
    );
    const missingSkills = skills
      .filter(({ status }) => status === 'Pendiente')
      .map(({ name }) => name);
    const complete = [
      ...skills,
      ...academicRequirements,
      ...otherRequirements,
    ].every(({ status }) => status === 'Cumple');
    return {
      skills,
      academicRequirements,
      otherRequirements,
      missingSkills,
      complete,
      message: complete
        ? 'Para esta oportunidad no tienes habilidades ni requisitos pendientes'
        : null,
    };
  }
}
