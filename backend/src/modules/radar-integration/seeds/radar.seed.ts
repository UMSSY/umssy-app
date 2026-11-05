import type { Prisma, User } from '../../../prisma/client.js';
import type { SeedUsers } from '../../users/types/seed-users.types.js';
import {
  RADAR_AREAS,
  SKILL_AREA_CATALOG,
} from '../constants/radar.constants.js';
import { scoreVerifiedSkills, type EvidenceSkill } from '../radar-scoring.js';

const TECH_BOLIVIA = 'a0000000-0000-4000-8000-000000000001';
const NOVA_SOFT = 'a0000000-0000-4000-8000-000000000002';
const ANDES_DATA = 'a0000000-0000-4000-8000-000000000003';

const APPLICATION_STATUSES = [
  { id: '5a000000-0000-4000-8000-000000000001', title: 'En revisión' },
  { id: '5a000000-0000-4000-8000-000000000002', title: 'Entrevista' },
  { id: '5a000000-0000-4000-8000-000000000003', title: 'Aceptada' },
  { id: '5a000000-0000-4000-8000-000000000004', title: 'No seleccionado' },
  { id: '5a000000-0000-4000-8000-000000000005', title: 'Retirada' },
] as const;

const RADAR_VACANCIES = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    companyId: TECH_BOLIVIA,
    title: 'Desarrollador Full Stack Senior',
    description:
      'Buscamos un perfil con TypeScript, React, Node.js, PostgreSQL y Docker para construir APIs y aplicaciones web.',
    category: 'Desarrollo de software',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    companyId: TECH_BOLIVIA,
    title: 'Arquitecto Cloud',
    description:
      'Diseño de infraestructura con AWS, Kubernetes, Terraform, Linux y Docker. Valoramos prácticas de ciberseguridad.',
    category: 'Infraestructura',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Linux', 'Docker'],
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    companyId: ANDES_DATA,
    title: 'Ingeniero de Datos',
    description:
      'Perfil analítico con Python, SQL, Pandas, TensorFlow y Power BI para pipelines de datos y modelos predictivos.',
    category: 'Datos e inteligencia artificial',
    skills: ['Python', 'SQL', 'Pandas', 'TensorFlow', 'Power BI'],
  },
  {
    id: 'b0000000-0000-4000-8000-000000000004',
    companyId: NOVA_SOFT,
    title: 'Analista de Calidad',
    description:
      'Aseguramiento de calidad con Cypress, Jest, Postman, Git y Scrum para aplicaciones web.',
    category: 'Calidad de software',
    skills: ['Cypress', 'Jest', 'Postman', 'Git', 'Scrum'],
  },
] as const;

interface ProfileSeed {
  user: User;
  headline: string;
  education: { institution: string; degree: string; start: Date; end: Date | null };
  experience: {
    companyId: string;
    position: string;
    start: Date;
    end: Date | null;
    description: string;
  };
  skills: string[];
  highRelevance: string[];
}

