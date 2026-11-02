import { Injectable } from '@nestjs/common';
import { USER_SKILL_SOURCES } from '../../skills/constants/user-skill.constants.js';
import { NLP_PROCESSING_STATUSES } from '../constants/nlp-processing.constants.js';
import type { ProfileSkillRadarItemResponse } from '../responses/profile-skill-radar-item.response.js';
import type { ProfileSkillsAnalysisResponse } from '../responses/profile-skills-analysis.response.js';
import type { ProfileSkillsRadarResponse } from '../responses/profile-skills-radar.response.js';
import type { NlpAnalysisOutcome } from '../types/nlp-analysis-outcome.type.js';
import type { NlpProcessingStatus } from '../types/nlp-processing-status.type.js';
import type { ProfileSkillProcessingState } from '../types/profile-skill-processing-state.type.js';
import type { ProfileSkillRow } from '../types/profile-skill-row.type.js';
import { parseEvidenceRefs } from '../utils/parse-evidence-refs.js';
import { validateSkillName } from '../utils/validate-skill-name.js';

const STATUSES: ReadonlySet<string> = new Set(Object.values(NLP_PROCESSING_STATUSES));

@Injectable()
export class ProfileSkillsRadarMapper {
  toRadarResponse(
    userId: string,
    state: ProfileSkillProcessingState | null,
    rows: readonly ProfileSkillRow[],
  ): ProfileSkillsRadarResponse {
    const status = this.toStatus(state?.status);
    const isCurrent = status === NLP_PROCESSING_STATUSES.ready && state?.processedRevision === state?.inputRevision;
    const skills = rows
      .flatMap((row) => this.toItem(row, isCurrent))
      .sort((first, second) => first.name.localeCompare(second.name, 'es'));

    return {
      userId,
      status,
      version: state?.resultVersion ?? 0,
      updatedAt: state?.updatedAt.toISOString() ?? null,
      dictionaryVersion: state?.dictionaryVersion ?? null,
      skills,
    };
  }

  toAnalysisResponse(
    snapshot: ProfileSkillsRadarResponse,
    outcome: NlpAnalysisOutcome,
  ): ProfileSkillsAnalysisResponse {
    return {
      ...snapshot,
      analysis: { discarded: outcome.discarded, rejectedSources: outcome.rejectedSources },
    };
  }

  private toItem(row: ProfileSkillRow, isCurrent: boolean): ProfileSkillRadarItemResponse[] {
    const isNlp = row.source === USER_SKILL_SOURCES.nlp;
    const nameCheck = validateSkillName(row.skill.name);
    if ((isNlp && !isCurrent) || !nameCheck.isValid) return [];

    return [{
      id: row.skillId,
      text: nameCheck.name,
      name: nameCheck.name,
      source: isNlp ? USER_SKILL_SOURCES.nlp : USER_SKILL_SOURCES.manual,
      areaId: row.skill.areaId,
      verificationStatus: row.verificationStatus,
      isHighRelevance: isCurrent && row.isHighRelevance,
      evidenceRefs: isCurrent ? parseEvidenceRefs(row.evidenceRefs) : [],
    }];
  }

  private toStatus(value: string | undefined): NlpProcessingStatus {
    return value && STATUSES.has(value) ? (value as NlpProcessingStatus) : NLP_PROCESSING_STATUSES.pending;
  }
}
