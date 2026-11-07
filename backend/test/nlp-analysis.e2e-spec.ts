
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { NlpModule } from '../src/modules/nlp/nlp.module.js';
import { ProfileSkillsAnalysisService } from '../src/modules/nlp/services/profile-skills-analysis.service.js';

const enabled = process.env.RUN_NLP_DB_TESTS === '1';
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase('NLP: análisis y persistencia con PostgreSQL real', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let analysis: ProfileSkillsAnalysisService | undefined;

  const userIds: string[] = [];
  const companyIds: string[] = [];
  const experienceIds: string[] = [];

  beforeAll(async () => {
    const dbName = process.env.DB_NAME ?? '';
    const expectedDatabase = process.env.NLP_E2E_DATABASE ?? '';
    const host = (process.env.DB_HOST ?? '').toLowerCase();

    if (!/^.+_test$/i.test(dbName) || expectedDatabase !== dbName) {
      throw new Error(
        'NLP E2E requiere NLP_E2E_DATABASE igual a DB_NAME y una base cuyo nombre termine en _test.',
      );
    }

    if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
      throw new Error(
        'NLP E2E solo permite conectarse a una base PostgreSQL local.',
      );
    }

    const moduleRef = await Test.createTestingModule({
      imports: [NlpModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

   const database = app.get(PrismaService);
prisma = database;
analysis = app.get(ProfileSkillsAnalysisService);

const [identity] = await database.$queryRaw<Array<{ database: string }>>`
  SELECT current_database() AS database
`;
    if (identity?.database !== expectedDatabase) {
      await app.close();
      app = undefined;
      prisma = undefined;
      analysis = undefined;
      throw new Error('NLP E2E detectó una conexión a una base de datos inesperada.');
    }
  }, 30_000);

  afterEach(async () => {
    if (!prisma) return;

    if (experienceIds.length > 0) {
      await prisma.workExperience.deleteMany({
        where: { id: { in: [...experienceIds] } },
      });
      experienceIds.length = 0;
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: [...userIds] } },
      });
      userIds.length = 0;
    }

    if (companyIds.length > 0) {
      await prisma.company.deleteMany({
        where: { id: { in: [...companyIds] } },
      });
      companyIds.length = 0;
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('detecta TypeScript desde una experiencia real y persiste su evidencia', async () => {
    if (!prisma || !analysis) {
      throw new Error('El módulo NLP no se inicializó correctamente.');
    }

    const skill = await prisma.skill.findFirst({
      where: {
        name: 'TypeScript',
        isCustom: false,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!skill) {
      throw new Error(
        'No existe TypeScript en el catálogo de habilidades de la base de pruebas. Coordina la preparación del catálogo con DevOps; este test no ejecuta seeds.',
      );
    }

    const suffix = randomUUID();

    const user = await prisma.user.create({
      data: {
        firstName: 'NLP',
        lastName: 'Integration',
        email: `nlp-e2e-${suffix}@example.test`,
      },
    });
    userIds.push(user.id);

    const company = await prisma.company.create({
      data: {
        title: `NLP E2E ${suffix}`,
      },
    });
    companyIds.push(company.id);

    const experience = await prisma.workExperience.create({
      data: {
        userId: user.id,
        companyId: company.id,
        position: 'Desarrollador de software',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        isCurrent: true,
        description:
          'Desarrollé aplicaciones web y servicios utilizando TypeScript en proyectos de software.',
      },
    });
    experienceIds.push(experience.id);

    const result = await analysis.analyzeNow(user.id);

    expect(result.status).toBe('ready');

    const state = await prisma.profileSkillProcessingState.findUnique({
      where: { userId: user.id },
    });

    expect(state).not.toBeNull();
    expect(state?.status).toBe('ready');
    expect(state?.processedRevision).toBe(state?.inputRevision);

    const savedSkill = await prisma.userSkill.findFirst({
      where: {
        userId: user.id,
        skillId: skill.id,
      },
    });

    expect(savedSkill).not.toBeNull();
    expect(savedSkill?.source).toBe('nlp');
    expect(savedSkill?.verificationStatus).toBe('pending');
    expect(savedSkill?.evidenceRefs).toEqual(
      expect.arrayContaining([
        {
          type: 'work-experience',
          id: experience.id,
        },
      ]),
    );
  }, 30_000);
});
