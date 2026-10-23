import type { Prisma } from '../../../prisma/client.js';
import { SEED_JOB_OFFER_SKILLS } from '../../job-offers/constants/seed-job-offers.constants.js';

export async function seedSkillsCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  const names = [
    ...SEED_JOB_OFFER_SKILLS,
    'HTML5',
    'CSS3',
    'NestJS',
    'Next.js',
    'Tailwind CSS',
    'C++',
    'C#',
    'Spring Boot',
  ];
  await tx.skill.createMany({
    data: names.map((name) => ({ name, isCustom: false })),
    skipDuplicates: true,
  });
}
