import { containsNormalizedText } from '../../common/prisma/contains-normalized-text.js';
import { Prisma } from '../../prisma/client.js';

export function matchingWorkExperienceUserIds(term: string): Prisma.Sql {
  return Prisma.sql`
    SELECT we.user_id FROM work_experiences we
    WHERE ${containsNormalizedText(Prisma.sql`we.position`, term)}
       OR ${containsNormalizedText(Prisma.sql`coalesce(we.description, '')`, term)}
  `;
}
