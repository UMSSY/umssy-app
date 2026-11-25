import { Prisma } from '../../prisma/client.js';

function normalized(value: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`lower(regexp_replace(normalize(${value}, NFD), ${'[\u0300-\u036f]'}, '', 'g'))`;
}

export function containsNormalizedText(value: Prisma.Sql, term: string): Prisma.Sql {
  return Prisma.sql`strpos(${normalized(value)}, ${normalized(Prisma.sql`${term}::text`)}) > 0`;
}
