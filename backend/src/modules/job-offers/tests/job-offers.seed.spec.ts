import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import {
  SEED_JOB_OFFER_COMPANIES,
  SEED_JOB_OFFER_CONTRACT_TYPES,
  SEED_JOB_OFFER_MODALITIES,
  SEED_JOB_OFFER_SKILLS,
  SEED_JOB_OFFER_STATUSES,
  SEED_JOB_OFFERS,
} from '../constants/seed-job-offers.constants.js';
import { createJobOfferSchema } from '../requests/create-job-offer.request.js';
import { seedJobOffers } from '../seeds/job-offers.seed.js';
import { JobOfferStatus } from '../types/job-offer.enum.js';

const NOW = new Date('2026-10-22T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

type UpsertArgs = {
  where: Record<string, string>;
  update: Record<string, unknown>;
  create: Record<string, unknown>;
};

const MODELS = [
  'jobOfferModality',
  'jobOfferContractType',
  'jobOfferStatus',
  'skill',
  'company',
  'jobOffer',
] as const;

function createTransaction() {
  const stores = Object.fromEntries(MODELS.map((model) => [model, new Map<string, Record<string, unknown>>()]));
  const tx = Object.fromEntries(
    MODELS.map((model) => [
      model,
      {
        createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
          let count = 0;
          for (const record of data) {
            const key = String(record.title ?? record.name);
            if (stores[model].has(key)) continue;
            stores[model].set(key, { id: `${model}:${key}`, ...record });
            count += 1;
          }
          return { count };
        },
        updateMany: async ({ where, data }: { where: { name: { in: string[] } }; data: Record<string, unknown> }) => {
          let count = 0;
          for (const name of where.name.in) {
            const existing = stores[model].get(name);
            if (!existing) continue;
            stores[model].set(name, { ...existing, ...data });
            count += 1;
          }
          return { count };
        },
        findMany: async (args?: { where?: { name?: { in: string[] } } }) => {
          const records = [...stores[model].values()];
          const names = args?.where?.name?.in;
          return names ? records.filter((record) => names.includes(String(record.name))) : records;
        },
        upsert: async (args: UpsertArgs) => {
          const [key] = Object.keys(args.where);
          const current = stores[model].get(args.where[key]);
          const record = current === undefined ? args.create : { ...current, ...args.update };
          stores[model].set(args.where[key], record);
          return record;
        },
      },
    ]),
  ) as unknown as Prisma.TransactionClient;

  return { stores, tx };
}

