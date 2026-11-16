import { Injectable } from '@nestjs/common';
import type { OwnSkillResponse } from '../responses/own-skill.response.js';
import type { SkillResponse } from '../responses/skill.response.js';
import type { SkillRecord } from '../types/skill-record.type.js';
import type { UserSkillRecord } from '../types/user-skill-record.type.js';
import { resolveSkillOrigins } from '../utils/resolve-skill-origins.js';

@Injectable()
export class SkillMapper {
  toResponse(record: SkillRecord): SkillResponse {
    return { id: record.id, name: record.name, isCustom: record.isCustom };
  }

  toUserSkillResponse(record: UserSkillRecord): SkillResponse {
    return this.toResponse(record.skill);
  }

  toOwnSkillResponse(record: UserSkillRecord): OwnSkillResponse {
    return {
      ...this.toResponse(record.skill),
      origins: resolveSkillOrigins(record.source, record.evidenceRefs),
    };
  }
}
