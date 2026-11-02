import { Injectable } from '@nestjs/common';
import { SKILL_TO_TECHNICAL_AREA } from '../constants/skill-to-technical-area.catalog.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';

@Injectable()
export class MentorAffinityService {
  constructor(private readonly mentorsRepository: MentorsRepository) {}

  async findUserAreaIds(userId: string) {
    const skills = await this.mentorsRepository.findUserSkills(userId);

    if (skills.length === 0) {
      return { status: 'no_skills' as const, areaIds: new Set<string>() };
    }

    const names = new Set(
      skills.flatMap(({ skill }) => {
        if (
          skill.isCustom ||
          !Object.hasOwn(SKILL_TO_TECHNICAL_AREA, skill.name)
        ) {
          return [];
        }

        return [
          SKILL_TO_TECHNICAL_AREA[
            skill.name as keyof typeof SKILL_TO_TECHNICAL_AREA
          ],
        ];
      }),
    );

    if (names.size === 0) {
      return { status: 'unmapped_skills' as const, areaIds: new Set<string>() };
    }

    const areas = await this.mentorsRepository.findTechnicalAreasByNames([
      ...names,
    ]);
    const areaIds = new Set(areas.map(({ id }) => id));

    return {
      status: areaIds.size ? ('ready' as const) : ('unmapped_skills' as const),
      areaIds,
    };
  }

  rankMentors(
    mentors: Awaited<ReturnType<MentorsRepository['findDirectoryCandidates']>>,
    userAreaIds: ReadonlySet<string>,
  ) {
    return mentors
      .map((mentor) => {
        const mentorAreaIds = new Set(
          mentor.mentorTechnicalAreas.map(
            ({ technicalAreaId }) => technicalAreaId,
          ),
        );
        const sharedInterestsCount = [...mentorAreaIds].filter((id) =>
          userAreaIds.has(id),
        ).length;

        return { ...mentor, sharedInterestsCount };
      })
      .sort(
        (a, b) =>
          b.sharedInterestsCount - a.sharedInterestsCount ||
          a.firstName.localeCompare(b.firstName) ||
          a.lastName.localeCompare(b.lastName) ||
          a.id.localeCompare(b.id),
      );
  }
}