const PROFILE_SEEDS: Omit<ProfileSeed, 'user'>[] = [
  {
    headline: 'Desarrollador Full Stack con foco en TypeScript y Node.js',
    education: {
      institution: 'Universidad Mayor de San Simón',
      degree: 'Ingeniería de Sistemas',
      start: new Date('2016-02-01'),
      end: new Date('2021-12-15'),
    },
    experience: {
      companyId: TECH_BOLIVIA,
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
      companyId: ANDES_DATA,
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
    headline: 'Desarrollador web con experiencia en JavaScript y pruebas automatizadas',
    education: {
      institution: 'Universidad Mayor de San Simón',
      degree: 'Licenciatura en Sistemas',
      start: new Date('2018-02-01'),
      end: new Date('2023-12-15'),
    },
    experience: {
      companyId: NOVA_SOFT,
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

async function upsertProfile(
  tx: Prisma.TransactionClient,
  user: User,
  profile: Omit<ProfileSeed, 'user'>,
): Promise<number> {
  const education = await tx.education.findFirst({
    where: {
      userId: user.id,
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
          userId: user.id,
          institution: profile.education.institution,
          degree: profile.education.degree,
          startDate: profile.education.start,
          endDate: profile.education.end,
        },
        select: { id: true },
      })
    ).id;

  const experience = await tx.workExperience.findFirst({
    where: {
      userId: user.id,
      companyId: profile.experience.companyId,
      position: profile.experience.position,
    },
    select: { id: true },
  });
  const experienceId =
    experience?.id ??
    (
      await tx.workExperience.create({
        data: {
          userId: user.id,
          companyId: profile.experience.companyId,
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

  for (const skill of skills) {
    const highRelevance = profile.highRelevance.includes(skill.name);
    await tx.userSkill.upsert({
      where: { userId_skillId: { userId: user.id, skillId: skill.id } },
      update: {
        source: 'manual',
        verificationStatus: 'approved',
        isHighRelevance: highRelevance,
        evidenceRefs: highRelevance
          ? [
              { type: 'education', id: educationId },
              { type: 'work-experience', id: experienceId },
            ]
          : [],
      },
      create: {
        userId: user.id,
        skillId: skill.id,
        source: 'manual',
        verificationStatus: 'approved',
        isHighRelevance: highRelevance,
        evidenceRefs: highRelevance
          ? [
              { type: 'education', id: educationId },
              { type: 'work-experience', id: experienceId },
            ]
          : [],
      },
    });
  }

  await tx.user.update({
    where: { id: user.id },
    data: { headline: profile.headline },
  });

  const published = await tx.userSkill.findMany({
    where: { userId: user.id, verificationStatus: 'approved' },
    select: {
      skillId: true,
      isHighRelevance: true,
      evidenceRefs: true,
      skill: { select: { name: true, areaId: true } },
    },
  });
  const evidenceSkills: EvidenceSkill[] = published.map((row) => ({
    id: row.skillId,
    name: row.skill.name,
    areaId: row.skill.areaId,
    isHighRelevance: row.isHighRelevance,
    evidenceRefs: Array.isArray(row.evidenceRefs)
      ? row.evidenceRefs.flatMap((entry) => {
          if (!entry || typeof entry !== 'object' || !('type' in entry) || !('id' in entry)) {
            return [];
          }
          return typeof entry.type === 'string' && typeof entry.id === 'string'
            ? [{ type: entry.type, id: entry.id }]
            : [];
        })
      : [],
  }));
  const calculated = scoreVerifiedSkills(evidenceSkills);
  await tx.radarScoreSnapshot.upsert({
    where: { userId_version: { userId: user.id, version: 1 } },
    update: {
      rubricVersion: 'seed-h4',
      fingerprint: calculated.fingerprint,
      scores: calculated.scores,
      evidence: calculated.evidence,
      averageScore: calculated.average,
    },
    create: {
      userId: user.id,
      version: 1,
      rubricVersion: 'seed-h4',
      fingerprint: calculated.fingerprint,
      scores: calculated.scores,
      evidence: calculated.evidence,
      averageScore: calculated.average,
    },
  });

  return calculated.average;
}

/** Datos mínimos para que HU4 pueda comparar vacantes y radares publicados. */
export async function seedRadar(
  tx: Prisma.TransactionClient,
  users: Partial<SeedUsers>,
): Promise<void> {
  for (const area of RADAR_AREAS) {
    await tx.radarArea.upsert({
      where: { id: area.id },
      update: { name: area.name, description: area.description },
      create: { id: area.id, name: area.name, description: area.description },
    });
  }

  for (const status of APPLICATION_STATUSES) {
    await tx.jobApplicationStatus.upsert({
      where: { title: status.title },
      update: {},
      create: status,
    });
  }

  for (const skill of SKILL_AREA_CATALOG) {
    await tx.skill.upsert({
      where: { name: skill.name },
      update: { areaId: skill.areaId, isCustom: false },
      create: { name: skill.name, areaId: skill.areaId, isCustom: false },
    });
  }

  const [modality, contractType, status] = await Promise.all([
    tx.jobOfferModality.findUnique({ where: { title: 'Remoto' } }),
    tx.jobOfferContractType.findUnique({ where: { title: 'Tiempo completo' } }),
    tx.jobOfferStatus.findUnique({ where: { title: 'Publicada' } }),
  ]);
  if (!modality || !contractType || !status) {
    throw new Error('No existen los catálogos de vacantes necesarios para el seed del radar');
  }

  for (const vacancy of RADAR_VACANCIES) {
    await tx.jobOffer.upsert({
      where: { id: vacancy.id },
      update: {
        companyId: vacancy.companyId,
        title: vacancy.title,
        description: vacancy.description,
        modalityId: modality.id,
        contractTypeId: contractType.id,
        statusId: status.id,
        category: vacancy.category,
        positionsAvailable: 2,
        salaryRange: 'Bolivia',
        languages: 'Español, Inglés',
        locationUrl: 'https://umssy.test/vacantes',
        expiresAt: null,
      },
      create: {
        id: vacancy.id,
        companyId: vacancy.companyId,
        title: vacancy.title,
        description: vacancy.description,
        modalityId: modality.id,
        contractTypeId: contractType.id,
        statusId: status.id,
        category: vacancy.category,
        positionsAvailable: 2,
        salaryRange: 'Bolivia',
        languages: 'Español, Inglés',
        locationUrl: 'https://umssy.test/vacantes',
      },
    });

    const skills = await tx.skill.findMany({
      where: { name: { in: [...vacancy.skills] } },
      select: { id: true },
    });
    await tx.jobOfferSkill.deleteMany({ where: { jobOfferId: vacancy.id } });
    await tx.jobOfferSkill.createMany({
      data: skills.map((skill) => ({ jobOfferId: vacancy.id, skillId: skill.id })),
      skipDuplicates: true,
    });
  }

  const applicantUsers = [users.graduate, users.student, users.eventGraduate].filter(
    (user): user is User => user !== undefined,
  );
  for (const [index, user] of applicantUsers.entries()) {
    const profile = PROFILE_SEEDS[index];
    if (!profile) break;
    await upsertProfile(tx, user, profile);

    const application = await tx.jobApplication.upsert({
      where: {
        jobOfferId_userId: {
          jobOfferId: RADAR_VACANCIES[0].id,
          userId: user.id,
        },
      },
      update: { statusId: APPLICATION_STATUSES[0].id },
      create: {
        jobOfferId: RADAR_VACANCIES[0].id,
        userId: user.id,
        statusId: APPLICATION_STATUSES[0].id,
      },
      select: { id: true },
    });
    await tx.radarApplicationConsent.upsert({
      where: { applicationId: application.id },
      update: {
        consentToRecruiter: true,
        consentToCv: false,
        consentToContact: index === 0,
      },
      create: {
        applicationId: application.id,
        consentToRecruiter: true,
        consentToCv: false,
        consentToContact: index === 0,
      },
    });
  }

  // Postulante sin radar publicado: el backend no debe inventarle compatibilidad.
  if (users.emptyGraduate) {
    const application = await tx.jobApplication.upsert({
      where: {
        jobOfferId_userId: {
          jobOfferId: RADAR_VACANCIES[0].id,
          userId: users.emptyGraduate.id,
        },
      },
      update: { statusId: APPLICATION_STATUSES[0].id },
      create: {
        jobOfferId: RADAR_VACANCIES[0].id,
        userId: users.emptyGraduate.id,
        statusId: APPLICATION_STATUSES[0].id,
      },
      select: { id: true },
    });
    await tx.radarApplicationConsent.upsert({
      where: { applicationId: application.id },
      update: { consentToRecruiter: true, consentToCv: false, consentToContact: false },
      create: {
        applicationId: application.id,
        consentToRecruiter: true,
        consentToCv: false,
        consentToContact: false,
      },
    });
  }

  if (users.company) {
    await tx.radarCompanyAccess.upsert({
      where: {
        companyId_userId: { companyId: TECH_BOLIVIA, userId: users.company.id },
      },
      update: {},
      create: { companyId: TECH_BOLIVIA, userId: users.company.id },
    });
  }
}
