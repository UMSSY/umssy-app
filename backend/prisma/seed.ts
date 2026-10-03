import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/prisma/client.js';
import bcrypt from 'bcrypt';
import { buildDatabaseConnectionString } from '../src/common/prisma/build-connection-string.js';
import { ROLE_NAMES } from '../src/common/enums/roles.enum.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: buildDatabaseConnectionString() }),
});

async function main() {
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  const tituladoRole = await prisma.role.findUniqueOrThrow({ where: { name: 'titulado' } });
  const password = await bcrypt.hash('Prueba123', 10);

  const testUser = await prisma.user.upsert({
    where: { email: 'prueba@umss.edu.bo' },
    update: { password },
    create: {
      firstName: 'Usuario',
      lastName: 'De Prueba',
      email: 'prueba@umss.edu.bo',
      password,
    },
  });

  const existingUserRole = await prisma.userRole.findFirst({
    where: { userId: testUser.id, roleId: tituladoRole.id, deletedAt: null },
  });
  if (!existingUserRole) {
    await prisma.userRole.create({ data: { userId: testUser.id, roleId: tituladoRole.id } });
  }

  console.log('Roles creados:', ROLE_NAMES.join(', '));
  console.log('Usuario de prueba: prueba@umss.edu.bo / Prueba123 (rol: titulado)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
