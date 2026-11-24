import { containsNormalizedText } from '../../common/prisma/contains-normalized-text.js';
import { Prisma } from '../../prisma/client.js';

export function matchesUserSkill(userId: Prisma.Sql, term: string): Prisma.Sql {
  return Prisma.sql`EXISTS (
    SELECT 1 FROM user_skills us JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = ${userId} AND ${containsNormalizedText(Prisma.sql`s.name`, term)}
  )`;
}
