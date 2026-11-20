import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { seedCatalogStages } from '../../../common/database/catalog-stages.js';
import { seedMentorOfferStatusesCatalog } from '../seeds/mentor-offer-statuses-catalog.seed.js';
import { seedMentorParticipationStatusesCatalog } from '../seeds/mentor-participation-statuses-catalog.seed.js';

type CatalogRecord = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function createCatalog() {
  const records = new Map<string, CatalogRecord>();
  const createMany = vi.fn(
    async ({
      data,
      skipDuplicates,
    }: {
      data: { title: string }[];
      skipDuplicates?: boolean;
    }) => {
      let count = 0;
      for (const { title } of data) {
        if (records.has(title)) {
          if (skipDuplicates) continue;
          throw new Error('Duplicate catalog title');
        }
        records.set(title, {
          id: `catalog:${title}`,
          title,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        count += 1;
      }
      return { count };
    },
  );
  return { records, delegate: { createMany } };
}

function createTransaction() {
  const requests = createCatalog();
  const offers = createCatalog();
  const otherCatalog = { createMany: vi.fn().mockResolvedValue({ count: 0 }) };
  const delegates = {
    mentorParticipationStatus: requests.delegate,
    mentorOfferStatus: offers.delegate,
  };
  const tx = new Proxy(delegates, {
    get(target, property) {
      if (typeof property !== 'string') return undefined;
      if (
        [
          'user',
          'userRole',
          'mentorParticipationRequest',
          'mentorSlotOffer',
        ].includes(property)
      ) {
        throw new Error(
          `Catalog seeds cannot write business records: ${property}`,
        );
      }
      return Reflect.get(target, property) ?? otherCatalog;
    },
  }) as unknown as Prisma.TransactionClient;
  return { tx, requests, offers };
}

describe.each([
  {
    name: 'solicitudes',
    seed: seedMentorParticipationStatusesCatalog,
    catalog: 'requests' as const,
    titles: ['PENDING', 'OFFERED', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'ENDED'],
  },
  {
    name: 'ofertas',
    seed: seedMentorOfferStatusesCatalog,
    catalog: 'offers' as const,
    titles: ['OFFERED', 'CONFIRMED', 'EXPIRED'],
  },
])('Catálogo de estados de $name', ({ seed, catalog, titles }) => {
  it('crea todos los estados requeridos y permite repetir el seed sin duplicados', async () => {
    const context = createTransaction();
    await seed(context.tx);
    const initial = [...context[catalog].records.values()];
    expect(initial.map(({ title }) => title)).toEqual(titles);

    await seed(context.tx);
    expect([...context[catalog].records.values()]).toEqual(initial);
    expect(
      context[catalog === 'requests' ? 'offers' : 'requests'].records.size,
    ).toBe(0);
  });

  it('completa los faltantes sin cambiar IDs, descripciones ni auditoría existentes', async () => {
    const context = createTransaction();
    const existing = {
      id: 'existing-status',
      title: titles[0],
      description: 'Descripción administrada',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-02-01T00:00:00Z'),
    };
    const additional = {
      ...existing,
      id: 'additional-status',
      title: 'ADDITIONAL',
    };
    context[catalog].records.set(existing.title, existing);
    context[catalog].records.set(additional.title, additional);

    await seed(context.tx);

    expect(context[catalog].records.size).toBe(titles.length + 1);
    expect(context[catalog].records.get(existing.title)).toBe(existing);
    expect(context[catalog].records.get(additional.title)).toBe(additional);
    expect(titles.every((title) => context[catalog].records.has(title))).toBe(
      true,
    );
  });

  it('propaga el error de persistencia para que el flujo común revierta la transacción', async () => {
    const context = createTransaction();
    const error = new Error('Database unavailable');
    context[catalog].delegate.createMany.mockRejectedValueOnce(error);
    await expect(seed(context.tx)).rejects.toBe(error);
    expect(context[catalog].records.size).toBe(0);
  });
});

describe('Integración con los catálogos comunes', () => {
  it('incluye ambos catálogos en las ejecuciones de producción y desarrollo sin crear datos de negocio', async () => {
    const { tx, requests, offers } = createTransaction();
    await seedCatalogStages(tx);
    await seedCatalogStages(tx);
    expect([...requests.records.keys()]).toEqual([
      'PENDING',
      'OFFERED',
      'ACTIVE',
      'CANCELLED',
      'EXPIRED',
      'ENDED',
    ]);
    expect([...offers.records.keys()]).toEqual([
      'OFFERED',
      'CONFIRMED',
      'EXPIRED',
    ]);
  });
});
