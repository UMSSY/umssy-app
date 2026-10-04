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

    // --- Eventos & pases (HU-08-03) ---
  const category = await prisma.eventCategory.upsert({
    where: { id: '22222222-2222-2222-2222-222222222221' },
    update: {},
    create: { id: '22222222-2222-2222-2222-222222222221', name: 'Tecnología' },
  });
  const modality = await prisma.eventModality.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: { id: '22222222-2222-2222-2222-222222222222', title: 'Presencial' },
  });
  const origin = await prisma.eventOrigin.upsert({
    where: { id: '22222222-2222-2222-2222-222222222223' },
    update: {},
    create: { id: '22222222-2222-2222-2222-222222222223', title: 'Institucional' },
  });
  const eventStatus = await prisma.eventStatus.upsert({
    where: { id: '22222222-2222-2222-2222-222222222224' },
    update: {},
    create: { id: '22222222-2222-2222-2222-222222222224', title: 'Publicado' },
  });
  const regStatus = await prisma.registrationStatus.upsert({
    where: { id: '22222222-2222-2222-2222-222222222225' },
    update: {},
    create: { id: '22222222-2222-2222-2222-222222222225', title: 'Confirmada' },
  });

  const events = [
    { id: '33333333-3333-3333-3333-333333333331', title: 'Taller de NestJS', date: '2026-10-20', location: 'Aula 101', enroll: true },
    { id: '33333333-3333-3333-3333-333333333332', title: 'Taller de Prisma', date: '2026-10-25', location: 'Laboratorio 2', enroll: true },
    { id: '33333333-3333-3333-3333-333333333333', title: 'Taller de Vitest', date: '2026-11-02', location: 'Aula 203', enroll: false },
  ];

  for (const e of events) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        title: e.title,
        description: 'Evento de prueba',
        instructorName: 'Instructor Demo',
        eventDate: new Date(e.date),
        startTime: new Date('1970-01-01T09:00:00.000Z'),
        endTime: new Date('1970-01-01T12:00:00.000Z'),
        location: e.location,
        capacity: 30,
        supportThreshold: 0,
        categoryId: category.id,
        modalityId: modality.id,
        originId: origin.id,
        statusId: eventStatus.id,
        createdById: testUser.id,
      },
    });

    if (e.enroll) {
      await prisma.eventRegistration.upsert({
        where: { eventId_userId: { eventId: e.id, userId: testUser.id } },
        update: {},
        create: {
          eventId: e.id,
          userId: testUser.id,
          statusId: regStatus.id,
          qrToken: `qr-seed-${e.id.slice(-4)}`,
        },
      });
    }
  }

    console.log('Eventos de prueba creados; usuario inscrito en 2 de 3');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
