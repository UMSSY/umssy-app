import { Injectable } from '@nestjs/common';
import { NLP_SKILL_DICTIONARY } from '../constants/nlp-dictionary.constants.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';
import type { NlpDetectedSkillEvidence } from '../types/nlp-detected-skill-evidence.type.js';
import type { NlpInput } from '../types/nlp-input.type.js';
import type { NlpSkillCandidate } from '../types/nlp-skill-candidate.type.js';
import { buildAliasIndex } from '../utils/build-alias-index.js';
import { detectSkillMentions } from '../utils/detect-skill-mentions.js';
import { normalizeTerm } from '../utils/normalize-term.js';

@Injectable()
export class SkillDetectionService {
  detect(
    input: NlpInput,
    catalog: readonly NlpCatalogSkill[] = [],
  ): NlpSkillCandidate[] {
    const dictionaryNames = new Set(
      NLP_SKILL_DICTIONARY.map((entry) => normalizeTerm(entry.name)),
    );

    const catalogEntries = catalog
      .filter((skill) => !dictionaryNames.has(normalizeTerm(skill.name)))
      .map((skill) => ({
        name: skill.name,
        aliases: [skill.name],
      }));

    const aliasIndex = buildAliasIndex([
      ...NLP_SKILL_DICTIONARY,
      ...catalogEntries,
    ]);

    const evidenceBySkill = new Map<string, NlpDetectedSkillEvidence>();

    for (const source of input.sources) {
      const detectedNames = detectSkillMentions(source.text, aliasIndex);

      for (const name of detectedNames) {
        const current = evidenceBySkill.get(name) ?? {
          name,
          evidenceRefs: [],
        };

        const alreadyRegistered = current.evidenceRefs.some(
          (ref) => ref.type === source.type && ref.id === source.id,
        );

        if (!alreadyRegistered) {
          current.evidenceRefs.push({
            type: source.type,
            id: source.id,
          });
        }

        evidenceBySkill.set(name, current);
      }
    }

    return [...evidenceBySkill.values()].map(({ name, evidenceRefs }) => ({
      name,
      evidenceRefs,
    }));
  }
}
