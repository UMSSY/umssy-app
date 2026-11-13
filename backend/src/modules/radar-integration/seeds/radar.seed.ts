import type { Prisma } from '../../../prisma/client.js';
import { SEED_JOB_OFFER_COMPANIES } from '../../job-offers/constants/seed-job-offers.constants.js';
import { JobOfferStatus } from '../../job-offers/types/job-offer.enum.js';
import { RADAR_AREAS } from '../../profile/constants/radar-areas.constants.js';
import { seedSkillsCatalog } from '../../skills/seeds/skills-catalog.seed.js';
import type { SeedUsers } from '../../users/types/seed-users.types.js';
import {
  RUBRIC_VERSION,
  scoreVerifiedSkills,
  type EvidenceSkill,
} from '../utils/radar-scoring.js';

const TECH_BOLIVIA = SEED_JOB_OFFER_COMPANIES[0].title;
const NOVA_SOFT = SEED_JOB_OFFER_COMPANIES[1].title;
const ANDES_DATA = SEED_JOB_OFFER_COMPANIES[2].title;

const APPLICATION_STATUSES = [
  'En revisión',
  'Entrevista',
  'Aceptada',
  'No seleccionado',
  'Retirada',
] as const;
const INITIAL_STATUS = 'En revisión';
const PUBLISHED_STATUS = JobOfferStatus.PUBLISHED;

interface ProfileSeed {
  headline: string;
  education: {
    institution: string;
    degree: string;
    start: Date;
    end: Date | null;
  };
  experience: {
    companyTitle: string;
    position: string;
    start: Date;
    end: Date | null;
    description: string;
  };
  skills: string[];
  highRelevance: string[];
}

const PROFILE_SEEDS: ProfileSeed[] = [
  {
    headline: 'Desarrollador Full Stack con foco en TypeScript y Node.js',
    education: {
      institution: 'Universidad Mayor de San Simón',
      degree: 'Ingeniería de Sistemas',
      start: new Date('2016-02-01'),
      end: new Date('2021-12-15'),
    },
    experience: {
      companyTitle: TECH_BOLIVIA,
      position: 'Desarrollador Full Stack',
      start: new Date('2022-01-10'),
      end: null,
      description:
        'Desarrollo de APIs con Node.js, interfaces con React y consultas sobre PostgreSQL.',
    },
    skills: [
      'TypeScript',
      'React',
      'Node.js',
      'PostgreSQL',
      'Docker',
      'Git',
      'Jest',
      'Scrum',
    ],
    highRelevance: ['TypeScript', 'Node.js', 'React'],
  },
  {
    headline: 'Analista de datos en formación con experiencia en Python y SQL',
    education: {
      institution: 'Universidad Mayor de San Simón',
      degree: 'Ingeniería Informática',
      start: new Date('2020-02-01'),
      end: null,
    },
    experience: {
      companyTitle: ANDES_DATA,
      position: 'Pasante de análisis de datos',
      start: new Date('2025-01-15'),
      end: null,
      description:
        'Limpieza de datos con Pandas, consultas SQL y tableros de indicadores en Power BI.',
    },
    skills: ['Python', 'SQL', 'Pandas', 'Power BI', 'Git', 'Docker'],
    highRelevance: ['Python', 'SQL', 'Pandas'],
  },
  {
    headline:
      'Desarrollador web con experiencia en JavaScript y pruebas automatizadas',
    education: {
      institution: 'Universidad Mayor de San Simón',
      degree: 'Licenciatura en Sistemas',
      start: new Date('2018-02-01'),
      end: new Date('2023-12-15'),
    },
    experience: {
      companyTitle: NOVA_SOFT,
      position: 'Desarrollador Web',
      start: new Date('2023-03-01'),
      end: null,
      description:
        'Implementación de interfaces accesibles y pruebas de regresión con Jest.',
    },
    skills: ['JavaScript', 'HTML5', 'CSS3', 'React', 'Git', 'Jest', 'SQL'],
    highRelevance: ['JavaScript', 'React'],
  },
];

function requireId(
  ids: Map<string, string>,
  key: string,
  catalog: string,
): string {
  const id = ids.get(key);
  if (!id) {
    throw new Error(`Seed de radar: no existe "${key}" en ${catalog}`);
  }
  return id;
}

