import { FIXTURE_PDF } from '../../../common/constants/seed-fixture-document.constants.js';
import { FIXTURE_USERS } from '../constants/seed-fixture-users.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedUsersFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.UserCreateManyInput[] = FIXTURE_USERS.map((user) => {
    const number = String(user.number).padStart(2, '0');
    return {
      id: context.getId(user.key),
      firstName: user.firstName,
      lastName: user.lastName,
      email: `seed.user${number}@umssy.test`,
      password: '$2b$10$SGuj5IRujU5usBlVbAoDReuM2PeOD74IjT/3GGnWk2FoiCVCKeWxm',
      isActive: user.isActive,
      isAvailableForMentoring: user.roles.includes('mentor'),
      photoUrl: null,
      cityId: context.getReference('cities', user.city),
      phone: String(user.number).padStart(8, '0'),
      personalEmail: `seed.personal${number}@example.invalid`,
      headline: `Perfil ficticio: ${user.roles.join(' / ')}`,
      aboutMe: `[UMSSY SEED V1] Persona ficticia ${number}. Interés en ${user.interest} y aprendizaje colaborativo. No representa a una persona real.`,
      createdAt: context.anchor,
      updatedAt: context.anchor,
    };
  });
  await tx.user.createMany({ data, skipDuplicates: true });
  await tx.userCvFile.createMany({
    data: FIXTURE_USERS.map((user) => ({
      id: context.getId(`cv-${user.key}`),
      userId: context.getId(user.key),
      cvFileName: 'CV.pdf',
      cvUploadedAt: context.anchor,
      cvPdfData: FIXTURE_PDF.toString('base64'),
    })),
    skipDuplicates: true,
  });
  return data.length;
}
