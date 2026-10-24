import { Injectable } from '@nestjs/common';
import { NLP_SKILL_DICTIONARY } from '../constants/nlp-dictionary.constants.js';
import {
  NLP_SOURCE_TEXT_MAX_LENGTH,
  NLP_VALIDATION_MESSAGES,
} from '../constants/nlp-validation.constants.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';
import type { NlpDetectedSkill } from '../types/nlp-detected-skill.type.js';
import type { NlpDetectionValidation } from '../types/nlp-detection-validation.type.js';
import type { NlpEvidenceRef } from '../types/nlp-evidence-ref.type.js';
import type { NlpSkillCandidate } from '../types/nlp-skill-candidate.type.js';
import type { NlpSourceValidation } from '../types/nlp-source-validation.type.js';
import type { NlpTextSource } from '../types/nlp-text-source.type.js';
import { normalizeTerm } from '../utils/normalize-term.js';
import { sortEvidenceRefs } from '../utils/sort-evidence-refs.js';
import { validateSkillName } from '../utils/validate-skill-name.js';

@Injectable()
export class SkillValidationService {
  private readonly dictionaryByName = new Map(NLP_SKILL_DICTIONARY.map((entry) => [entry.name, entry]));

  // Rejects whole texts: a text over the limit is reported instead of being truncated without notice.
  validateSources(sources: readonly NlpTextSource[]): NlpSourceValidation {
    const validation: NlpSourceValidation = { accepted: [], rejected: [] };
    for (const source of sources) {
      if (source.text.length <= NLP_SOURCE_TEXT_MAX_LENGTH) {
        validation.accepted.push(source);
        continue;
      }
      validation.rejected.push({
        id: source.id,
        type: source.type,
        reason: 'source-too-long',
        message: NLP_VALIDATION_MESSAGES['source-too-long'],
      });
    }
    return validation;
  }

  // Discards keywords: a detection only survives when the official catalog has that skill.
  validateDetected(
    candidates: readonly NlpSkillCandidate[],
    catalog: readonly NlpCatalogSkill[],
  ): NlpDetectionValidation {
    const catalogByName = new Map(catalog.map((skill) => [normalizeTerm(skill.name), skill]));
    const evidenceBySkill = new Map<string, { skill: NlpCatalogSkill; name: string; refs: NlpEvidenceRef[] }>();
    const validation: NlpDetectionValidation = { accepted: [], discarded: [] };

    for (const candidate of candidates) {
      const skill = this.findCatalogSkill(candidate.name, catalogByName);
      if (!skill) {
        validation.discarded.push(this.discard(candidate.name, 'not-in-catalog'));
        continue;
      }
      const nameCheck = validateSkillName(skill.name);
      if (!nameCheck.isValid) {
        validation.discarded.push(this.discard(candidate.name, nameCheck.reason));
        continue;
      }
      const current = evidenceBySkill.get(skill.id) ?? { skill, name: nameCheck.name, refs: [] };
      current.refs.push(...candidate.evidenceRefs);
      evidenceBySkill.set(skill.id, current);
    }

    validation.accepted = [...evidenceBySkill.values()].map(
      ({ skill, name, refs }): NlpDetectedSkill => ({
        id: skill.id,
        name,
        source: 'nlp',
        verificationStatus: 'pending',
        evidenceRefs: sortEvidenceRefs(refs),
      }),
    );
    return validation;
  }

  private findCatalogSkill(
    skillName: string,
    catalogByName: ReadonlyMap<string, NlpCatalogSkill>,
  ): NlpCatalogSkill | undefined {
    const entry = this.dictionaryByName.get(skillName);
    const names = [skillName, ...(entry?.aliases ?? []), ...(entry?.ambiguousAliases ?? [])];
    return names.map((name) => catalogByName.get(normalizeTerm(name))).find(Boolean);
  }

  private discard(name: string, reason: keyof typeof NLP_VALIDATION_MESSAGES) {
    return { name, reason, message: NLP_VALIDATION_MESSAGES[reason] };
  }
}
