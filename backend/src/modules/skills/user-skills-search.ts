import { containsNormalizedText } from '../../common/prisma/contains-normalized-text.js';
import { Prisma } from '../../prisma/client.js';

export function matchingSkillUserIds(term: string): Prisma.Sql {
  return Prisma.sql`
    SELECT us.user_id FROM user_skills us JOIN skills s ON s.id = us.skill_id
    WHERE ${containsNormalizedText(Prisma.sql`s.name`, term)}
  `;
}
