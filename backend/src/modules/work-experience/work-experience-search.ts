import { containsNormalizedText } from '../../common/prisma/contains-normalized-text.js';
import { Prisma } from '../../prisma/client.js';

export function matchesWorkExperience(userId: Prisma.Sql, term: string): Prisma.Sql {
  return Prisma.sql`EXISTS (
    SELECT 1 FROM work_experiences we WHERE we.user_id = ${userId}
      AND (${containsNormalizedText(Prisma.sql`we.position`, term)}
        OR ${containsNormalizedText(Prisma.sql`coalesce(we.description, '')`, term)})
  )`;
}
