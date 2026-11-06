import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../common/prisma/prisma.service.js';
import { RadarAuditRepository } from './radar-audit.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const metadata = { documentFileName: 'proof.pdf', documentMimeType: 'application/pdf', documentSizeBytes: 12, documentUploadedAt: new Date('2026-10-27T00:00:00Z') };

describe('Existing radar audit document metadata', () => {
  it('writes the receipt and deletion marker through the supplied transaction', async () => {
    const db = { $executeRaw: vi.fn().mockResolvedValue(1) };
    const tx = { $executeRaw: vi.fn().mockResolvedValue(1) };
    const repository = new RadarAuditRepository(db as unknown as PrismaService);
    await repository.saveDocumentMetadata(userId, id, metadata, tx as unknown as PrismaService);
    expect(tx.$executeRaw.mock.calls[0].slice(1)).toEqual([userId, userId, id, JSON.stringify(metadata)]);
    await repository.saveDocumentMetadata(userId, id, null, tx as unknown as PrismaService);
    expect(tx.$executeRaw.mock.calls[1].at(-1)).toBe('{"removed":true}');
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it('scopes lookups to the owner and returns only usable latest metadata', async () => {
    const db = { $queryRaw: vi.fn().mockResolvedValue([
      { target_id: id, details: { ...metadata, documentUploadedAt: metadata.documentUploadedAt.toISOString() } },
      { target_id: 'removed', details: { removed: true } },
      { target_id: 'missing-name', details: { ...metadata, documentFileName: '' } },
      { target_id: 'missing-mime', details: { ...metadata, documentMimeType: '' } },
      { target_id: 'missing-size', details: { ...metadata, documentSizeBytes: null } },
      { target_id: 'missing-date', details: { ...metadata, documentUploadedAt: '' } },
      { target_id: 'invalid-date', details: { ...metadata, documentUploadedAt: 'invalid' } },
    ]) };
    const repository = new RadarAuditRepository(db as unknown as PrismaService);
    expect(await repository.findDocumentMetadata(userId, [id])).toEqual(new Map([[id, metadata]]));
    expect(db.$queryRaw.mock.calls[0][1]).toBe(userId);
    expect(db.$queryRaw.mock.calls[0][0].join('')).toContain('ORDER BY target_id,occurred_at DESC,id DESC');
  });

  it('does not query for an empty certification list', async () => {
    const db = { $queryRaw: vi.fn() };
    expect(await new RadarAuditRepository(db as unknown as PrismaService).findDocumentMetadata(userId, [])).toEqual(new Map());
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });
});
