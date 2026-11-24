import { resolveMentorAreas } from '../constants/radar-mentor-areas.constants.js';
import { Prisma } from '../../../prisma/client.js';
import type { MentorDirectoryQuery } from '../requests/mentor-directory-query.schema.js';
import { MENTOR_ROLE_NAME } from '../constants/mentor.constants.js';
import { containsNormalizedText } from '../../../common/prisma/contains-normalized-text.js';
import { matchesUserSkill } from '../../skills/user-skills-search.js';
import { matchesWorkExperience } from '../../work-experience/work-experience-search.js';

export type DirectoryFilters = Pick<
  MentorDirectoryQuery,
  'search' | 'area' | 'areaIds' | 'orientation' | 'available'
>;

export function directoryPredicate(
  filters: DirectoryFilters,
  now: Date,
): Prisma.Sql {
  const conditions = [
    Prisma.sql`u.is_active = true AND EXISTS (
    SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id AND ur.deleted_at IS NULL
      AND ur.start_at <= ${now} AND r.name = ${MENTOR_ROLE_NAME}
  )`,
  ];
  if (filters.available)
    conditions.push(Prisma.sql`u.is_available_for_mentoring = true`);
  if (filters.areaIds?.length) {
    const ids = filters.areaIds.map((id) => Prisma.sql`${id}::uuid`);
    conditions.push(Prisma.sql`EXISTS (
    SELECT 1 FROM mentor_technical_areas mta
    WHERE mta.mentor_id = u.id AND mta.technical_area_id IN (${Prisma.join(ids)})
  )`);
  } else if (filters.area)
    conditions.push(Prisma.sql`EXISTS (
    SELECT 1 FROM mentor_technical_areas mta JOIN technical_areas ta ON ta.id = mta.technical_area_id
    WHERE mta.mentor_id = u.id AND (ta.id::text = ${filters.area} OR ta.name IN (${Prisma.join(resolveMentorAreas(filters.area))}))
  )`);
  if (filters.orientation)
    conditions.push(Prisma.sql`EXISTS (
    SELECT 1 FROM mentor_orientation_types mot JOIN orientation_types ot ON ot.id = mot.orientation_type_id
    WHERE mot.mentor_id = u.id AND ot.is_active = true AND ot.name = ${filters.orientation}
  )`);
  for (const term of filters.search.trim().split(/\s+/).filter(Boolean)) {
    conditions.push(Prisma.sql`(
      ${containsNormalizedText(Prisma.sql`u.first_name`, term)}
      OR ${containsNormalizedText(Prisma.sql`u.last_name`, term)}
      OR ${containsNormalizedText(Prisma.sql`coalesce(u.headline, '')`, term)}
      OR ${containsNormalizedText(Prisma.sql`coalesce(u.about_me, '')`, term)}
      OR ${matchesWorkExperience(Prisma.sql`u.id`, term)}
      OR EXISTS (SELECT 1 FROM mentor_technical_areas mta JOIN technical_areas ta ON ta.id = mta.technical_area_id
        WHERE mta.mentor_id = u.id AND ${containsNormalizedText(Prisma.sql`ta.name`, term)})
      OR ${matchesUserSkill(Prisma.sql`u.id`, term)}
    )`);
  }
  return Prisma.join(conditions, ' AND ');
}

export function directoryOrder(
  sort: 'default' | 'name_asc' | 'name_desc',
): Prisma.Sql {
  if (sort === 'name_asc')
    return Prisma.sql`u.first_name ASC, u.last_name ASC, u.id ASC`;
  if (sort === 'name_desc')
    return Prisma.sql`u.first_name DESC, u.last_name DESC, u.id ASC`;
  return Prisma.sql`u.created_at ASC, u.id ASC`;
}
