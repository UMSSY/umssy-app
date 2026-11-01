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
  it.each(['', '   ', '... ---', 'a'.repeat(151)])('rejects invalid physical locations: %s', (location) => {
    expect(CreateProposalSchema.safeParse({ ...valid, location }).success).toBe(false);
  });
  it.each(['Auditorio central', 'Edificio de Tecnología, piso 2, laboratorio 1', 'a'.repeat(150)])('accepts clear or boundary locations: %s', (location) => {
    expect(CreateProposalSchema.safeParse({ ...valid, location }).success).toBe(true);
  });
  it.each(['19', '61'])('rejects capacity outside the form range: %s', (capacity) => {
    expect(CreateProposalSchema.safeParse({ ...valid, capacity }).success).toBe(false);
  });
  it('keeps long virtual meeting URLs valid', () => {
    expect(CreateProposalSchema.safeParse({ ...valid, modality: 'virtual', location: 'https://example.org/' + 'a'.repeat(160) }).success).toBe(true);
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
    await expect(service.create('author', valid, undefined, randomUUID())).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR', errors: [{ field: 'categoryId', message: 'Esta categoría ya no está disponible. Elige otra.' }] });
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

describe('Basic proposal text validation', () => {
  it.each(['   ', '12345', '!!!', '123 - !!!', 'aaaaaa', 'A a A a', 'ññññ'])('rejects non-text or repeated content: %s', (text) => {
    const result = CreateProposalSchema.safeParse({ ...valid, title: text, description: text });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map(issue => issue.path[0])).toEqual(expect.arrayContaining(['title', 'description']));
  });
  it.each(['C++', 'C# y .NET', 'Diseño UX/UI', 'Python 3: introducción', 'Excel', 'Línea uno.\nLínea dos.'])('accepts technical names and punctuation: %s', (text) => {
    expect(CreateProposalSchema.safeParse({ ...valid, title: text, description: text }).success).toBe(true);
  });
  it('trims outer spaces and preserves description line breaks', () => {
    const result = CreateProposalSchema.parse({ ...valid, title: '  Python  ', description: '  Primera línea.\nSegunda línea.  ' });
    expect(result.title).toBe('Python');
    expect(result.description).toBe('Primera línea.\nSegunda línea.');
  });
});

describe('Location and meeting link structure', () => {
  it.each([
    ['presencial', ', Auditorio central'],
    ['presencial', 'Edificio B,'],
    ['presencial', 'Edificio B,, aula 2'],
    ['presencial', 'Edificio B, , aula 2'],
    ['presencial', 'Edificio B, !!!, aula 2'],
    ['presencial', '12345'],
    ['virtual', 'http://meet.example.org/room'],
    ['virtual', 'meet.example.org/room'],
    ['virtual', 'https:/meet.example.org/room'],
    ['virtual', 'https:///meet.example.org/room'],
    ['virtual', 'https://'],
    ['virtual', 'https://meet.example.org/my room'],
    ['virtual', 'https://user:password@meet.example.org/room'],
    ['virtual', 'https://meet.example.org/' + 'a'.repeat(2000)],
  ] as const)('rejects %s malformed input: %s', (modality, location) => {
    expect(CreateProposalSchema.safeParse({ ...valid, location, modality }).success).toBe(false);
  });
});

describe('Physical location segment limit', () => {
  it.each([
    ['Auditorio central', true],
    ['Facultad de Tecnología, edificio B, piso 2, aula 204', true],
    ['Facultad de Tecnología, edificio B, piso 2, aula 204, puerta norte', false],
  ] as const)('validates segment count: %s', (location, accepted) => {
    expect(CreateProposalSchema.safeParse({ ...valid, location }).success).toBe(accepted);
  });
});

describe('Specific location feedback', () => {
  it.each([
    ['presencial', '', 'Escribe la ubicación del taller.'],
    ['presencial', '123', 'Incluye el nombre del lugar.'],
    ['presencial', ', Aula 1', 'Quita la coma del inicio o del final.'],
    ['presencial', 'Edificio A, , aula 1', 'Completa o elimina la parte vacía entre comas.'],
    ['presencial', 'Edificio A, !!!', 'Reemplaza los símbolos por un lugar o referencia.'],
    ['presencial', 'A, B, C, D, E', 'Usa hasta 4 partes separadas por comas.'],
    ['virtual', '', 'Pega el enlace de la reunión.'],
    ['virtual', 'http://example.org', 'El enlace debe comenzar con https://.'],
    ['virtual', 'https://example.org/my room', 'Quita los espacios del enlace.'],
    ['virtual', 'https://', 'Completa la dirección después de https://.'],
    ['virtual', 'https://user:pass@example.org', 'Usa un enlace sin usuario ni contraseña incluidos.'],
    ['virtual', 'https://[invalid', 'Revisa la dirección del enlace.'],
  ] as const)('explains %s input %s', (modality, location, message) => {
    const result = CreateProposalSchema.safeParse({ ...valid, modality, location });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.filter(issue => issue.path[0] === 'location').map(issue => issue.message)).toEqual([message]);
  });
});
