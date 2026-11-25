import type { PrismaService } from '../../../../common/prisma/prisma.service.js';
import { matchingSkillUserIds } from '../../../skills/user-skills-search.js';
import { matchingWorkExperienceUserIds } from '../../../work-experience/work-experience-search.js';
import { MentorsRepository } from '../../repositories/mentors.repository.js';
import { MentorDirectorySearchService } from '../../services/mentor-directory-search.service.js';

export const mentorDirectorySearch = new MentorDirectorySearchService(
  { matchingUserIds: matchingWorkExperienceUserIds },
  { matchingUserIds: matchingSkillUserIds },
);

export function makeMentorsRepository(prisma: PrismaService) {
  return new MentorsRepository(prisma, mentorDirectorySearch);
}
