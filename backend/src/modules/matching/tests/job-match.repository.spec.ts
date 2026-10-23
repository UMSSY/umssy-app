import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';
 
describe('JobMatchRepository', () => {
  let prisma: { jobOffer: { findFirst: ReturnType<typeof vi.fn> } };
  let repository: JobMatchRepository;
 
  beforeEach(() => {
    prisma = { jobOffer: { findFirst: vi.fn() } };
    repository = new JobMatchRepository(prisma as unknown as PrismaService);
  });
 
  it('busca una vacante publicada y vigente por id', async () => {
    const now = new Date('2026-11-02T15:00:00.000Z');
    const record = { id: 'offer-1' };
    prisma.jobOffer.findFirst.mockResolvedValue(record);
 
    await expect(repository.findPublishedById('offer-1', now)).resolves.toBe(
      record,
    );
    expect(prisma.jobOffer.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'offer-1',
        status: { title: 'Publicada' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: JOB_MATCH_SELECT,
    });
  });
 
  it('devuelve null si la vacante no existe, no está publicada o venció', async () => {
    prisma.jobOffer.findFirst.mockResolvedValue(null);
 
    await expect(
      repository.findPublishedById('missing', new Date()),
    ).resolves.toBeNull();
  });
});