async function upsertProfile(
  tx: Prisma.TransactionClient,
  userId: string,
  companyIds: Map<string, string>,
  profile: ProfileSeed,
): Promise<void> {
  const education = await tx.education.findFirst({
    where: {
      userId,
      institution: profile.education.institution,
      degree: profile.education.degree,
    },
    select: { id: true },
  });
  const educationId =
    education?.id ??
    (
      await tx.education.create({
        data: {
          userId,
          institution: profile.education.institution,
          degree: profile.education.degree,
          startDate: profile.education.start,
          endDate: profile.education.end,
        },
        select: { id: true },
      })
    ).id;

  const companyId = requireId(
    companyIds,
    profile.experience.companyTitle,
    'empresas',
  );
  const experience = await tx.workExperience.findFirst({
    where: {
      userId,
      companyId,
      position: profile.experience.position,
    },
    select: { id: true },
  });
  const experienceId =
    experience?.id ??
    (
      await tx.workExperience.create({
        data: {
          userId,
          companyId,
          position: profile.experience.position,
          startDate: profile.experience.start,
          endDate: profile.experience.end,
          isCurrent: profile.experience.end === null,
          description: profile.experience.description,
        },
        select: { id: true },
      })
    ).id;

  const skills = await tx.skill.findMany({
    where: { name: { in: profile.skills } },
    select: { id: true, name: true, areaId: true },
  });

  const evidenceSkills: EvidenceSkill[] = [];
  for (const skill of skills) {
    const highRelevance = profile.highRelevance.includes(skill.name);
    const evidenceRefs = highRelevance
      ? [
          { type: 'education', id: educationId },
          { type: 'work-experience', id: experienceId },
        ]
      : [];
    await tx.userSkill.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      // No se sobrescriben habilidades ya registradas por el usuario.
      update: {},
      create: {
        userId,
        skillId: skill.id,
        source: 'manual',
        verificationStatus: 'approved',
        isHighRelevance: highRelevance,
        evidenceRefs,
      },
    });
    evidenceSkills.push({
      id: skill.id,
      name: skill.name,
      areaId: skill.areaId,
      isHighRelevance: highRelevance,
      evidenceRefs,
    });
  }

  await tx.user.updateMany({
    where: { id: userId, headline: null },
    data: { headline: profile.headline },
  });

  const calculated = scoreVerifiedSkills(evidenceSkills);
  await tx.radarScoreSnapshot.upsert({
    where: { userId_version: { userId, version: 1 } },
    // Un radar ya publicado no se reemplaza desde el seed.
    update: {},
    create: {
      userId,
      version: 1,
      rubricVersion: RUBRIC_VERSION,
      fingerprint: calculated.fingerprint,
      scores: calculated.scores,
      evidence: calculated.evidence,
      averageScore: calculated.average,
    },
  });
}

async function ensureApplication(
  tx: Prisma.TransactionClient,
  jobOfferId: string,
  userId: string,
  statusId: string,
): Promise<{ id: string }> {
  return tx.jobApplication.upsert({
    where: { jobOfferId_userId: { jobOfferId, userId } },
    // No se altera el estado de una postulación existente.
    update: {},
    create: { jobOfferId, userId, statusId },
    select: { id: true },
  });
}

/**
 * Datos mínimos para que HU4 compare vacantes con radares publicados.
 *
 * Reutiliza las áreas, el catálogo de competencias, las empresas, las
 * vacantes publicadas y los usuarios que ya crea el seed del Epic. Sólo
 * agrega perfiles, snapshots, postulaciones y consentimientos, sin
 * sobrescribir datos existentes.
 */
export async function seedRadar(
  tx: Prisma.TransactionClient,
  users: Partial<SeedUsers>,
): Promise<void> {
  // Las áreas deben existir antes de asignar `Skill.areaId` (FK).
  await tx.radarArea.createMany({
    data: RADAR_AREAS.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
    })),
    skipDuplicates: true,
  });

  // Reutiliza el catálogo de competencias del Epic y sólo completa áreas nulas.
  await seedSkillsCatalog(tx);

  await tx.jobApplicationStatus.createMany({
    data: APPLICATION_STATUSES.map((title) => ({ title })),
    skipDuplicates: true,
  });
  const initialStatus = await tx.jobApplicationStatus.findUnique({
    where: { title: INITIAL_STATUS },
    select: { id: true },
  });
  if (!initialStatus) {
    throw new Error(
      `Seed de radar: no existe el estado "${INITIAL_STATUS}" de postulación`,
    );
  }

  const companies = await tx.company.findMany({
    where: { title: { in: [TECH_BOLIVIA, NOVA_SOFT, ANDES_DATA] } },
    select: { id: true, title: true },
  });
  const companyIds = new Map(
    companies.map((company) => [company.title, company.id]),
  );
  const techCompanyId = requireId(companyIds, TECH_BOLIVIA, 'empresas');

  // Reutiliza una vacante publicada existente en lugar de duplicar ofertas.
  const offer = await tx.jobOffer.findFirst({
    where: {
      companyId: techCompanyId,
      status: { title: PUBLISHED_STATUS },
    },
    orderBy: { publishedAt: 'asc' },
    select: { id: true },
  });
  if (!offer) {
    throw new Error(
      `Seed de radar: no hay vacantes "${PUBLISHED_STATUS}" de ${TECH_BOLIVIA}`,
    );
  }

  const applicants = [
    users.graduate,
    users.student,
    users.eventGraduate,
  ].filter((user): user is NonNullable<typeof user> => user !== undefined);

  for (const [index, user] of applicants.entries()) {
    const profile = PROFILE_SEEDS[index];
    if (!profile) break;
    await upsertProfile(tx, user.id, companyIds, profile);

    const application = await ensureApplication(
      tx,
      offer.id,
      user.id,
      initialStatus.id,
    );
    await tx.radarApplicationConsent.upsert({
      where: { applicationId: application.id },
      update: {},
      create: {
        applicationId: application.id,
        consentToRecruiter: true,
        consentToCv: false,
        consentToContact: index === 0,
      },
    });
  }

  // Postulante sin radar publicado: el backend no debe inventarle afinidad.
  if (users.emptyGraduate) {
    const application = await ensureApplication(
      tx,
      offer.id,
      users.emptyGraduate.id,
      initialStatus.id,
    );
    await tx.radarApplicationConsent.upsert({
      where: { applicationId: application.id },
      update: {},
      create: {
        applicationId: application.id,
        consentToRecruiter: true,
        consentToCv: false,
        consentToContact: false,
      },
    });
  }

  if (users.company) {
    // `RadarCompanyAccess` está ignorado por Prisma y usa clave compuesta.
    await tx.$executeRaw`
      INSERT INTO radar_company_access (company_id,user_id)
      VALUES (${techCompanyId}::uuid,${users.company.id}::uuid)
      ON CONFLICT (company_id,user_id) DO NOTHING`;
  }
}
