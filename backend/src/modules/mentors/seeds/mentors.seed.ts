import type { Prisma, User } from '../../../prisma/client.js';

const MENTOR_EMAILS = ['mentor.a@umssy.test', 'mentor.b@umssy.test'] as const;

const MENTOR_DATA = [
  {
    email: 'mentor.a@umssy.test',
    city: 'Cochabamba',
    headline: 'Ingeniera backend y mentora de empleabilidad técnica',
    aboutMe:
      'Ayudo a estudiantes y titulados a fortalecer sus bases de backend, bases de datos y preparación profesional.',
    areas: ['Backend', 'Bases de Datos'],
    orientations: ['Orientación técnica', 'Revisión de CV'],
    skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    education: {
      institution: 'Universidad Mayor de San Simón',
      degree: 'Ingeniería de Sistemas',
      startDate: new Date('2015-02-01'),
      endDate: new Date('2020-12-15'),
      description: 'Formación en desarrollo de software y diseño de sistemas.',
    },
    company: 'TechBolivia S.R.L.',
    position: 'Líder de desarrollo backend',
    experienceDescription: 'Diseño de APIs y acompañamiento de equipos de desarrollo.',
    certification: {
      name: 'AWS Certified Cloud Practitioner',
      organization: 'Amazon Web Services',
      issueDate: new Date('2024-05-20'),
    },
  },
  {
    email: 'mentor.b@umssy.test',
    city: 'La Paz',
    headline: 'Mentor de desarrollo web y preparación para entrevistas',
    aboutMe:
      'Acompaño a personas que buscan su primera oportunidad laboral en frontend, cloud y entrevistas técnicas.',
    areas: ['Desarrollo Web', 'Cloud'],
    orientations: ['Orientación profesional', 'Preparación para entrevistas'],
    skills: ['JavaScript', 'React', 'Git', 'Linux'],
    education: {
      institution: 'Universidad Católica Boliviana',
      degree: 'Licenciatura en Informática',
      startDate: new Date('2016-02-01'),
      endDate: new Date('2021-11-30'),
      description: 'Formación en aplicaciones web, infraestructura y trabajo colaborativo.',
    },
    company: 'NovaSoft Bolivia',
    position: 'Frontend Tech Lead',
    experienceDescription: 'Construcción de productos web y mentoría de desarrolladores junior.',
    certification: {
      name: 'Professional Scrum Master I',
      organization: 'Scrum.org',
      issueDate: new Date('2023-08-10'),
    },
  },
] as const;

const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

async function seedMentorProfile(
  tx: Prisma.TransactionClient,
  data: (typeof MENTOR_DATA)[number],
): Promise<User> {
  const city = await tx.city.upsert({
    where: { title: data.city },
    update: {},
    create: { title: data.city },
  });

  const mentor = await tx.user.update({
    where: { email: data.email },
    data: {
      cityId: city.id,
      headline: data.headline,
      aboutMe: data.aboutMe,
      isAvailableForMentoring: true,
    },
  });

  await tx.education.deleteMany({ where: { userId: mentor.id } });
  await tx.education.create({ data: { userId: mentor.id, ...data.education } });

  const company = await tx.company.findUniqueOrThrow({
    where: { title: data.company },
  });
  await tx.workExperience.deleteMany({ where: { userId: mentor.id } });
  await tx.workExperience.create({
    data: {
      userId: mentor.id,
      companyId: company.id,
      position: data.position,
      startDate: dateOnly('2021-01-01'),
      isCurrent: true,
      description: data.experienceDescription,
    },
  });

  await tx.certification.deleteMany({ where: { userId: mentor.id } });
  await tx.certification.create({
    data: {
      userId: mentor.id,
      name: data.certification.name,
      issuingOrganization: data.certification.organization,
      issueDate: data.certification.issueDate,
    },
  });

  await tx.userSkill.deleteMany({ where: { userId: mentor.id } });
  for (const name of data.skills) {
    const skill = await tx.skill.findUniqueOrThrow({ where: { name } });
    await tx.userSkill.create({ data: { userId: mentor.id, skillId: skill.id } });
  }

  await tx.mentorTechnicalArea.deleteMany({ where: { mentorId: mentor.id } });
  for (const name of data.areas) {
    const area = await tx.technicalArea.findUniqueOrThrow({ where: { name } });
    await tx.mentorTechnicalArea.create({ data: { mentorId: mentor.id, technicalAreaId: area.id } });
  }

  await tx.mentorOrientationType.deleteMany({ where: { mentorId: mentor.id } });
  for (const name of data.orientations) {
    const orientation = await tx.orientationType.findUniqueOrThrow({ where: { name } });
    await tx.mentorOrientationType.create({ data: { mentorId: mentor.id, orientationTypeId: orientation.id } });
  }

  return mentor;
}

async function seedMentorBAvailability(
  tx: Prisma.TransactionClient,
  mentor: User,
  student: User,
): Promise<void> {
  await tx.appointment.deleteMany({ where: { mentorId: mentor.id } });
  await tx.availabilityBlock.deleteMany({ where: { mentorId: mentor.id } });
  await tx.blockedDate.deleteMany({ where: { mentorId: mentor.id } });

  const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  start.setUTCHours(14, 0, 0, 0);
  const blocks = await Promise.all(
    [0, 1, 2].map((offset) => {
      const blockStart = new Date(start.getTime() + offset * 60 * 60 * 1000);
      return tx.availabilityBlock.create({
        data: {
          mentorId: mentor.id,
          startAt: blockStart,
          endAt: new Date(blockStart.getTime() + 60 * 60 * 1000),
        },
      });
    }),
  );

  const confirmed = await tx.appointmentStatus.upsert({
    where: { title: 'CONFIRMADA' },
    update: {},
    create: { title: 'CONFIRMADA' },
  });
  const orientation = await tx.orientationType.findUniqueOrThrow({
    where: { name: 'Preparación para entrevistas' },
  });

  await tx.appointment.create({
    data: {
      blockId: blocks[0].id,
      mentorId: mentor.id,
      studentId: student.id,
      startAt: blocks[0].startAt,
      endAt: blocks[0].endAt,
      statusId: confirmed.id,
      orientationTypeId: orientation.id,
      message: 'Sesión de demostración para preparar una entrevista técnica.',
      meetingUrl: 'https://meet.example.com/umssy-demo',
      respondedAt: new Date(),
    },
  });

  await tx.blockedDate.create({
    data: {
      mentorId: mentor.id,
      blockedOn: dateOnly(
        new Date(start.getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      ),
      reason: 'Actividad institucional',
    },
  });
}

export async function seedMentors(
  tx: Prisma.TransactionClient,
  student: User,
): Promise<void> {
  const mentors = await Promise.all(MENTOR_DATA.map((data) => seedMentorProfile(tx, data)));
  await seedMentorBAvailability(tx, mentors[1], student);
}

export { MENTOR_EMAILS };
