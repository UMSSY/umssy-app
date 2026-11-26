import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';

@Injectable()
export class MentorDirectorySearchService {
  constructor(
    @Inject(WorkExperienceSourcesService)
    private readonly experiences: Pick<
      WorkExperienceSourcesService,
      'matchingUserIds'
    >,
    @Inject(UserSkillService)
    private readonly skills: Pick<UserSkillService, 'matchingUserIds'>,
  ) {}

  matchingUsers(userId: Prisma.Sql, term: string): Prisma.Sql {
    const experienceIds = this.experiences.matchingUserIds(term);
    const skillIds = this.skills.matchingUserIds(term);
    return Prisma.sql`(${userId} IN (${experienceIds}) OR ${userId} IN (${skillIds}))`;
  }
}
