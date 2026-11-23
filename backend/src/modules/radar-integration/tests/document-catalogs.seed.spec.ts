import { describe, expect, it, vi } from 'vitest';
import { seedCatalogStages } from '../../../common/database/catalog-stages.js';
import type { Prisma } from '../../../prisma/client.js';
import { seedRadarDocumentStatusesCatalog } from '../seeds/radar-document-statuses-catalog.seed.js';
import { seedRadarDocumentSourceTypesCatalog } from '../seeds/radar-document-source-types-catalog.seed.js';
import { RADAR_DOCUMENT_STATUSES } from '../constants/radar-document-statuses.constants.js';
import { RADAR_DOCUMENT_SOURCE_TYPES } from '../constants/radar-document-source-types.constants.js';

describe('Catálogos documentales', () => {
  it('incluye ambos catálogos en las etapas comunes de producción y desarrollo', async () => {
    const statusWrite = vi.fn();
    const sourceWrite = vi.fn();
    const tx = new Proxy(
      {},
      {
        get: (_target, key) => ({
          createMany:
            key === 'radarDocumentStatus'
              ? statusWrite
              : key === 'radarDocumentSourceType'
                ? sourceWrite
                : vi.fn(),
        }),
      },
    ) as Prisma.TransactionClient;
    await seedCatalogStages(tx);
    expect(statusWrite).toHaveBeenCalledExactlyOnceWith({
      data: [...RADAR_DOCUMENT_STATUSES],
      skipDuplicates: true,
    });
    expect(sourceWrite).toHaveBeenCalledExactlyOnceWith({
      data: [...RADAR_DOCUMENT_SOURCE_TYPES],
      skipDuplicates: true,
    });
  });
  it.each([
    {
      seed: seedRadarDocumentStatusesCatalog,
      delegate: 'radarDocumentStatus',
      rows: RADAR_DOCUMENT_STATUSES,
    },
    {
      seed: seedRadarDocumentSourceTypesCatalog,
      delegate: 'radarDocumentSourceType',
      rows: RADAR_DOCUMENT_SOURCE_TYPES,
    },
  ])(
    'completa $delegate sin reemplazar registros existentes',
    async ({ seed, delegate, rows }) => {
      const existing = {
        ...rows[0],
        id: '10000000-0000-4000-8000-000000000001',
        description: 'Administrada',
      };
      const records = new Map<
        string,
        { id: string; title: string; description: string }
      >([[existing.title, existing]]);
      const createMany = vi.fn(
        async ({
          data,
          skipDuplicates,
        }: {
          data: { id: string; title: string; description: string }[];
          skipDuplicates: boolean;
        }) => {
          for (const row of data) {
            if (records.has(row.title) && skipDuplicates) continue;
            records.set(row.title, row);
          }
        },
      );
      const tx = {
        [delegate]: { createMany },
      } as unknown as Prisma.TransactionClient;
      await seed(tx);
      await seed(tx);
      expect(records.size).toBe(rows.length);
      expect(records.get(existing.title)).toBe(existing);
      expect(createMany).toHaveBeenCalledWith({
        data: [...rows],
        skipDuplicates: true,
      });
      expect([...records.keys()]).toEqual(rows.map((row) => row.title));
    },
  );
});
