import { EventProposalsRepository } from '../repositories/event-proposals.repository.js';
import { describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { EventProposalsService } from '../services/event-proposals.service.js';
import { CreateProposalSchema } from '../requests/create-proposal.request.js';

const valid = { title: 'Python', description: 'Taller práctico', categoryId: '11111111-1111-4111-8111-111111111111', eventDate: '2026-12-12', startTime: '09:00', endTime: '12:00', capacity: '31', modality: 'presencial', location: 'Aula 1' };
function setup() {
  const record = { id: randomUUID(), supportThreshold: 16, votingDeadline: new Date('2026-12-01T12:00:00Z'), proposalHash: '' };
  const tx = { user: { findFirst: vi.fn().mockResolvedValue({ firstName: 'Ana', lastName: 'López' }) }, eventCategory: { findUnique: vi.fn().mockResolvedValue({ id: valid.categoryId }) }, eventStatus: { upsert: vi.fn().mockResolvedValue({ id: 'status' }) }, eventOrigin: { upsert: vi.fn().mockResolvedValue({ id: 'origin' }) }, eventModality: { upsert: vi.fn().mockResolvedValue({ id: 'modality' }) }, event: { create: vi.fn().mockImplementation(({ data }) => { Object.assign(record, data); return record; }) } };
  const prisma = { event: { findUnique: vi.fn().mockResolvedValue(null), findFirst: vi.fn() }, $transaction: vi.fn((fn) => fn(tx)) };
  const files = { validate: vi.fn().mockReturnValue({ buffer: Buffer.from('validated image'), detectedMimeType: 'image/png' }) };
  return { tx, prisma, record, files, service: new EventProposalsService(new EventProposalsRepository(prisma as never), files as never) };
}
describe('Workshop proposal validation and persistence', () => {
  it.each([{ title: '' }, { title: 'a'.repeat(81) }, { description: 'a'.repeat(301) }, { capacity: '1.5' }, { eventDate: '2026-02-30' }, { endTime: '08:59' }, { modality: 'virtual', location: 'javascript:alert(1)' }, { authorId: randomUUID() }])('rejects invalid or forged values: %j', (change) => {
    expect(CreateProposalSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
  it('atomically saves the authenticated author, image, voting status, threshold and deadline', async () => {
    const { service, tx } = setup();
    const before = Date.now();
    const result = await service.create('author', valid, undefined, randomUUID());
    const saved = tx.event.create.mock.calls[0][0].data;
    expect(saved).toMatchObject({ createdById: 'author', instructorName: 'Ana López', capacity: 31, supportThreshold: 16, statusId: 'status', coverMimeType: 'image/png' });
    expect(saved.votingDeadline.getTime()).toBeGreaterThanOrEqual(before + 10 * 86400000);
    expect(tx.eventStatus.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { title: 'En votación' } }));
    expect(result.status).toBe('voting');
  });
  it('replays an identical operation without creating twice and rejects changed content', async () => {
    const { service, prisma, record, tx } = setup();
    const key = randomUUID();
    const first = await service.create('author', valid, undefined, key);
    prisma.event.findUnique.mockResolvedValue(record);
    expect(await service.create('author', valid, undefined, key)).toEqual(first);
    await expect(service.create('author', { ...valid, title: 'Other' }, undefined, key)).rejects.toMatchObject({ statusCode: 409, code: 'PROPOSAL_KEY_CONFLICT' });
    expect(tx.event.create).toHaveBeenCalledTimes(1);
  });
  it('rejects users without the active titulado role', async () => {
    const { service, tx } = setup(); tx.user.findFirst.mockResolvedValue(null);
    await expect(service.create('author', valid, undefined, randomUUID())).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN_ROLE' });
    expect(tx.event.create).not.toHaveBeenCalled();
  });
  it('rejects a category missing from the database', async () => {
    const { service, tx } = setup(); tx.eventCategory.findUnique.mockResolvedValue(null);
    await expect(service.create('author', valid, undefined, randomUUID())).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR', errors: [{ field: 'categoryId', message: 'Selecciona una categoría disponible.' }] });
    expect(tx.event.create).not.toHaveBeenCalled();
  });
  it('sirve la portada de propuestas vencidas y de ambos estados de votación', async () => {
    const { service, prisma } = setup();
    prisma.event.findFirst.mockResolvedValue({ coverData: new Uint8Array([1, 2, 3]), coverMimeType: 'image/png' });

    await expect(service.cover(randomUUID())).resolves.toMatchObject({ content: Buffer.from([1, 2, 3]), mimeType: 'image/png' });
    expect(prisma.event.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: { title: { in: ['Publicado', 'Votacion', 'En votación', 'Vencido'] } } }),
    }));
  });
});
