import { DAY_MS } from '../../../common/constants/date-time.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import {
  SEED_JOB_OFFER_COMPANIES,
  SEED_JOB_OFFER_CONTRACT_TYPES,
  SEED_JOB_OFFER_LOCATION_URL,
  SEED_JOB_OFFER_MODALITIES,
  SEED_JOB_OFFER_SKILLS,
  SEED_JOB_OFFER_STATUSES,
  SEED_JOB_OFFERS,
} from '../constants/seed-job-offers.constants.js';
import { formatSalaryRange } from '../utils/format-salary-range.js';

function idsByTitle(rows: { id: string; title: string }[]): Map<string, string> {
  return new Map(rows.map((row) => [row.title, row.id]));
}

function requireId(ids: Map<string, string>, key: string, catalog: string): string {
  const id = ids.get(key);
  if (!id) throw new Error(`Seed de vacantes: no existe "${key}" en ${catalog}`);
  return id;
}

export async function seedJobOffers(
  tx: Prisma.TransactionClient,
  now: Date = new Date(),
): Promise<void> {
  await tx.jobOfferModality.createMany({
    data: SEED_JOB_OFFER_MODALITIES.map((title) => ({ title })),
    skipDuplicates: true,
  });

  await tx.jobOfferContractType.createMany({
    data: SEED_JOB_OFFER_CONTRACT_TYPES.map((title) => ({ title })),
    skipDuplicates: true,
  });

  await tx.jobOfferStatus.createMany({
    data: SEED_JOB_OFFER_STATUSES.map((title) => ({ title })),
    skipDuplicates: true,
  });

  await tx.skill.createMany({
    data: SEED_JOB_OFFER_SKILLS.map((name) => ({ name, isCustom: false })),
    skipDuplicates: true,
  });
  await tx.skill.updateMany({
    where: { name: { in: [...SEED_JOB_OFFER_SKILLS] } },
    data: { isCustom: false },
  });

  const companyIds = new Map<string, string>();
  for (const company of SEED_JOB_OFFER_COMPANIES) {
    const saved = await tx.company.upsert({
      where: { title: company.title },
      update: { description: company.description },
      create: { id: company.id, title: company.title, description: company.description },
    });
    companyIds.set(company.title, saved.id);
  }

  await seedDemoJobOffers(tx, companyIds, now);
}
async function seedDemoJobOffers(
  tx: Prisma.TransactionClient,
  companyIds: Map<string, string>,
  now: Date,
): Promise<void> {
  const [modalities, contractTypes, statuses, skills] = await Promise.all([
    tx.jobOfferModality.findMany({ select: { id: true, title: true } }),
    tx.jobOfferContractType.findMany({ select: { id: true, title: true } }),
    tx.jobOfferStatus.findMany({ select: { id: true, title: true } }),
    tx.skill.findMany({
      where: { name: { in: [...SEED_JOB_OFFER_SKILLS] } },
      select: { id: true, name: true },
    }),
  ]);
  const modalityIds = idsByTitle(modalities);
  const contractTypeIds = idsByTitle(contractTypes);
  const statusIds = idsByTitle(statuses);
  const skillIds = new Map(skills.map((skill) => [skill.name, skill.id]));

  for (const offer of SEED_JOB_OFFERS) {
    await tx.jobOffer.upsert({
      where: { id: offer.id },
      update: {},
      create: {
        id: offer.id,
        companyId: requireId(companyIds, offer.companyTitle, 'empresas'),
        modalityId: requireId(modalityIds, offer.modality, 'modalidades'),
        contractTypeId: requireId(contractTypeIds, offer.contractType, 'tipos de contrato'),
        statusId: requireId(statusIds, offer.status, 'estados'),
        title: offer.title,
        description: offer.description,
        category: offer.category,
        positionsAvailable: offer.positionsAvailable,
        salaryRange: formatSalaryRange(offer.salaryMin, offer.salaryMax),
        languages: offer.languages,
        locationUrl: SEED_JOB_OFFER_LOCATION_URL,
        createdAt: new Date(now.getTime() - offer.daysAgo * DAY_MS),
        skills: {
          create: offer.skills.map((name) => ({ skillId: requireId(skillIds, name, 'tecnologías') })),
        },
      },
    });
  }
}