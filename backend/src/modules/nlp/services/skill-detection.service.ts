
import { Injectable } from '@nestjs/common';
import { NLP_SKILL_DICTIONARY } from '../constants/nlp-dictionary.constants.js';
import type { NlpEvidenceRef } from '../types/nlp-evidence-ref.type.js';
import type { NlpInput } from '../types/nlp-input.type.js';
import type { NlpSkillCandidate } from '../types/nlp-skill-candidate.type.js';
import { buildAliasIndex } from '../utils/build-alias-index.js';
import { detectSkillMentions } from '../utils/detect-skill-mentions.js';

@Injectable()
export class SkillDetectionService {
  private readonly aliasIndex = buildAliasIndex(NLP_SKILL_DICTIONARY);

  detect(input: NlpInput): NlpSkillCandidate[] {
    const evidenceBySkill = new Map<
      string,
      {
        name: string;
        evidenceRefs: NlpEvidenceRef[];
      }
    >();

    for (const source of input.sources) {
      const detectedNames = detectSkillMentions(
        source.text,
        this.aliasIndex,
      );

      for (const name of detectedNames) {
        const current = evidenceBySkill.get(name) ?? {
          name,
          evidenceRefs: [],
        };

        const alreadyRegistered = current.evidenceRefs.some(
          (ref) =>
            ref.type === source.type &&
            ref.id === source.id,
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

    return [...evidenceBySkill.values()].map(
      ({ name, evidenceRefs }) => ({
        name,
        evidenceRefs,
      }),
    );
  }
}