describe('seedJobOffers', () => {
  it('crea los catálogos a partir de los enums', async () => {
    const { stores, tx } = createTransaction();

    await seedJobOffers(tx);

    expect([...stores.jobOfferModality.keys()]).toEqual(SEED_JOB_OFFER_MODALITIES);
    expect([...stores.jobOfferContractType.keys()]).toEqual(SEED_JOB_OFFER_CONTRACT_TYPES);
    expect([...stores.jobOfferStatus.keys()]).toEqual(SEED_JOB_OFFER_STATUSES);
    expect(stores.jobOfferStatus.has(JobOfferStatus.PUBLISHED)).toBe(true);
  });

  it('carga las 20 tecnologías del catálogo cerrado, ninguna personalizada', async () => {
    const { stores, tx } = createTransaction();

    await seedJobOffers(tx);

    expect(stores.skill.size).toBe(20);
    expect([...stores.skill.values()].every((skill) => skill.isCustom === false)).toBe(true);
  });

  it('carga las empresas de demostración con id fijo', async () => {
    const { stores, tx } = createTransaction();

    await seedJobOffers(tx);

    expect(stores.company.size).toBe(SEED_JOB_OFFER_COMPANIES.length);
    expect(stores.company.get('TechBolivia S.R.L.')).toMatchObject({
      id: 'a0000000-0000-4000-8000-000000000001',
    });
  });

  it('actualiza tecnologías del catálogo sin alterar habilidades personalizadas ajenas', async () => {
    const { stores, tx } = createTransaction();
    stores.skill.set('Python', { id: 'skill:Python', name: 'Python', isCustom: true });
    stores.skill.set('Otra habilidad', { id: 'skill:Otra habilidad', name: 'Otra habilidad', isCustom: true });
    stores.company.set('TechBolivia S.R.L.', { id: 'existing-id', title: 'TechBolivia S.R.L.', description: 'Anterior' });
    await seedJobOffers(tx);
    expect(stores.skill.get('Python')?.isCustom).toBe(false);
    expect(stores.skill.get('Otra habilidad')?.isCustom).toBe(true);
    expect(stores.company.get('TechBolivia S.R.L.')).toMatchObject({
      id: 'existing-id', description: SEED_JOB_OFFER_COMPANIES[0].description,
    });
  });

  it('es idempotente al ejecutarse dos veces', async () => {
    const { stores, tx } = createTransaction();

    await seedJobOffers(tx);
    await seedJobOffers(tx);

    expect(stores.skill.size).toBe(SEED_JOB_OFFER_SKILLS.length);
    expect(stores.company.size).toBe(SEED_JOB_OFFER_COMPANIES.length);
    expect(stores.jobOffer.size).toBe(SEED_JOB_OFFERS.length);
  });

  it('crea las vacantes de demostración enlazadas a su empresa, catálogos y tecnologías', async () => {
    const { stores, tx } = createTransaction();

    await seedJobOffers(tx, NOW);

    expect(stores.jobOffer.size).toBe(SEED_JOB_OFFERS.length);
    expect(stores.jobOffer.get('b0000000-0000-4000-8000-000000000001')).toMatchObject({
      companyId: 'a0000000-0000-4000-8000-000000000001',
      modalityId: 'jobOfferModality:Remoto',
      contractTypeId: 'jobOfferContractType:Tiempo completo',
      statusId: 'jobOfferStatus:Publicada',
      title: 'Desarrollador Frontend React Junior',
      salaryRange: 'Bs 5.000 - 7.000',
      createdAt: new Date(NOW.getTime() - DAY_MS),
      skills: {
        create: [
          { skillId: 'skill:React' },
          { skillId: 'skill:TypeScript' },
          { skillId: 'skill:Git' },
        ],
      },
    });
  });

  it('muestra "A convenir" en la pasantía sin salario', async () => {
    const { stores, tx } = createTransaction();

    await seedJobOffers(tx, NOW);

    expect(stores.jobOffer.get('b0000000-0000-4000-8000-000000000002')?.salaryRange).toBe('A convenir');
  });

  it('usa el id real de la empresa si ya existía con otro id', async () => {
    const { stores, tx } = createTransaction();
    stores.company.set('TechBolivia S.R.L.', { id: 'existing-id', title: 'TechBolivia S.R.L.', description: 'Anterior' });

    await seedJobOffers(tx, NOW);

    const techBoliviaOffers = [...stores.jobOffer.values()].filter((offer) => offer.companyId === 'existing-id');
    expect(techBoliviaOffers).toHaveLength(6);
  });

  it('no modifica las vacantes que ya existían al volver a correr el seed', async () => {
    const { stores, tx } = createTransaction();

    await seedJobOffers(tx, NOW);
    await seedJobOffers(tx, new Date(NOW.getTime() + 30 * DAY_MS));

    expect(stores.jobOffer.get('b0000000-0000-4000-8000-000000000001')?.createdAt).toEqual(
      new Date(NOW.getTime() - DAY_MS),
    );
  });

  it('cubre todas las modalidades, contratos y varios estados para probar los filtros', () => {
    const techBolivia = SEED_JOB_OFFERS.filter((offer) => offer.companyTitle === 'TechBolivia S.R.L.');

    expect(new Set(techBolivia.map((offer) => offer.modality))).toEqual(new Set(SEED_JOB_OFFER_MODALITIES));
    expect(new Set(techBolivia.map((offer) => offer.contractType))).toEqual(
      new Set(SEED_JOB_OFFER_CONTRACT_TYPES),
    );
    expect(new Set(techBolivia.map((offer) => offer.status)).size).toBeGreaterThan(1);
    expect(new Set(SEED_JOB_OFFERS.map((offer) => offer.companyTitle)).size).toBeGreaterThan(1);
  });

  it('cada vacante de demostración cumple las reglas del formulario de publicación', () => {
    for (const offer of SEED_JOB_OFFERS) {
      const result = createJobOfferSchema.safeParse({
        title: offer.title,
        description: offer.description,
        modality: offer.modality,
        contractType: offer.contractType,
        category: offer.category,
        positionsAvailable: offer.positionsAvailable,
        salaryMin: offer.salaryMin,
        salaryMax: offer.salaryMax,
        languages: offer.languages,
        locationUrl: 'https://maps.app.goo.gl/UmssCochabamba',
        skillIds: offer.skills.map(() => randomUUID()),
      });

      expect(result.success, offer.title).toBe(true);
    }
  });
});