import { Injectable } from '@nestjs/common';
import type { SkillResponse } from '../responses/skill.response.js';
import type { SkillRecord } from '../types/skill-record.type.js';
import type { OwnUserSkillRecord } from '../types/own-user-skill-record.type.js';
import type { UserSkillRecord } from '../types/user-skill-record.type.js';
import type { OwnSkillResponse } from '../responses/own-skill.response.js';
import { summarizeSkillOrigin } from '../utils/summarize-skill-origin.js';

@Injectable()
export class SkillMapper {
  toResponse(record: SkillRecord): SkillResponse {
    return { id: record.id, name: record.name, isCustom: record.isCustom };
  }

  toUserSkillResponse(record: UserSkillRecord): SkillResponse {
    return this.toResponse(record.skill);
  }

  toOwnSkillResponse(record: OwnUserSkillRecord): OwnSkillResponse {
    return {
      ...this.toResponse(record.skill),
      ...summarizeSkillOrigin(record.source, record.evidenceRefs),
    };
  }
}
