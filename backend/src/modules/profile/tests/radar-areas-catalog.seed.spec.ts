import { describe, expect, it, vi } from 'vitest';
import { RADAR_AREAS } from '../constants/radar-areas.constants.js';
import { seedRadarAreasCatalog } from '../seeds/radar-areas-catalog.seed.js';

describe('seedRadarAreasCatalog', () => {
  it('seeds the 6 canonical radar areas with skipDuplicates', async () => {
    const tx = {
      radarArea: {
        createMany: vi.fn().mockResolvedValue({ count: 6 }),
      },
    };

    await seedRadarAreasCatalog(tx as never);

    expect(tx.radarArea.createMany).toHaveBeenCalledWith({
      data: RADAR_AREAS.map((area) => ({
        id: area.id,
        name: area.name,
        description: area.description,
      })),
      skipDuplicates: true,
    });
  });
});
